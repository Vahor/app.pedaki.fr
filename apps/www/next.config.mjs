import {env} from "./src/env.mjs";
import million from "million/compiler";

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,

    swcMinify: true,
    poweredByHeader: false,
    experimental: {
        serverActions: true,
        esmExternals: true,
    },

    images: {
        domains: ["pedaki.fr"],
    },

    redirects: async () => [
    ],

    modularizeImports: {
        "@pedaki/design/ui/icons": {
            transform: "@pedaki/design/ui/icons/{{member}}",
            preventFullImport: true,
        },
        "@pedaki/common/hooks": {
            transform: "@pedaki/common/hooks/{{member}}",
            preventFullImport: true,
            skipDefaultConversion: true,
        }
    },

    compiler: {
        // removeConsole: process.env.NODE_ENV === "production"
    },

    eslint: {
        // Already checked in ci
        ignoreDuringBuilds: true
    },

    typescript: {
        // Already checked in ci
        ignoreBuildErrors: true
    }

};

// million is not needed here, it's just a test to see if it works
//  before adding it to the other apps
export default million.next(config, {
    auto: {rsc: true},
    mute: true,
});
