import { expect, test } from "bun:test";
import { arraysEqual, ASet, mkObject, setAdd, setHas } from "./DataProcessing";

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

test("set add number", () => {
  let set: ASet<number> = [];
  set = setAdd(set, 1);
  set = setAdd(set, 2);
  set = setAdd(set, 1);
  expect(set).toEqual([1, 2]);
});

test("set has number", () => {
  let set: ASet<number> = [];
  set = setAdd(set, 1);
  set = setAdd(set, 2);
  set = setAdd(set, 1);
  expect(setHas(set, 2)).toBe(true);
});

test("set add array", () => {
  let set: ASet<number[]> = [];
  set = setAdd(set, [1, 1], arraysEqual);
  set = setAdd(set, [1, 2], arraysEqual);
  set = setAdd(set, [1, 1], arraysEqual);
  expect(set).toEqual([
    [1, 1],
    [1, 2],
  ]);
});
