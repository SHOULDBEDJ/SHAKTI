import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

export const getDb = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is missing in Vercel settings.");
  }

  return createClient({
    url: url,
    authToken: authToken,
  });
};
