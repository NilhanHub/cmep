import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export default function setup() {
  const generatedClient = path.join(process.cwd(), "node_modules", ".prisma", "client", "index.js");
  const command = existsSync(generatedClient) ? "npm run demo:reset" : "npm run db:setup";

  execSync(command, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
