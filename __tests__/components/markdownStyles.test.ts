import { describe, expect, test } from "@jest/globals";
import { softenStreamingMarkdown } from "../../src/utils/softenStreamingMarkdown";

describe("softenStreamingMarkdown", () => {
  test("closes unfinished bold markers", () => {
    expect(softenStreamingMarkdown("hello **world")).toBe("hello **world**");
  });

  test("leaves balanced bold alone", () => {
    expect(softenStreamingMarkdown("**bold** ok")).toBe("**bold** ok");
  });

  test("closes open fenced code block", () => {
    const out = softenStreamingMarkdown("```ts\nconst x = 1");
    expect(out.endsWith("```")).toBe(true);
  });

  test("closes odd inline backtick", () => {
    expect(softenStreamingMarkdown("use `code")).toBe("use `code`");
  });
});
