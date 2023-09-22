import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(tsx|ts|cjs)', '!src/**/*.(config|test).(tsx|ts|cjs)'],
  format: ['cjs'],
  dts: false,
  sourcemap: true,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  clean: true,
  bundle: false,
  ...options,
}));
