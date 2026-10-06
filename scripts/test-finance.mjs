import ts from "typescript";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, ".."), out=join(root,".sites-runtime","tests");
for(const dir of ["lib/simulation","tests"]) {
  mkdirSync(join(out,dir),{recursive:true});
  for(const file of readdirSync(join(root,dir)).filter(f=>f.endsWith(".ts"))) {
    const compiled=ts.transpileModule(readFileSync(join(root,dir,file),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
    writeFileSync(join(out,dir,file.replace(/\.ts$/,".js")),compiled);
  }
}
writeFileSync(join(out,"package.json"),JSON.stringify({type:"commonjs"}));
const result=spawnSync(process.execPath,["--test",join(out,"tests/finance.test.js")],{stdio:"inherit",cwd:root}); process.exit(result.status ?? 1);
