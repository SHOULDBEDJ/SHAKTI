import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple check for database table existence and initialization
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error("Initialization error:", error);
  }

  if (req.method === "GET") {
    try {
      const result = await db.execute("SELECT data FROM app_state WHERE id = 1");
      if (result.rows.length === 0) {
        return res.status(200).json(null);
      }
      return res.status(200).json(JSON.parse(result.rows[0].data as string));
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  if (req.method === "POST") {
    try {
      const data = JSON.stringify(req.body);
      await db.execute({
        sql: "INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
        args: [data],
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
