/**
 * Tool-stream frame aggregation (pure, unit-tested).
 *
 * The Octop gateway forwards raw harness chunks to the chat WS: a single tool
 * call arrives as many `tool_call_chunk` frames (name/args fragments keyed by
 * `index`) followed by one `tool_result`. Rendering each frame as its own row
 * produced walls of "tool_call_chunk" entries — chunks must accumulate into
 * ONE row per tool call, with the result attached *inside* that row.
 * Mirrors server-side accumulation in `octop/infra/history/recorder.py`.
 */

export type ToolRow = {
  id: string;
  name: string;
  /** Accumulated args preview (streamed fragments). */
  detail: string;
  /** Tool output preview — rendered under the call, inside the same row. */
  result?: string;
  status: "running" | "done" | "error";
};

export type ToolFrameState = {
  rows: ToolRow[];
  nameBuf: Record<string, string>;
  activeIdx: string | null;
};

export const EMPTY_TOOL_FRAME_STATE: ToolFrameState = {
  rows: [],
  nameBuf: {},
  activeIdx: null,
};

const ARGS_PREVIEW_CAP = 160;
const RESULT_PREVIEW_CAP = 400;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function preview(text: string, cap: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > cap ? `${flat.slice(0, cap)}…` : flat;
}

function rowId(idx: string): string {
  return `tool:${idx}`;
}

function isToolResultType(type: string): boolean {
  return (
    type === "tool_result" ||
    type === "tool_call_end" ||
    type === "tool_end" ||
    type.endsWith("_result")
  );
}

export function applyToolFrame(
  state: ToolFrameState,
  frame: Record<string, unknown>,
): ToolFrameState {
  const type = asString(frame.type).toLowerCase();
  if (!type.startsWith("tool")) {
    return state;
  }

  const indexKey = `_idx_${typeof frame.index === "number" ? frame.index : 0}`;

  if (type === "tool_call_chunk") {
    const nameFrag = asString(frame.name);
    const argsFrag = asString(frame.args);
    const nameBuf = nameFrag
      ? { ...state.nameBuf, [indexKey]: (state.nameBuf[indexKey] ?? "") + nameFrag }
      : state.nameBuf;

    let rows = state.rows;
    const id = rowId(indexKey);
    if (!rows.some((row) => row.id === id) && nameBuf[indexKey]) {
      rows = [
        ...rows,
        { id, name: preview(nameBuf[indexKey], 60), detail: "", status: "running" },
      ];
    }
    if (argsFrag) {
      rows = rows.map((row) =>
        row.id === id
          ? { ...row, detail: preview(row.detail + argsFrag, ARGS_PREVIEW_CAP) }
          : row,
      );
    }
    return { rows, nameBuf, activeIdx: indexKey };
  }

  if (type === "tool_start") {
    const id = rowId(indexKey);
    if (state.rows.some((row) => row.id === id)) {
      return { ...state, activeIdx: indexKey };
    }
    const name =
      asString(frame.name) || asString(frame.label) || asString(frame.display_name) || "tool";
    return {
      rows: [...state.rows, { id, name: preview(name, 60), detail: "", status: "running" }],
      nameBuf: { ...state.nameBuf, [indexKey]: name },
      activeIdx: indexKey,
    };
  }

  if (isToolResultType(type)) {
    const resultIdx = typeof frame.index === "number" ? `_idx_${frame.index}` : state.activeIdx;
    const targetId =
      resultIdx && state.rows.some((r) => r.id === rowId(resultIdx))
        ? rowId(resultIdx)
        : [...state.rows].reverse().find((row) => row.status === "running")?.id;
    if (!targetId) {
      return state;
    }
    const resultText =
      asString(frame.content) ||
      asString(frame.output) ||
      asString(frame.result) ||
      asString(frame.text);
    const failed = frame.is_error === true || asString(frame.error).length > 0;
    const rows = state.rows.map((row) =>
      row.id === targetId
        ? {
            ...row,
            status: failed ? ("error" as const) : ("done" as const),
            result: resultText ? preview(resultText, RESULT_PREVIEW_CAP) : row.result,
          }
        : row,
    );
    const nameBuf = { ...state.nameBuf };
    delete nameBuf[resultIdx ?? indexKey];
    return { rows, nameBuf, activeIdx: resultIdx === state.activeIdx ? null : state.activeIdx };
  }

  return state;
}
