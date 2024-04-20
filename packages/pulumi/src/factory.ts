import type { ServerProvider } from "@pedaki/models/resource/provider.model.js";
import type { StackProvider } from "~/type.ts";
import { AwsServerProvider } from "./stack/aws/provider.ts";
import { TestServerProvider } from "./stack/mock/provider.ts";

const providers = {
	aws: new AwsServerProvider(),
	test: new TestServerProvider(),
} as const;

class ServerProviderFactory {
	public getProvider<P extends ServerProvider>(provider: P): StackProvider<P> {
		return providers[provider] as StackProvider<P>;
	}
}

const serverFactory = new ServerProviderFactory();
export { serverFactory };
