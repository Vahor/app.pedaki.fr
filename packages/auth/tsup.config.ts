import cpy from 'cpy';
import execa from 'execa';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  outDir: 'dist',
  entry: ['src/**/*.(tsx|ts|cjs)'],
  format: process.env.DTS_ONLY ? [] : ['cjs'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: process.env.DTS_ONLY !== undefined,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  clean: true,
  bundle: false,
  onSuccess: async () => {
    await cpy('package.json', 'dist');
    await execa.command('pwd', { stdout: process.stdout, stderr: process.stderr });
    await execa.command('pnpm exec tsconfig-replace-paths', {
      stdout: process.stdout,
      stderr: process.stderr,
    });
  },
  ...options,
}));
