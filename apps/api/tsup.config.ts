import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: [
    'src/**/*.(tsx|ts|cjs)',
    '!src/**/*.(config|test).(tsx|ts|cjs)',
    '!src/**/*.(schema|model).ts',
  ],
  format:
    process.env.API_DTS_ONLY !== undefined || process.env.DTS_ONLY !== undefined ? [] : ['esm'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: process.env.DTS_ONLY !== undefined,
  minify: false,
  minifyWhitespace: true,
  platform: 'node',
  keepNames: true,
  clean: true,
  bundle: false,
  tsconfig: 'tsconfig.json',
  plugins: [esbuildPluginFilePathExtensions({ esmExtension: 'js' })],
  ...options,
}));
