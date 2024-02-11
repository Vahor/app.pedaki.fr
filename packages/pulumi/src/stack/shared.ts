import { logger } from '@pedaki/logger';
import type {
  InlineProgramArgs,
  LocalWorkspaceOptions,
  PulumiFn,
} from '@pulumi/pulumi/automation/index.js';
import { LocalWorkspace } from '@pulumi/pulumi/automation/index.js';
import { projectName } from '~/stack/constants.ts';

const stackName = (name: string) => `${name}`;

export class PulumiUtils {
  private static prepareStackOptions(program: PulumiFn): LocalWorkspaceOptions {
    return {
      program: program,
    };
  }

  private static prepareInlineProgram(name: string, program: PulumiFn): InlineProgramArgs {
    return {
      stackName: stackName(name),
      projectName,
      program,
    };
  }

  public static async createOrSelectStack(name: string, program: PulumiFn) {
    const finalName = stackName(name);
    logger.info(`Creating or selecting stack ${finalName}...`);
    return await LocalWorkspace.createOrSelectStack(
      this.prepareInlineProgram(finalName, program),
      this.prepareStackOptions(program),
    );
  }

  public static async selectStack(name: string, program: PulumiFn) {
    const finalName = stackName(name);
    return await LocalWorkspace.selectStack(
      this.prepareInlineProgram(finalName, program),
      this.prepareStackOptions(program),
    );
  }

  public static async deleteStack(name: string, program: PulumiFn) {
    logger.info(`Deleting stack ${name}...`);
    let stack;
    try {
      stack = await this.selectStack(name, program);
    } catch (error) {
      console.error(`Stack ${name} not found`);
      return;
    }

    await stack.refresh();
    await stack.destroy();
    await stack.workspace.removeStack(stack.name);
    return stack;
  }
}
