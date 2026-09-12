import { describe, expect, it } from "@jest/globals";
import { reconnectDelayMs, RECONNECT_DELAYS_MS } from "@/src/api/chatWs";

describe("reconnect backoff", () => {
  it("grows exponentially then caps", () => {
    expect(reconnectDelayMs(0)).toBe(1000);
    expect(reconnectDelayMs(1)).toBe(2000);
    expect(reconnectDelayMs(2)).toBe(4000);
    expect(reconnectDelayMs(3)).toBe(8000);
    expect(reconnectDelayMs(4)).toBe(15000);
    expect(reconnectDelayMs(99)).toBe(RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1]);
  });

  it("never returns a negative or zero delay", () => {
    for (let attempt = -5; attempt < 20; attempt++) {
      expect(reconnectDelayMs(attempt)).toBeGreaterThan(0);
    }
  });
});
