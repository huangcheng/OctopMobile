import { describe, expect, it } from "@jest/globals";
import {
  applyToolFrame,
  EMPTY_TOOL_FRAME_STATE,
  type ToolFrameState,
} from "@/src/utils/processFrames";

const chunk = (index: number, name: string, args: string) => ({
  type: "tool_call_chunk",
  index,
  name,
  args,
});

function run(frames: Record<string, unknown>[]): ToolFrameState {
  return frames.reduce<ToolFrameState>(
    (state, frame) => applyToolFrame(state, frame),
    EMPTY_TOOL_FRAME_STATE,
  );
}

describe("applyToolFrame", () => {
  it("accumulates chunks of ONE tool call into a single row", () => {
    const state = run([
      chunk(0, "shell", ""),
      chunk(0, "", "vmstat 1 3"),
      chunk(0, "", "; echo done"),
    ]);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].name).toBe("shell");
    expect(state.rows[0].detail).toBe("vmstat 1 3; echo done");
    expect(state.rows[0].status).toBe("running");
  });

  it("attaches the tool result INSIDE the row and marks it done", () => {
    const state = run([
      chunk(0, "shell", ""),
      chunk(0, "", "uptime"),
      { type: "tool_result", content: "load average: 0.42" },
    ]);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].status).toBe("done");
    expect(state.rows[0].result).toBe("load average: 0.42");
  });

  it("keeps parallel tool calls separate by index", () => {
    const state = run([
      chunk(0, "read", ""),
      chunk(1, "search", ""),
      chunk(0, "", "a.ts"),
      chunk(1, "", "query"),
      { type: "tool_result", index: 0, content: "ok" },
    ]);
    expect(state.rows.map((row) => row.name)).toEqual(["read", "search"]);
    expect(state.rows[0].status).toBe("done");
    expect(state.rows[1].status).toBe("running");
  });

  it("flags errored results", () => {
    const state = run([
      chunk(0, "shell", ""),
      { type: "tool_result", is_error: true, content: "command failed" },
    ]);
    expect(state.rows[0].status).toBe("error");
  });

  it("caps previews so giant args/results cannot flood the card", () => {
    const state = run([
      chunk(0, "shell", ""),
      chunk(0, "", "x".repeat(500)),
      { type: "tool_result", content: "y".repeat(900) },
    ]);
    expect(state.rows[0].detail.length).toBeLessThanOrEqual(161);
    expect((state.rows[0].result ?? "").length).toBeLessThanOrEqual(401);
  });

  it("ignores non-tool frames", () => {
    expect(applyToolFrame(EMPTY_TOOL_FRAME_STATE, { type: "token", content: "hi" })).toBe(
      EMPTY_TOOL_FRAME_STATE,
    );
  });
});
