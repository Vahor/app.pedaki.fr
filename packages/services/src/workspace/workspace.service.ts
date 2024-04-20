import { generateToken } from "@pedaki/common/utils/random.js";
import { prisma } from "@pedaki/db";
import { logger } from "@pedaki/logger";
import type { CreateWorkspaceInput } from "@pedaki/models/workspace/api-workspace.model.js";
import type {
	WorkspaceData,
	WorkspaceProperties,
	WorkspaceStatus,
} from "@pedaki/models/workspace/workspace.model.js";
import type { Prisma } from "@prisma/client";
import { ProductType } from "@prisma/client";
import {
	DEFAULT_LOGO_URL,
	DEFAULT_MAINTENANCE_WINDOW,
} from "~/workspace/constants.ts";

const WORKSPACE_CREATION_METADATA_VERSION = 1;

class WorkspaceService {
	getHealthStatusUrl(subdomain: string) {
		return `${this.getWorkspaceUrl(subdomain)}/api/health`;
	}

	getWorkspaceUrl(subdomain: string) {
		return `https://${subdomain}.pedaki.fr`;
	}

	getDomainName(subdomain: string) {
		return `${subdomain}.pedaki.fr`;
	}

	/**
	 * Mark a workspace as deleted, this will not delete the workspace.
	 * The column `deletedAt` will be set to the current date.
	 * @param subdomain the workspace subdomain
	 */
	async deleteWorkspaceBySubdomain(subdomain: string): Promise<boolean> {
		logger.info(`Deleting workspace '${subdomain}'`);
		try {
			await prisma.workspace.update({
				where: {
					subdomain,
				},
				data: {
					subdomain: null,
					deletedAt: new Date(),
				},
				select: {
					id: true,
				},
			});
			return true;
		} catch (error) {
			logger.error(`Workspace '${subdomain}' not found`);
			return false;
		}
	}

