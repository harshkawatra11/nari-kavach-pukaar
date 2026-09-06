import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("env", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws a MissingEnvError naming the variable when SARVAM_API_KEY is unset", async () => {
    delete process.env.SARVAM_API_KEY;
    const { env, MissingEnvError } = await import("./env");
    expect(() => env.SARVAM_API_KEY).toThrow(MissingEnvError);
    expect(() => env.SARVAM_API_KEY).toThrow(/SARVAM_API_KEY/);
  });

  it("applies documented defaults for optional variables", async () => {
    delete process.env.SARVAM_SPEAKER;
    delete process.env.STT_MODE;
    const { env } = await import("./env");
    expect(env.SARVAM_SPEAKER).toBe("simran");
    expect(env.STT_MODE).toBe("ws");
  });
});
