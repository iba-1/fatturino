import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://fatturino:fatturino@localhost:5432/fatturino";

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../src/db/migrations") });
  console.log("Migrations complete.");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
