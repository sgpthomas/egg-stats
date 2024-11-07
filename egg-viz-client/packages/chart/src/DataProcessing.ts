import * as d3 from "d3";
import * as aq from "arquero";

export type Datum = number | string;
export type Key = string[];

export function arraysEqual(a: any[], b: any[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

type Eq<T> = (a: T, b: T) => boolean;
const tripleEq = <T>(a: T, b: T) => a === b;

export type ASet<T> = T[];

export function setHas<T>(
  set: ASet<T>,
  item: T,
  eq: Eq<T> = tripleEq,
): boolean {
  return !!set.find((x) => eq(x, item));
}

export function setAdd<T>(set: ASet<T>, item: T, eq: Eq<T> = tripleEq): T[] {
  if (item && !setHas(set, item, eq)) {
    set.push(item);
  }
  return set;
}

export function setIntersect<T>(
  set0?: ASet<T>,
  set1?: ASet<T>,
  eq: Eq<T> = tripleEq,
): T[] {
  if (!set0) return set1 ?? [];
  if (!set1) return set0;

  const res: T[] = [];

  for (const x0 of set0) {
    if (setHas(set1, x0, eq)) {
      setAdd(res, x0, eq);
    }
  }

  for (const x1 of set1) {
    if (setHas(set0, x1, eq)) {
      setAdd(res, x1, eq);
    }
  }

  return res;
}

export function mkObject(keys: string[], values: any[]) {
  let obj: any = {};

  const zipped = keys.map((el, idx) => [el, values[idx]]);

  for (const [k, v] of zipped) {
    if (!k || !v) continue;

    obj[k] = v;
  }

  return obj;
}

export class PivotTable2 {
  file_id: number;
  value_names: string[];
  data: aq.ColumnTable;

  constructor(file_id: number, parsed: aq.ColumnTable) {
    this.file_id = file_id;
    this.value_names = parsed.select("name").dedupe().array("name") as string[];
    this.data = parsed
      .groupby(
        parsed.columnNames().filter((n) => n !== "name" && n !== "value"),
      )
      .pivot("name", "value");
  }
}

export class PivotTable {
  file_id: number;

  keyed_rows: [Key, any][];
  value_names: string[];

  header: string[];
  keys: string[];
  name: string;
  value: string;

  constructor(
    file_id: number,
    header: string[],
    name?: string,
    value?: string,
  ) {
    this.file_id = file_id;
    this.keyed_rows = [];
    this.value_names = [];
    this.header = header;
    this.keys = header.slice(0, header.length - 2);
    this.name = name ?? "name";
    this.value = value ?? "value";
  }

  static addRow(table: PivotTable, rawRow: string[]) {
    const row = mkObject(table.header, rawRow);
    // compute the key of the row
    const key = table.keys.map((key) => {
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

  static addRows(table: PivotTable, rows: string[][]) {
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
