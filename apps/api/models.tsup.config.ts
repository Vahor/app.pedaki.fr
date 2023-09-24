import { tsconfigPathsPlugin } from '@pedaki/esbuild-plugin-tsconfig-paths';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(schema|model).ts'],
  format: process.env.DTS_ONLY !== undefined ? [] : ['cjs'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: true,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  clean: false,
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
