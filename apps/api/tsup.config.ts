import cpy from "cpy";
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { execaCommand } from "execa";
import type { Options } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
	treeshake: true,
	splitting: true,
	entry: ["src/**/*.(tsx|ts|cjs)", "!src/**/*.(config|test).(tsx|ts|cjs)"],
	format:
		process.env.API_DTS_ONLY !== undefined || process.env.DTS_ONLY !== undefined
			? []
			: ["esm"],
	dts: process.env.NODE_ENV !== "production",
	sourcemap: process.env.DTS_ONLY !== undefined,
	minify: false,
	minifyWhitespace: true,
	platform: "node",
	keepNames: true,
	bundle: false,
	tsconfig: "tsconfig.json",
	external: ["@prisma/client", "@trpc/server"],
	plugins: [esbuildPluginFilePathExtensions({ esmExtension: "js" })],
	onSuccess: async () => {
		await cpy("package.json", "dist");
		await execaCommand("pnpm exec tsconfig-replace-paths", {
			stdout: process.stdout,
			stderr: process.stderr,
		});
		await execaCommand("node ../../scripts/fix-ts-paths.js", {
			stdout: process.stdout,
			stderr: process.stderr,
		});
	},
	...options,
}));
