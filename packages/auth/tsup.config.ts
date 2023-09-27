import cpy from 'cpy';
import { execaCommand } from 'execa';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  outDir: 'dist',
  entry: ['src/**/*.(tsx|ts|cjs)', '!src/reset.d.ts'],
  format: process.env.DTS_ONLY ? [] : ['esm'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: process.env.DTS_ONLY !== undefined,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  platform: 'node',
  clean: true,
  bundle: true,
  external: ['next-auth'],
  onSuccess: async () => {
    await cpy('package.json', 'dist');
    await execaCommand('pwd', { stdout: process.stdout, stderr: process.stderr });
    await execaCommand('pnpm exec tsconfig-replace-paths', {
      stdout: process.stdout,
      stderr: process.stderr,
    });
  },
  ...options,
}));
