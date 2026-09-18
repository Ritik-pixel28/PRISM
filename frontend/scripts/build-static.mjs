import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(root, ".static-build");
await mkdir(workspace, { recursive: true });
const staging = await mkdtemp(path.join(workspace, "export-"));
try {
  for (const name of [
    "app",
    "components",
    "data",
    "lib",
    "public",
    "types",
    "package.json",
    "tsconfig.json",
    "postcss.config.mjs",
    "next-env.d.ts",
  ]) {
    await cp(path.join(root, name), path.join(staging, name), {
      recursive: true,
    });
  }
  await rm(path.join(staging, "app/api"), { recursive: true, force: true });
  await symlink(
    path.join(root, "node_modules"),
    path.join(staging, "node_modules"),
    "dir",
  );
  await writeFile(
    path.join(staging, "next.config.mjs"),
    'export default { output: "export", devIndicators: false };\n',
  );
  const result = spawnSync(
    process.execPath,
    [path.join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"],
    {
      cwd: staging,
      stdio: "inherit",
      env: process.env,
    },
  );
  if (result.status !== 0) throw new Error("Static build failed");
  await rm(path.join(root, "out"), { recursive: true, force: true });
  await cp(path.join(staging, "out"), path.join(root, "out"), {
    recursive: true,
  });
  console.log(
    "AWS static assets ready in frontend/out. /api/simulate must route to Lambda.",
  );
} finally {
  await rm(staging, { recursive: true, force: true });
}
