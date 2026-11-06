import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

// Vercel runs the compiled handlers as native ESM; tsx alone resolves extensionless
// imports and would not catch modules that crash before their handler starts.
test("compiled Vercel handlers load under native Node ESM", () => {
  const root = process.cwd();
  const dir = mkdtempSync(path.join(root, ".api-smoke-"));
  try {
    for (const file of ["api/_lib/security.ts", "api/_lib/notifications.ts", "api/owner-session.ts", "api/load-data.ts", "api/save-data.ts", "api/orders.ts", "api/images.ts", "src/data.ts"]) {
      const dest = path.join(dir, file.replace(/\.ts$/, ".js"));
      mkdirSync(path.dirname(dest), { recursive: true });
      const compiled = ts.transpileModule(readFileSync(path.join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
      writeFileSync(dest, compiled.outputText);
    }
    const routes = ["owner-session", "load-data", "save-data", "orders", "images"];
    const code = `await Promise.all(${JSON.stringify(routes)}.map(x => import('./api/' + x + '.js')));`;
    execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: dir, stdio: "pipe" });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
