declare module "better-sqlite3" {
  class Database {
    constructor(filename: string, options?: any);
    pragma(pragma: string): void;
    prepare(source: string): Statement;
    exec(source: string): void;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(): void;
  }

  interface Statement {
    run(...params: any[]): { changes: number; lastInsertRowid: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
    bind(...params: any[]): Statement;
    pluck(toggleState?: boolean): Statement;
    expand(toggleState?: boolean): Statement;
    raw(toggleState?: boolean): Statement;
    columns(): ColumnDefinition[];
    safeIntegers(toggleState?: boolean): Statement;
  }

  interface ColumnDefinition {
    name: string;
    table: string;
    database: string;
    type: string;
  }

  export default Database;
  export { Database, Statement, ColumnDefinition };
}
