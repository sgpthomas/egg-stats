import * as d3 from "d3";

export type Datum = number | string;
export type Key = string[];

function arraysEqual(a: any[], b: any[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function setHas<T>(set: T[], item: T): boolean {
  return !!set.find((x) => x === item);
}

export function setAdd<T>(set: T[], item: T): T[] {
  if (item && !setHas(set, item)) {
    set.push(item);
  }
  return set;
}

export function setIntersect<T>(set0: T[], set1: T[]): T[] {
  const res: T[] = [];

  for (const x0 of set0) {
    if (setHas(set1, x0)) {
      setAdd(res, x0);
    }
  }

  for (const x1 of set1) {
    if (setHas(set0, x1)) {
      setAdd(res, x1);
    }
  }

  return res;
}

export class PivotTable {
  file_id: number;

  keyed_rows: [Key, any][];
  value_names: string[];

  keys: string[];
  name: string;
  value: string;

  constructor(file_id: number, keys: string[], name?: string, value?: string) {
    this.file_id = file_id;
    this.keyed_rows = [];
    this.value_names = [];
    this.keys = keys;
    this.name = name ?? "name";
    this.value = value ?? "value";
  }

  static addRow(table: PivotTable, row: any) {
    // compute the key of the row
    const key = table.keys.map((key) => {
      if (!(key in row)) {
        throw new Error(`${key} not present in ${row}`);
      }

      return row[key];
    });

    // register value name
    setAdd(table.value_names, row[table.name]);

    // search to find a row with a matching key
    // if so, add a value
    for (const [k, val] of table.keyed_rows) {
      if (arraysEqual(k, key)) {
        val[row[table.name]] = row[table.value];
        return;
      }
    }

    // no row has been found
    let new_val: any = {};
    new_val[row[table.name]] = row[table.value];
    table.keyed_rows.push([key, new_val]);
  }

  static addRows(table: PivotTable, rows: any[]) {
    for (const row of rows) {
      PivotTable.addRow(table, row);
    }
  }

  static *rows(table: PivotTable) {
    for (const [k, val] of table.keyed_rows) {
      // TODO: return an object instead of an array
      const keys = d3.zip(table.keys, k).reduce(
        (acc, [kname, kval]) =>
          kname
            ? {
                ...acc,
                [kname]: kval,
              }
            : acc,
        {},
      );
      const values = table.value_names.reduce(
        (acc, name) => ({
          ...acc,
          [name]: val[name],
        }),
        {},
      );
      yield { ...keys, ...values };
    }
  }

  static map<T>(table: PivotTable, fn: (el: any, index: number) => T): T[] {
    const ret = [];
    let i = 0;
    for (const row of PivotTable.rows(table)) {
      ret.push(fn(row, i));
      i++;
    }

    return ret;
  }
}
