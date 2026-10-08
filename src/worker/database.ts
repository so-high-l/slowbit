// Keep the D1 dependency at the server boundary. The browser never receives a DB binding.
export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
export interface Database {
  prepare(sql: string): Statement;
}
export interface Bindings {
  DB?: Database;
  BOARD_ALLOWED_ORIGINS?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> };
}
export function database(env: Bindings): Database {
  if (!env.DB) throw new Error("Board database is unavailable");
  return env.DB;
}
