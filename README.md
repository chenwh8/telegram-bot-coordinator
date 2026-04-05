# telegram-bot-coordinator

A TypeScript library for managing and coordinating multiple [Telegram](https://telegram.org/) bots from a single place, built on top of [grammY](https://grammy.dev/).

## Features

- **Multi-bot management** – register, start, and stop any number of bots with a single coordinator instance.
- **Unified handler registration** – attach filter-query, text/pattern, and command handlers to any registered bot.
- **Broadcast** – send a message through one or more bots to one or more chats in parallel.
- **Environment-based configuration** – automatically discover bot tokens from environment variables.

## Installation

```bash
npm install
```

## Quick start

```typescript
import { BotCoordinator } from "./src";

const coordinator = new BotCoordinator({
  bots: [
    { name: "support", token: process.env.SUPPORT_BOT_TOKEN! },
    { name: "notify",  token: process.env.NOTIFY_BOT_TOKEN! },
  ],
});

// Register a command handler on the "support" bot
coordinator.addCommandHandler("support", "start", async (ctx) => {
  await ctx.reply("Welcome! How can I help you?");
});

// Register a text handler on the "support" bot
coordinator.addTextHandler("support", /hello/i, async (ctx) => {
  await ctx.reply("Hi there!");
});

// Register a filter-query handler on the "notify" bot
coordinator.addHandler("notify", "message:text", async (ctx) => {
  console.log("Received:", ctx.message?.text);
});

// Broadcast a message through the "notify" bot
await coordinator.broadcast({ botName: "notify", chatId: 123456789 }, "Deployment complete!");

// Start all bots (non-blocking – returns a Promise that resolves when all bots stop)
coordinator.startAll();
```

## Environment-based configuration

Copy `.env.example` to `.env` and fill in your tokens:

```env
BOT_SUPPORT_TOKEN=your_support_bot_token
BOT_NOTIFY_TOKEN=your_notify_bot_token
```

Then load bots automatically:

```typescript
import { BotCoordinator, loadBotsFromEnv } from "./src";

const coordinator = new BotCoordinator({ bots: loadBotsFromEnv() });
```

Any `BOT_<NAME>_TOKEN` variable is picked up; the `<NAME>` part (lowercased) becomes the bot's identifier in the coordinator.

## API

### `BotCoordinator`

| Method | Description |
|---|---|
| `register(config)` | Register a new bot. |
| `unregister(name)` | Stop and remove a registered bot. |
| `addHandler(name, filter, cb)` | Add a grammY filter-query handler. |
| `addTextHandler(name, pattern, cb)` | Add a text/RegExp handler via `bot.hears`. |
| `addCommandHandler(name, command, cb)` | Add a command handler via `bot.command`. |
| `startBot(name)` | Start polling for a single bot. |
| `stopBot(name)` | Stop polling for a single bot. |
| `startAll()` | Start polling for all registered bots. |
| `stopAll()` | Stop polling for all registered bots. |
| `broadcast(targets, text)` | Send a text message via one or more bots. |
| `getBot(name)` | Return the underlying `Bot` instance. |
| `listBots()` | Return an array of registered bot names. |

### `loadBotsFromEnv()`

Reads `BOT_<NAME>_TOKEN` variables from `process.env` and returns an array of `BotConfig` objects ready to pass to `BotCoordinator`.

## Development

```bash
# Type-check
npx tsc --noEmit

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

