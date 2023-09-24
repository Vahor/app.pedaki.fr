import cpy from 'cpy';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(tsx|ts|cjs)'],
  format: ['cjs'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: true,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  clean: true,
  bundle: false,
  tsconfig: 'tsconfig.json',
  onSuccess: async () => {
    await cpy('package.json', 'dist');
  },
  ...options,
}));