	async getLatestSubscription(
		subdomain: string,
	): Promise<{ subscriptionId: number; workspaceId: string } | null> {
		logger.info(`Getting latest subscription id for workspace '${subdomain}'`);
		const subscription = await prisma.workspaceSubscription.findFirst({
			where: {
				workspace: {
					subdomain,
					deletedAt: null,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				workspaceId: true,
			},
		});
		logger.debug("DEBUG: subscription", { subscription });
		return subscription
			? {
					subscriptionId: subscription.id,
					workspaceId: subscription.workspaceId,
				}
			: null;
	}

	async createWorkspace({
		workspace,
		subscription,
	}: {
		workspace: Pick<CreateWorkspaceInput, "name" | "subdomain"> & {
			billing: Pick<CreateWorkspaceInput["billing"], "name" | "email">;
		} & {
			creationData: Omit<WorkspaceData, "workspace" | "server"> & {
				server: Omit<WorkspaceData["server"], "environment_variables">;
			};
		} & {
			defaultLanguage: string;
		};
		subscription: {
			customerId: string;
			subscriptionId: string;
			currentPeriodStart: Date;
			currentPeriodEnd: Date;
		};
	}): Promise<{
		workspaceId: string;
		subscriptionId: number;
		authToken: string;
	}> {
		const profiler = logger.startTimer();

		logger.info(`Creating workspace (database) '${workspace.subdomain}'...`);
		const { id, subscriptions } = await prisma.workspace.create({
			data: {
				name: workspace.name,
				subdomain: workspace.subdomain,

				contactEmail: workspace.billing.email,
				contactName: workspace.billing.name,
				defaultLanguage: workspace.defaultLanguage,
				maintenanceWindow: DEFAULT_MAINTENANCE_WINDOW,
				currentMaintenanceWindow: DEFAULT_MAINTENANCE_WINDOW,

				stripeCustomerId: subscription.customerId,
				expectedStatus: "CREATING",
				members: {
					create: {
						email: workspace.billing.email,
					},
				},
				subscriptions: {
					create: [
						{
							type: ProductType.HOSTING,
							stripeSubscriptionId: subscription.subscriptionId,
							currentPeriodStart: subscription.currentPeriodStart,
							currentPeriodEnd: subscription.currentPeriodEnd,
							workspaceCreationData: {
								version: WORKSPACE_CREATION_METADATA_VERSION,
								...workspace.creationData,
							} as Prisma.JsonObject,
						},
					],
				},
			},
			select: {
				id: true,
				subscriptions: {
					select: {
						id: true,
					},
				},
			},
		});
		const subscriptionId = subscriptions[0]!.id;

		logger.info(
			"Updating workspace creation data on subscription and generating token...",
		);
		// Create token for the workspace
		const token = await this.registerNewWorkspaceToken({ workspaceId: id });

		// Update subscription
		await prisma.workspaceSubscription.update({
			where: {
				id: subscriptionId,
			},
			data: {
				workspaceCreationData: {
					version: WORKSPACE_CREATION_METADATA_VERSION,
					...workspace.creationData,
					workspace: {
						subdomain: workspace.subdomain,
						subscriptionId,
					},
				} as Prisma.JsonObject,
			},
		});

		profiler.done({
			message: `Workspace created (database) '${workspace.subdomain}'`,
		});

		return { workspaceId: id, subscriptionId, authToken: `${id}:${token}` };
	}

	async registerNewWorkspaceToken({ workspaceId }: { workspaceId: string }) {
		logger.info(
			`Registering new workspace token (database) '${workspaceId}'...`,
		);
		const token = this.#generateAuthToken();
		await prisma.workspaceToken.create({
			data: {
				token,
				workspace: {
					connect: {
						id: workspaceId,
					},
				},
			},
		});
		return token;
	}

	async deleteOldWorkspaceTokens({ workspaceId }: { workspaceId: string }) {
		// TODO: call this method once the server is up and running
		logger.info(`Deleting old workspace tokens (database) '${workspaceId}'...`);

		const mostRecentToken = await prisma.workspaceToken.findFirst({
			where: {
				workspaceId,
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
			},
		});

		if (!mostRecentToken) {
			logger.warn(`No token found for workspace '${workspaceId}'`);
			return;
		}

		const response = await prisma.workspaceToken.deleteMany({
			where: {
				workspaceId,
				NOT: {
					id: mostRecentToken.id,
				},
			},
		});

		logger.info(`Deleted ${response.count} old workspace tokens`);
	}

	async getWorkspaceId(subdomain: string) {
		logger.info(`Getting workspace id for workspace '${subdomain}'`);
		const workspace = await prisma.workspace.findUnique({
			where: {
				subdomain,
			},
			select: {
				id: true,
			},
		});
		if (!workspace) {
			throw new Error(`Workspace '${subdomain}' not found`);
		}
		return workspace.id;
	}

	async updateWorkspaceSubscriptionStripeData({
		subscriptionId,
		currentPeriodStart,
		currentPeriodEnd,
		endedAt,
		cancelAt,
		canceledAt,
	}: {
		subscriptionId: number;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		endedAt: Date | null;
		cancelAt: Date | null;
		canceledAt: Date | null;
	}) {
		logger.info(`Updating workspace subscription '${subscriptionId}'...`);
		await prisma.workspaceSubscription.update({
			where: {
				id: subscriptionId,
			},
			data: {
				currentPeriodStart,
				currentPeriodEnd,
				endedAt,
				cancelAt,
				canceledAt,
			},
		});
	}

	async updateCurrentStatus({
		workspaceId,
		status,
	}: {
		workspaceId: string;
		status: WorkspaceStatus;
	}) {
		logger.info(
			`Updating workspace status (current) '${workspaceId}'... (status: ${status})`,
		);

		await prisma.workspace.update({
			where: {
				id: workspaceId,
			},
			data: {
				currentStatus: status,
			},
		});
	}

	async updateExpectedStatus({
		workspaceId,
		status,
		whereStatus = undefined,
	}: {
		workspaceId: string;
		status: WorkspaceStatus;
		whereStatus?: WorkspaceStatus;
	}) {
		logger.info(
			`Updating workspace status (expected) '${workspaceId}'... (status: ${status})`,
		);

		await prisma.workspace.update({
			where: {
				id: workspaceId,
				expectedStatus: whereStatus,
			},
			data: {
				expectedStatus: status,
			},
		});
	}

	async updateSettings({
		workspaceId,
		settings,
	}: {
		workspaceId: string;
		settings: Partial<WorkspaceProperties>;
	}) {
		logger.info(`Updating workspace settings '${workspaceId}'...`);
		if (Object.keys(settings).length === 0) {
			throw new Error("No settings provided");
		}

		const newSettings = {
			...settings,
			currentMaintenanceWindow: undefined, // We don't want to update this field
		};

		await prisma.workspace.update({
			where: {
				id: workspaceId,
			},
			data: newSettings,
		});
	}

	#generateAuthToken() {
		return generateToken();
	}
}

const workspaceService = new WorkspaceService();
export { workspaceService };
