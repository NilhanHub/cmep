import { applySchema, deleteDatabaseFiles, exportSchemaSql, resolveDatabasePath, seedDatabase } from "./shared";

const dbPath = resolveDatabasePath();

exportSchemaSql();
deleteDatabaseFiles(dbPath);
applySchema(dbPath);
seedDatabase();
