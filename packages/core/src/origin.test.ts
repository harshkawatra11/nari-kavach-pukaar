import { describe, expect, it } from "vitest";
import { validatePublicTrackingOrigin } from "./origin";

describe("validatePublicTrackingOrigin", () => {
  it("accepts the canonical public deployment", () => {
    expect(validatePublicTrackingOrigin("https://pukaar-web-wine.vercel.app", "production")).toBe("https://pukaar-web-wine.vercel.app");
  });
  it.each(["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.2:3000"])("rejects private production origin %s", (origin) => {
    expect(() => validatePublicTrackingOrigin(origin, "production")).toThrow("public HTTPS");
  });
  it("rejects path, query, and fragment components", () => {
    expect(() => validatePublicTrackingOrigin("https://example.com/path", "production")).toThrow("path");
  });
  it("permits localhost only in tests", () => {
    expect(validatePublicTrackingOrigin("http://localhost:3000", "test")).toBe("http://localhost:3000");
  });
});
