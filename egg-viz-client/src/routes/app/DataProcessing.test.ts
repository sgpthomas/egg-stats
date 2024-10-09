import { expect, test } from "bun:test";
import { mkObject } from "./DataProcessing";

test("mkObject", () => {
  expect(mkObject(["a", "b", "c", "d"], [1, 2, 3])).toEqual({
    a: 1,
    b: 2,
    c: 3,
  });
});

test("array slicing", () => {
  const test = [
    "id",
    "iteration",
    "rule_name",
    "rule",
    "when",
    "name",
    "value",
  ];
  expect(test.slice(0, test.length - 2)).toEqual([
    "id",
    "iteration",
    "rule_name",
    "rule",
    "when",
  ]);
});
