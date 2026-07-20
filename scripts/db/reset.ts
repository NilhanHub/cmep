import { applySchema, deleteDatabaseFiles, resolveDatabasePath, seedDatabase } from "./shared";

const dbPath = resolveDatabasePath();

deleteDatabaseFiles(dbPath);
applySchema(dbPath);
seedDatabase();
