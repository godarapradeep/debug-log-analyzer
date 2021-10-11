/*
 * Copyright (c) 2020 FinancialForce.com, inc. All rights reserved.
 */

import { html, render } from "lit";
import { RootNode } from "./parsers/TreeParser";
import { LogLine } from "./parsers/LineParser";

export class DatabaseEntry {
  readonly count: number;
  readonly rowCount: number;
  readonly stacks: number[];

  constructor(count: number, rowCount: number, stacks: number[]) {
    this.count = count;
    this.rowCount = rowCount;
    this.stacks = stacks;
  }

  expand(count: number, rowCount: number, stackIndex: number): DatabaseEntry {
    return new DatabaseEntry(
      this.count + count,
      this.rowCount + rowCount,
      this.stacks.concat([stackIndex])
    );
  }
}

export type Stack = LogLine[];
export type DatabaseEntryMap = Map<string, DatabaseEntry>;

export class DatabaseAccess {
  private static _instance: DatabaseAccess | null = null;

  readonly dmlMap: DatabaseEntryMap = new Map<string, DatabaseEntry>();
  readonly soqlMap: DatabaseEntryMap = new Map<string, DatabaseEntry>();
  readonly stacks: Stack[] = [];

  static async create(rootMethod: RootNode): Promise<DatabaseAccess> {
    const databaseAccess = new DatabaseAccess();
    DatabaseAccess.findDatabseLines(databaseAccess, rootMethod, []);
    this._instance = databaseAccess;
    return this._instance;
  }

  static instance(): DatabaseAccess | null {
    return DatabaseAccess._instance;
  }

  private static findDatabseLines(
    log: DatabaseAccess,
    node: LogLine,
    stack: LogLine[]
  ) {
    const children = node.children;

    if (children) {
      for (let i = 0; i < children.length; ++i) {
        const child = children[i];
        switch (child.type) {
          case "DML_BEGIN":
            log.upsert(log.dmlMap, child, stack);
            break;
          case "SOQL_EXECUTE_BEGIN":
            log.upsert(log.soqlMap, child, stack);
            break;
        }

        if (child.displayType === "method") {
          stack.push(child);
          DatabaseAccess.findDatabseLines(log, child, stack);
          stack.pop();
        }
      }
    }
  }

  private upsert(map: Map<String, DatabaseEntry>, line: LogLine, stack: Stack) {
    let stackIndex = this.internStack(stack);
    let entry = map.get(line.text);
    if (!entry) {
      map.set(
        line.text,
        new DatabaseEntry(1, line.rowCount || 0, [stackIndex])
      );
    } else {
      map.set(line.text, entry.expand(1, line.rowCount || 0, stackIndex));
    }
  }

  private internStack(stack: Stack): number {
    this.stacks.push([...stack].reverse());
    return this.stacks.length-1;
  }
}

export async function renderDb() {
  const dbContainer = document.getElementById("dbContent");
  if (dbContainer) {
    const sections = [
      html`<database-section type="dml" />`,
      html`<database-section type="soql" />`,
    ];
    render(html`<div>${sections}</div>`, dbContainer);
  }
}