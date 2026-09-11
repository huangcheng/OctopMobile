import { describe, expect, test } from "@jest/globals";

import { resolveColdStartSession } from "../../../src/features/auth/coldStart";
import type { User } from "../../../src/api/types";

const user: User = {
  id: 1,
  username: "alice",
  role: "user",
  display_name: "Alice",
  locale: "en",
  permissions: [],
};

describe("resolveColdStartSession", () => {
  test("returns authenticated user on success", async () => {
    const result = await resolveColdStartSession(Promise.resolve(user), async () => {});
    expect(result).toEqual({ status: "authenticated", user });
  });

  test("clears token and unauthenticates on UNAUTHORIZED", async () => {
    let cleared = false;
    const result = await resolveColdStartSession(
      Promise.reject({ code: "UNAUTHORIZED", message: "unauthorized" }),
      async () => {
        cleared = true;
      },
    );
    expect(cleared).toBe(true);
    expect(result).toEqual({ status: "unauthenticated", user: null });
  });

  test("preserves session on NETWORK failure", async () => {
    let cleared = false;
    const result = await resolveColdStartSession(
      Promise.reject({ code: "NETWORK", message: "network error" }),
      async () => {
        cleared = true;
      },
    );
    expect(cleared).toBe(false);
    expect(result).toEqual({ status: "authenticated", user: null });
  });
});
