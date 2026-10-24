import { sql } from "drizzle-orm";
import { boundedStatement } from "./databaseTimeout.ts";
type Query = (statement:string,values?:unknown[])=>Promise<Record<string,any>[]>;
type SiteDatabase = NonNullable<typeof import("../db").db>;
type InjectedPool = {query:(statement:string,values:unknown[])=>Promise<{rows:Record<string,any>[]}>};
// The shared estimator tests isolate persistence by installing a query-compatible pool on
// globalThis.__p5Pool (an in-process PGlite), the same seam the parent site's driver honors.
const injectedPool = () => (globalThis as {__p5Pool?:InjectedPool}).__p5Pool;
// The site's driver and its path aliases load on first use, so an isolated test harness that
// injects its own query never resolves them.
let site: Promise<SiteDatabase|null> | null = null;
const database = () => (site ??= import("../db").then(module => module.db as SiteDatabase|null));
/** Uses this site's existing database driver with parameterized values. */
export async function query(statement: string, values: unknown[] = []): Promise<Record<string, any>[]> {
  const injected = injectedPool();
  if (injected) return (await boundedStatement(()=>injected.query(statement,values),statement)).rows;
  const db = await database();
  if (!db) throw new Error("persistence-unconfigured");
  const parts = statement.split(/\$(\d+)/g);
  const chunks = parts.map((part, index) => index % 2 ? sql`${values[Number(part)-1]}` : sql.raw(part));
  const result = await boundedStatement(()=>db.execute(sql.join(chunks,sql.raw(""))),statement);
  return Array.isArray(result) ? result : (result as {rows:Record<string,any>[]}).rows;
}
/** This site's HTTP database driver has no interactive transactions. The shared modules
 * that require one (P5-only project records and QA continuations) are not reachable here;
 * fail closed rather than run multi-statement work without atomicity. */
export async function transaction<T>(run:(query:Query)=>Promise<T>):Promise<T>{
  if (injectedPool()) return run(query);
  throw new Error("persistence-unconfigured");
}
/** The operator QA write fence cannot pin one connection on an HTTP driver; its small
 * writes run on the pool in order, which is how this site's QA cases always ran. */
export async function scopedTransaction<T>(run:(read:Query)=>Promise<T>):Promise<T>{
  return run(query);
}
