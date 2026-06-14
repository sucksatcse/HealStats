export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  FILES: R2Bucket;
  JWT_SECRET?: string;
}