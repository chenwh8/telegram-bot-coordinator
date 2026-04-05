import dotenv from "dotenv";
import { BotConfig } from "./types";

dotenv.config();

/**
 * Load bot configurations from environment variables.
 *
 * Reads `BOT_<NAME>_TOKEN` variables from the environment.
 * For example, `BOT_ALPHA_TOKEN=abc123` registers a bot named `alpha`.
 * Polling is enabled for all bots loaded from environment.
 *
 * @returns An array of BotConfig objects derived from the environment.
 */
export function loadBotsFromEnv(): BotConfig[] {
  const configs: BotConfig[] = [];
  const tokenPattern = /^BOT_(.+)_TOKEN$/;

  for (const [key, value] of Object.entries(process.env)) {
    const match = tokenPattern.exec(key);
    if (match && value) {
      configs.push({
        name: match[1].toLowerCase(),
        token: value,
      });
    }
  }

  return configs;
}
