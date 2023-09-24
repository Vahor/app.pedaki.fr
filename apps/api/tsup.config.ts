import { tsconfigPathsPlugin } from '@pedaki/esbuild-plugin-tsconfig-paths';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(tsx|ts|cjs)', '!src/**/*.(config|test).(tsx|ts|cjs)'],
  // eslint-disable-next-line
  format: (process.env.API_DTS_ONLY || process.env.DTS_ONLY) ? [] : ['cjs'],
  dts: true,
  sourcemap: true,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  clean: true,
  bundle: false,
  tsconfig: 'tsconfig.json',
  esbuildPlugins: [
    // This plugin is required because there is an issue with tsup when bundle is set to false
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    tsconfigPathsPlugin({
      tsconfig: 'tsconfig.json',
      filter: /src*/,
    }),
  ],
  ...options,
}));
