import type {InlineProgramArgs, LocalWorkspaceOptions, PulumiFn} from '@pulumi/pulumi/automation/index.js';
import {LocalWorkspace} from '@pulumi/pulumi/automation/index.js';

export const projectName = 'user-app';
export const organisation = 'pedaki';

const stackName = (name: string) => `premium/${organisation}/${name}`;


export class PulumiUtils {

    private static prepareStackOptions(name: string, program: PulumiFn): LocalWorkspaceOptions {
        return {
            program: program,
            stackSettings: {
                config: {
                    [name]: {
                        environment: {
                            imports: [
                                process.env.AWS_ENVIRONMENT,
                                "ghcr-premium"
                            ],
                        }
                    }
                }
            }
        }
    }

    private static prepareInlineProgram(name: string, program: PulumiFn): InlineProgramArgs {
        return {
            stackName: name,
            projectName,
            program,
        }
    }

    public static async createOrSelectStack(name: string, program: PulumiFn) {
        const finalName = stackName(name);
        return await LocalWorkspace.createOrSelectStack(
            this.prepareInlineProgram(finalName, program),
            this.prepareStackOptions(finalName, program)
        );
    };

    public static async selectStack(name: string, program: PulumiFn) {
        const finalName = stackName(name);
        return await LocalWorkspace.selectStack(
            this.prepareInlineProgram(finalName, program),
            this.prepareStackOptions(finalName, program)
        );
    };

    public static async deleteStack(name: string, program: PulumiFn) {
        const stack = await this.selectStack(name, program);
        await stack.destroy({onOutput: console.info});
        await stack.workspace.removeStack(stack.name);
        return stack;
    };


}
