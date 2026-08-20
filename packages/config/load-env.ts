import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

const findRootEnv = (startDir = process.cwd()): string | undefined => {
  let current = startDir;

  for (;;) {
    const candidate = join(current, ".env");

    if (existsSync(join(current, "turbo.json")) && existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);

    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
};

const rootEnvPath = findRootEnv();

if (rootEnvPath) {
  // `override: false` — root `.env` supplies shared defaults only; values
  // already present (e.g. an app's own `.env.local`) always win.
  dotenv.config({ path: rootEnvPath, quiet: true, override: false });
}
