// @ts-ignore
import packageJson from '../package.json' assert { type: 'json' };
import { env } from './env.js';

export const VERSION = env.APP_VERSION ?? packageJson.version;
