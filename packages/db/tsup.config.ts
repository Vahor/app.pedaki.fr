import cpy from 'cpy';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(tsx|ts|cjs)'],
  format: process.env.DTS_ONLY ? [] : ['esm'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: process.env.DTS_ONLY !== undefined,
  minify: true,
  minifyWhitespace: true,
  keepNames: true,
  platform: 'node',
  clean: true,
  bundle: true,
  external: [
      "@prisma/client",
      ".prisma/client",
      ],
  onSuccess: async () => {
    await cpy('package.json', 'dist');
  },
  ...options,
}));
