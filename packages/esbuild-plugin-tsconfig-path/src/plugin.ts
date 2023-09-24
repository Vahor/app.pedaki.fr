import { createMatchPath } from 'tsconfig-paths/lib/index';
import type { Plugin } from 'esbuild';
import ts from 'typescript';
import { DEFAULT_CONFIG_NAME, DEFAULT_FILTER, PLUGIN_NAME } from './constants';
import { getTransformer } from './transformer';
import { TsLibFactory } from './TsLibFactory';

export interface TsconfigPathsPluginOptions {
  filter?: RegExp;
  tsconfig?: string;
  cwd?: string;
}

export function tsconfigPathsPlugin(options?: TsconfigPathsPluginOptions): Plugin {
  const { filter, tsconfig = DEFAULT_CONFIG_NAME, cwd } = options ?? {};
  const tsLib: typeof ts = new TsLibFactory().import();

  const tsconfigPath = tsLib.findConfigFile(cwd || process.cwd(), tsLib.sys.fileExists, tsconfig);

  if (!tsconfigPath) {
    throw new Error(`Could not find a valid '${tsconfig}' file`);
  }

  const { config, error } = tsLib.readConfigFile(tsconfigPath, tsLib.sys.readFile);

  if (error) {
    throw error;
  }

  const { paths = {}, baseUrl = './' } = config?.compilerOptions || {};

  const pathMatcher = createMatchPath(baseUrl!, paths, ['main']);

  const pathsPattern = Object.keys(paths)
      .map(path => path.replace('/', '\\/'))
      .map(path => `(:?${path})`)
      .join('|');
  const filterRegex = new RegExp(`(${pathsPattern})`);

  return {
    name: PLUGIN_NAME,
    setup(build) {
      build.onLoad({ filter: filter || DEFAULT_FILTER }, args => {
        const fromPath = args.path;

        // grep the file to check that it contains a path that needs to be resolved
        const fileContents = tsLib.sys.readFile(fromPath);
        if (!fileContents) {
            return;
        }
        const hasPath = filterRegex.test(fileContents);
        if (!hasPath) {
            return;
        }
        console.log(`[${PLUGIN_NAME}] Fixing path alias in ${fromPath}`);


        const program = tsLib.createProgram([fromPath], {});
        const sourceFile = program.getSourceFile(fromPath);
        const transformer = tsLib.transform(sourceFile, [
          getTransformer({ sourcePath: fromPath, tsLib }, pathMatcher),
        ]);

        const printer = tsLib.createPrinter({ newLine: tsLib.NewLineKind.LineFeed });
        const code = printer.printFile(transformer.transformed[0]);

        return {
          contents: code,
          loader: 'ts',
        };
      });
    }
  };
}
