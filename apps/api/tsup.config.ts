import cpy from 'cpy';
import execa from 'execa';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(tsx|ts|cjs)', '!src/**/*.(config|test).(tsx|ts|cjs)'],
  format:
    process.env.API_DTS_ONLY !== undefined || process.env.DTS_ONLY !== undefined ? [] : ['cjs'],
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
    await execa.command('pnpm exec tsconfig-replace-paths', {
      stdout: process.stdout,
      stderr: process.stderr,
    });
  },
  ...options,
}));
