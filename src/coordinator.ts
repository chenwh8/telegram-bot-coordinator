import { Bot, Context, Filter, FilterQuery } from "grammy";
import {
  BotConfig,
  BroadcastTarget,
  CoordinatorOptions,
  CommandCallback,
  FilterCallback,
  TextCallback,
} from "./types";

/**
 * BotCoordinator manages multiple Telegram bot instances, providing a
 * unified interface for registering bots, attaching message handlers,
 * and broadcasting messages across bots.
 */
export class BotCoordinator {
  private bots: Map<string, Bot> = new Map();
  private configs: Map<string, BotConfig> = new Map();

  constructor(options: CoordinatorOptions = {}) {
    if (options.bots) {
      for (const config of options.bots) {
        this.register(config);
      }
    }
  }

  /**
   * Register a new bot with the coordinator.
   *
   * @param config - Bot configuration.
   * @throws {Error} If a bot with the same name is already registered.
   */
  register(config: BotConfig): void {
    if (this.bots.has(config.name)) {
      throw new Error(`Bot "${config.name}" is already registered.`);
    }
    const bot = new Bot(config.token);
    this.bots.set(config.name, bot);
    this.configs.set(config.name, config);
  }

  /**
   * Unregister a bot, stopping it first if it is running.
   *
   * @param name - Name of the bot to unregister.
   * @throws {Error} If no bot with that name is registered.
   */
  async unregister(name: string): Promise<void> {
    this.assertRegistered(name);
    await this.stopBot(name);
    this.bots.delete(name);
    this.configs.delete(name);
  }

  /**
   * Add a handler for a specific bot using grammy's filter query syntax.
   *
   * @param botName - Name of the registered bot.
   * @param filter - grammy filter query (e.g. `"message:text"`).
   * @param callback - Handler callback.
   */
  addHandler(
    botName: string,
    filter: FilterQuery | FilterQuery[],
    callback: FilterCallback
  ): void {
    this.assertRegistered(botName);
    const bot = this.bots.get(botName)!;
    bot.on(
      filter as FilterQuery,
      callback as (ctx: Filter<Context, FilterQuery>) => void | Promise<void>
    );
  }

  /**
   * Add a text/pattern handler via `bot.hears`.
   *
   * @param botName - Name of the registered bot.
   * @param pattern - String or RegExp to match against message text.
   * @param callback - Handler callback.
   */
  addTextHandler(
    botName: string,
    pattern: string | RegExp,
    callback: TextCallback
  ): void {
    this.assertRegistered(botName);
    const bot = this.bots.get(botName)!;
    bot.hears(pattern, callback as Parameters<typeof bot.hears>[1]);
  }

  /**
   * Add a command handler via `bot.command`.
   *
   * @param botName - Name of the registered bot.
   * @param command - Command string(s) without leading slash.
   * @param callback - Handler callback.
   */
  addCommandHandler(
    botName: string,
    command: string | string[],
    callback: CommandCallback
  ): void {
    this.assertRegistered(botName);
    const bot = this.bots.get(botName)!;
    bot.command(command, callback as Parameters<typeof bot.command>[1]);
  }

  /**
   * Start polling for a single bot.
   *
   * @param name - Name of the registered bot to start.
   * @returns A promise that resolves when the bot stops.
   */
  startBot(name: string): Promise<void> {
    this.assertRegistered(name);
    const bot = this.bots.get(name)!;
    return bot.start();
  }

  /**
   * Stop polling for a single bot.
   *
   * @param name - Name of the registered bot to stop.
   */
  async stopBot(name: string): Promise<void> {
    this.assertRegistered(name);
    const bot = this.bots.get(name)!;
    await bot.stop();
  }

  /**
   * Start polling for all registered bots concurrently.
   * Returns a promise that resolves when all bots stop.
   */
  startAll(): Promise<void[]> {
    const starts = Array.from(this.bots.keys()).map((name) =>
      this.startBot(name)
    );
    return Promise.all(starts);
  }

  /**
   * Stop polling for all registered bots.
   */
  async stopAll(): Promise<void> {
    const stops = Array.from(this.bots.keys()).map((name) =>
      this.stopBot(name)
    );
    await Promise.all(stops);
  }

  /**
   * Send a text message via a specific bot to one or more chat IDs.
   *
   * @param targets - One or more broadcast targets.
   * @param text - Message text to send.
   */
  async broadcast(
    targets: BroadcastTarget | BroadcastTarget[],
    text: string
  ): Promise<void> {
    const list = Array.isArray(targets) ? targets : [targets];
    const sends = list.map(({ botName, chatId }) => {
      this.assertRegistered(botName);
      const bot = this.bots.get(botName)!;
      return bot.api.sendMessage(chatId, text);
    });
    await Promise.all(sends);
  }

  /**
   * Retrieve the underlying Bot instance for a registered bot.
   *
   * @param name - Name of the registered bot.
   * @returns The Bot instance, or `undefined` if not found.
   */
  getBot(name: string): Bot | undefined {
    return this.bots.get(name);
  }

  /**
   * Return the names of all registered bots.
   */
  listBots(): string[] {
    return Array.from(this.bots.keys());
  }

  private assertRegistered(name: string): void {
    if (!this.bots.has(name)) {
      throw new Error(`Bot "${name}" is not registered.`);
    }
  }
}

