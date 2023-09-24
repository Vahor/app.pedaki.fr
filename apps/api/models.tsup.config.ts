import cpy from 'cpy';
import execa from 'execa';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  treeshake: true,
  splitting: true,
  entry: ['src/**/*.(schema|model).ts', 'src/index.ts'],
  format: process.env.DTS_ONLY !== undefined ? [] : ['cjs'],
  dts: process.env.NODE_ENV !== 'production',
  sourcemap: true,
  minify: false,
  minifyWhitespace: true,
  keepNames: true,
  clean: false,
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
