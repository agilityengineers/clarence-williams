import { db } from "@workspace/db";
import * as schema from "@workspace/db/schema";

export type Db = typeof db;

export async function getDb(): Promise<Db> {
  return db;
}

export { schema };
