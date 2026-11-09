import { build } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
await build({ configFile: path.join(root, "standalone/vite.config.mjs") });
const buildDir = path.join(root, ".sites-runtime/standalone-build");
const css = readFileSync(path.join(buildDir, "investlab.css"), "utf8");
const script = readFileSync(path.join(buildDir, "investlab.js"), "utf8");
const favicon = readFileSync(path.join(root, "public/favicon.svg"), "utf8");
const bundledLicenses = readFileSync(path.join(buildDir, ".vite/license.md"), "utf8");
const shadcnLicense = readFileSync(path.join(root, "vendor/shadcn-LICENSE.md"), "utf8");
const licenses = [bundledLicenses, shadcnLicense]
  .join("\n\n")
  .replaceAll("-->", "--&gt;")
  .replaceAll("--!>", "--!&gt;");
const html = `<!doctype html>
<!-- Third-party licenses
${licenses}
-->
<html lang="pt-BR" class="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#101416">
<meta name="description" content="Laboratório educacional de investimentos com dinheiro fictício e máquina do tempo.">
<title>InvestLab · Seu laboratório financeiro</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}">
<style>${css.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body>
<div id="investlab-root"></div>
<noscript>Ative o JavaScript no navegador para usar o InvestLab.</noscript>
<script>${script.replace(/<\/script/gi, "<\\/script")}</script>
</body>
</html>`;
const output = path.resolve(root, "../InvestLab.html");
writeFileSync(output, html, "utf8");
writeFileSync(path.join(root, "InvestLab.html"), html, "utf8");
console.log(`HTML independente criado: ${output} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
