import { loadBotsFromEnv } from "../src/config";

describe("loadBotsFromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns an empty array when no BOT_*_TOKEN variables are set", () => {
    // Remove any existing BOT_*_TOKEN vars
    for (const key of Object.keys(process.env)) {
      if (/^BOT_.+_TOKEN$/.test(key)) {
        delete process.env[key];
      }
    }
    expect(loadBotsFromEnv()).toEqual([]);
  });

  it("parses a single BOT_*_TOKEN variable", () => {
    for (const key of Object.keys(process.env)) {
      if (/^BOT_.+_TOKEN$/.test(key)) {
        delete process.env[key];
      }
    }
    process.env["BOT_SUPPORT_TOKEN"] = "abc123";

    const configs = loadBotsFromEnv();
    expect(configs).toHaveLength(1);
    expect(configs[0]).toEqual({ name: "support", token: "abc123" });
  });

  it("parses multiple BOT_*_TOKEN variables", () => {
    for (const key of Object.keys(process.env)) {
      if (/^BOT_.+_TOKEN$/.test(key)) {
        delete process.env[key];
      }
    }
    process.env["BOT_ALPHA_TOKEN"] = "token-a";
    process.env["BOT_BETA_TOKEN"] = "token-b";

    const configs = loadBotsFromEnv();
    expect(configs).toHaveLength(2);

    const names = configs.map((c) => c.name).sort();
    expect(names).toEqual(["alpha", "beta"]);
  });

  it("lowercases the bot name derived from the env key", () => {
    for (const key of Object.keys(process.env)) {
      if (/^BOT_.+_TOKEN$/.test(key)) {
        delete process.env[key];
      }
    }
    process.env["BOT_MY_SUPER_BOT_TOKEN"] = "secret";

    const configs = loadBotsFromEnv();
    expect(configs).toHaveLength(1);
    expect(configs[0].name).toBe("my_super_bot");
  });

  it("ignores env vars that do not match BOT_*_TOKEN pattern", () => {
    for (const key of Object.keys(process.env)) {
      if (/^BOT_.+_TOKEN$/.test(key)) {
        delete process.env[key];
      }
    }
    process.env["TELEGRAM_TOKEN"] = "irrelevant";
    process.env["BOT_INCOMPLETE"] = "irrelevant";

    expect(loadBotsFromEnv()).toEqual([]);
  });
});
