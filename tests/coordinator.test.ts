import { Bot } from "grammy";
import { BotCoordinator } from "../src/coordinator";

jest.mock("grammy", () => {
  const mockOn = jest.fn();
  const mockHears = jest.fn();
  const mockCommand = jest.fn();
  const mockStart = jest.fn().mockResolvedValue(undefined);
  const mockStop = jest.fn().mockResolvedValue(undefined);
  const mockSendMessage = jest.fn().mockResolvedValue({ message_id: 1 });

  const MockBot = jest.fn().mockImplementation(() => ({
    on: mockOn,
    hears: mockHears,
    command: mockCommand,
    start: mockStart,
    stop: mockStop,
    api: {
      sendMessage: mockSendMessage,
    },
  }));

  return { Bot: MockBot };
});

function getMockBot(bot: Bot): jest.Mocked<Bot> {
  return bot as unknown as jest.Mocked<Bot>;
}

describe("BotCoordinator", () => {
  let coordinator: BotCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    coordinator = new BotCoordinator();
  });

  // ── register / unregister ────────────────────────────────────────────────

  describe("register", () => {
    it("registers a bot and makes it retrievable", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      expect(coordinator.getBot("alpha")).toBeDefined();
      expect(coordinator.listBots()).toEqual(["alpha"]);
    });

    it("throws when registering a duplicate name", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      expect(() =>
        coordinator.register({ name: "alpha", token: "token-b" })
      ).toThrow('Bot "alpha" is already registered.');
    });

    it("registers multiple bots via constructor options", () => {
      const coord = new BotCoordinator({
        bots: [
          { name: "alpha", token: "token-a" },
          { name: "beta", token: "token-b" },
        ],
      });
      expect(coord.listBots()).toEqual(["alpha", "beta"]);
    });
  });

  describe("unregister", () => {
    it("removes a registered bot", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      await coordinator.unregister("alpha");
      expect(coordinator.getBot("alpha")).toBeUndefined();
      expect(coordinator.listBots()).toEqual([]);
    });

    it("throws when unregistering an unknown bot", async () => {
      await expect(coordinator.unregister("ghost")).rejects.toThrow(
        'Bot "ghost" is not registered.'
      );
    });
  });

  // ── handlers ─────────────────────────────────────────────────────────────

  describe("addHandler", () => {
    it("calls bot.on with the provided filter and callback", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      const cb = jest.fn();
      coordinator.addHandler("alpha", "message:text", cb);

      const bot = coordinator.getBot("alpha")!;
      expect(getMockBot(bot).on).toHaveBeenCalledWith("message:text", cb);
    });

    it("throws for an unregistered bot", () => {
      expect(() =>
        coordinator.addHandler("ghost", "message:text", jest.fn())
      ).toThrow('Bot "ghost" is not registered.');
    });
  });

  describe("addTextHandler", () => {
    it("calls bot.hears with the pattern and callback", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      const cb = jest.fn();
      coordinator.addTextHandler("alpha", /hello/i, cb);

      const bot = coordinator.getBot("alpha")!;
      expect(getMockBot(bot).hears).toHaveBeenCalledWith(/hello/i, cb);
    });

    it("throws for an unregistered bot", () => {
      expect(() =>
        coordinator.addTextHandler("ghost", /hi/, jest.fn())
      ).toThrow('Bot "ghost" is not registered.');
    });
  });

  describe("addCommandHandler", () => {
    it("calls bot.command with the command and callback", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      const cb = jest.fn();
      coordinator.addCommandHandler("alpha", "start", cb);

      const bot = coordinator.getBot("alpha")!;
      expect(getMockBot(bot).command).toHaveBeenCalledWith("start", cb);
    });

    it("supports an array of commands", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      const cb = jest.fn();
      coordinator.addCommandHandler("alpha", ["start", "help"], cb);

      const bot = coordinator.getBot("alpha")!;
      expect(getMockBot(bot).command).toHaveBeenCalledWith(["start", "help"], cb);
    });

    it("throws for an unregistered bot", () => {
      expect(() =>
        coordinator.addCommandHandler("ghost", "start", jest.fn())
      ).toThrow('Bot "ghost" is not registered.');
    });
  });

  // ── start / stop ─────────────────────────────────────────────────────────

  describe("startBot / stopBot", () => {
    it("calls bot.start() on startBot", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      const startPromise = coordinator.startBot("alpha");

      const bot = coordinator.getBot("alpha")!;
      expect(getMockBot(bot).start).toHaveBeenCalled();
      await startPromise;
    });

    it("calls bot.stop() on stopBot", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      await coordinator.stopBot("alpha");

      const bot = coordinator.getBot("alpha")!;
      expect(getMockBot(bot).stop).toHaveBeenCalled();
    });

    it("throws startBot for unknown bot", () => {
      expect(() => coordinator.startBot("ghost")).toThrow(
        'Bot "ghost" is not registered.'
      );
    });

    it("throws stopBot for unknown bot", async () => {
      await expect(coordinator.stopBot("ghost")).rejects.toThrow(
        'Bot "ghost" is not registered.'
      );
    });
  });

  describe("startAll / stopAll", () => {
    it("starts all registered bots", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      coordinator.register({ name: "beta", token: "token-b" });

      await coordinator.startAll();

      const alphaBot = coordinator.getBot("alpha")!;
      const betaBot = coordinator.getBot("beta")!;
      expect(getMockBot(alphaBot).start).toHaveBeenCalled();
      expect(getMockBot(betaBot).start).toHaveBeenCalled();
    });

    it("stops all registered bots", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      coordinator.register({ name: "beta", token: "token-b" });

      await coordinator.stopAll();

      const alphaBot = coordinator.getBot("alpha")!;
      const betaBot = coordinator.getBot("beta")!;
      expect(getMockBot(alphaBot).stop).toHaveBeenCalled();
      expect(getMockBot(betaBot).stop).toHaveBeenCalled();
    });
  });

  // ── broadcast ─────────────────────────────────────────────────────────────

  describe("broadcast", () => {
    it("sends a message via the specified bot", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      await coordinator.broadcast({ botName: "alpha", chatId: 42 }, "Hello!");

      const bot = coordinator.getBot("alpha")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((bot.api as any).sendMessage).toHaveBeenCalledWith(42, "Hello!");
    });

    it("broadcasts to multiple targets", async () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      coordinator.register({ name: "beta", token: "token-b" });

      await coordinator.broadcast(
        [
          { botName: "alpha", chatId: 1 },
          { botName: "beta", chatId: 2 },
        ],
        "Broadcast!"
      );

      const alphaBot = coordinator.getBot("alpha")!;
      const betaBot = coordinator.getBot("beta")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((alphaBot.api as any).sendMessage).toHaveBeenCalledWith(1, "Broadcast!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((betaBot.api as any).sendMessage).toHaveBeenCalledWith(2, "Broadcast!");
    });

    it("throws for an unregistered bot in target", async () => {
      await expect(
        coordinator.broadcast({ botName: "ghost", chatId: 1 }, "Hi")
      ).rejects.toThrow('Bot "ghost" is not registered.');
    });
  });

  // ── listBots ──────────────────────────────────────────────────────────────

  describe("listBots", () => {
    it("returns an empty array when no bots are registered", () => {
      expect(coordinator.listBots()).toEqual([]);
    });

    it("returns all registered bot names", () => {
      coordinator.register({ name: "alpha", token: "token-a" });
      coordinator.register({ name: "beta", token: "token-b" });
      expect(coordinator.listBots()).toEqual(["alpha", "beta"]);
    });
  });
});
