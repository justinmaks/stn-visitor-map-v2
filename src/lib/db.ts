import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const defaultPath = path.join(process.cwd(), "data", "visitors.db");
  const dbPath = process.env.DB_PATH || defaultPath;

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_hash TEXT,
      latitude REAL,
      longitude REAL,
      city TEXT,
      region TEXT,
      country TEXT,
      user_agent TEXT,
      device TEXT,
      os TEXT,
      browser TEXT,
      referer TEXT,
      path TEXT,
      created_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
    CREATE INDEX IF NOT EXISTS idx_visits_lat_lon ON visits(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_visits_ip_hash ON visits(ip_hash);
  `);

  return db;
}
