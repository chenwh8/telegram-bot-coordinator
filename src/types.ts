import type { Context, Filter, FilterQuery } from "grammy";

/**
 * Configuration for a single Telegram bot.
 */
export interface BotConfig {
  /** Unique name used to identify this bot within the coordinator. */
  name: string;
  /** Telegram Bot API token. */
  token: string;
}

/**
 * Handler callback type for grammy filter queries.
 */
export type FilterCallback = (ctx: Filter<Context, FilterQuery>) => void | Promise<void>;

/**
 * A handler registered for a specific bot using grammy's filter queries.
 */
export interface FilterHandler {
  /** The grammy filter query string (e.g. "message:text"). */
  filter: FilterQuery | FilterQuery[];
  /** Callback invoked when a matching update is received. */
  callback: FilterCallback;
}

/**
 * Handler callback for text/pattern matching via `bot.hears`.
 */
export type TextCallback = (ctx: Context & { match: RegExpMatchArray | string[] }) => void | Promise<void>;

/**
 * A text/pattern handler registered via `bot.hears`.
 */
export interface TextHandler {
  /** String or RegExp to match against message text. */
  pattern: string | RegExp;
  /** Callback invoked when the pattern matches. */
  callback: TextCallback;
}

/**
 * Handler callback for command handlers via `bot.command`.
 */
export type CommandCallback = (ctx: Context) => void | Promise<void>;

/**
 * A command handler registered via `bot.command`.
 */
export interface CommandHandler {
  /** The command string without leading slash (e.g. "start"). */
  command: string | string[];
  /** Callback invoked when the command is received. */
  callback: CommandCallback;
}

/**
 * Options for the BotCoordinator.
 */
export interface CoordinatorOptions {
  /** Initial list of bots to register. */
  bots?: BotConfig[];
}

/**
 * A broadcast target specifying the bot name and chat ID to send to.
 */
export interface BroadcastTarget {
  /** Name of the registered bot to use. */
  botName: string;
  /** Chat ID to send the message to. */
  chatId: number | string;
}
