/// api:dev: {"stacks":[{"orgName":"pedaki","projectName":"user-app","stackName":"string","lastUpdate":1694625930,"resourceCount":4}]}
import {z} from "zod";

interface StackListResponse {
    stacks: {
        orgName: string;
        projectName: string;
        stackName: string;
        lastUpdate: number;
        resourceCount: number;
    }[];
}

interface StackDataResponse {
    orgName: string;
    projectName: string;
    stackName: string;
    activeUpdate: string;
    tags: Record<string, string>;
    version: number;
}

export const OutputsSchema = z.object({
    machinePublicIp: z.string(),
    publicHostName: z.string(),
});
export type Outputs = z.infer<typeof OutputsSchema>;

export const ResourceSchema = z.object({
    type: z.string(),
    outputs: OutputsSchema,
});
export type Resource = z.infer<typeof ResourceSchema>;

export const DeploymentSchema = z.object({
    resources: z.array(ResourceSchema),
});
export type Deployment = z.infer<typeof DeploymentSchema>;

export const StackStateResponseSchema = z.object({
    version: z.number(),
    deployment: DeploymentSchema,
});
export type StackStateResponse = z.infer<typeof StackStateResponseSchema>;

export class PulumiApi {
    private static listStacks = async (): Promise<StackListResponse['stacks']> => {
        const result = await fetch('https://api.pulumi.com/api/user/stacks?organization=pedaki', {
            headers: {
                Authorization: `token ${process.env.PULUMI_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        // TODO: check for errors and validate response
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return ((await result.json())).stacks as StackListResponse['stacks'];
    };

    private static getStackData = async (
        stackName: string,
        organization: string,
        project: string,
    ): Promise<StackDataResponse> => {
        const result = await fetch(
            `https://api.pulumi.com/api/stacks/${organization}/${project}/${stackName}`,
            {
                headers: {
                    Authorization: `token ${process.env.PULUMI_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        // TODO: check for errors and validate response
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return (await result.json());
    };

    public static getStackState = async (
        stackName: string,
        organization: string,
        project: string,
    ): Promise<StackStateResponse> => {
        // GET /api/stacks/{organization}/{project}/{stack}/export
        const result = await fetch(
            `https://api.pulumi.com/api/stacks/${organization}/${project}/${stackName}/export`,
            {
                headers: {
                    Authorization: `token ${process.env.PULUMI_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        // TODO: check for errors and validate response
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return (await result.json());
    };

    private static flatOutputs = (ressources: Resource[]): Record<string, string> => {
        return ressources.reduce((acc, curr) => {
            return {
                ...acc,
                ...curr.outputs,
            };
        }, {});
    };

    public static listStacksWithProperties = async (): Promise<
        {
            name: string;
            outputs: Record<string, string>;
        }[]
    > => {
        const stacks = await this.listStacks();

        return await Promise.all(
            stacks.map(async stack => {
                const data = await this.getStackData(stack.stackName, stack.orgName, stack.projectName);
                const state = await this.getStackState(stack.stackName, stack.orgName, stack.projectName);
                const outputs = this.flatOutputs(
                    state.deployment.resources.filter(r => r.type === 'pulumi:pulumi:Stack'),
                );
                return {
                    name: stack.stackName,
                    outputs,
                };
            }),
        );
    };
}