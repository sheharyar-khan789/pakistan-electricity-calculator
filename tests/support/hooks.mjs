/**
 * Node module hooks for the test runner (`node --test`).
 *
 * - Resolves the "@/…" path alias and extensionless relative imports.
 * - Transpiles .ts/.tsx with the TypeScript compiler (pure JavaScript, so no
 *   native binaries are needed — some Windows Application Control policies
 *   block native build-tool binaries).
 * - Maps "next/link" to its real component (Node's CJS interop otherwise
 *   hands ESM the module namespace object instead of the default export).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const srcDir = path.join(root, "src");
const candidates = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function findFile(base) {
  for (const suffix of candidates) {
    const file = base + suffix;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/link") {
    return { url: pathToFileURL(path.join(root, "tests/support/next-link.mjs")).href, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const file = findFile(path.join(srcDir, specifier.slice(2)));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parent = fileURLToPath(context.parentURL);
    if (/\.(ts|tsx)$/.test(parent)) {
      const file = findFile(path.resolve(path.dirname(parent), specifier));
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    // Packages without an "exports" map (e.g. next/navigation) need ".js" under ESM.
    if (error?.code === "ERR_MODULE_NOT_FOUND" && /^next\/[\w/-]+$/.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && /\.(ts|tsx)$/.test(url)) {
    const fileName = fileURLToPath(url);
    const { outputText } = ts.transpileModule(fs.readFileSync(fileName, "utf8"), {
      fileName,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        isolatedModules: true,
      },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
