import { applySchema, hasSchema, resolveDatabasePath, seedDatabase } from "./shared";

const dbPath = resolveDatabasePath();

if (!hasSchema(dbPath)) {
  applySchema(dbPath);
}

seedDatabase();
