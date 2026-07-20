import { execSync } from "node:child_process";

export default async function globalSetup() {
  execSync("npx prisma db seed", {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
