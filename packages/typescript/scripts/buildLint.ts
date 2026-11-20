import { build } from "esbuild";
import {
    existsSync,
    readdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import {
    dirname,
    join,
    resolve,
    sep,
} from "node:path";

const result = await build({
    entryPoints: ["src/lint/shim.ts", "src/lint/worker.ts"],
    outdir: "dist/lint",
    bundle: true,
    external: ["jiti", "jiti/package.json"],
    minifyWhitespace: true,
    platform: "node",
    format: "esm",
    target: "node20",
    sourcemap: true,
    metafile: true,
    legalComments: "external",
    banner: { js: 'import { createRequire as __tsCreateRequire } from "node:module"; const require = __tsCreateRequire(import.meta.url);' },
});

const packages = new Set<string>();
for (const input of Object.keys(result.metafile.inputs)) {
    const absolute = resolve(input);
    if (!absolute.includes(`${sep}node_modules${sep}`)) continue;
    let directory = dirname(absolute);
    let manifest: { name?: string; } | undefined;
    for (;;) {
        const path = join(directory, "package.json");
        if (existsSync(path)) {
            manifest = JSON.parse(readFileSync(path, "utf8"));
            if (typeof manifest?.name === "string") break;
        }
        const parent = dirname(directory);
        if (parent === directory) throw new Error(`Missing package metadata for ${input}`);
        directory = parent;
    }
    if (manifest?.name === "typescript") throw new Error("The lint shim must not bundle the classic TypeScript compiler");
    packages.add(directory);
}
const notices: string[] = [];
const require = createRequire(import.meta.url);
const mitLicense = readFileSync(join(dirname(require.resolve("@typescript-eslint/types/package.json")), "LICENSE"), "utf8");
const permissionStart = mitLicense.indexOf("Permission is hereby granted");
if (permissionStart < 0) throw new Error("The MIT permission notice is missing");
const mitPermission = mitLicense.slice(permissionStart);
for (const directory of [...packages].sort()) {
    const manifest: { name: string; version: string; main?: string; license?: string; } = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    const licenses = readdirSync(directory, { withFileTypes: true }).filter(file => file.isFile() && /^licen[sc]e/i.test(file.name));
    if (licenses.length === 0) {
        const entry = join(directory, manifest.main ?? "index.js");
        const header = existsSync(entry) ? /^\s*(\/\*[\s\S]*?\*\/)/.exec(readFileSync(entry, "utf8"))?.[1] : undefined;
        const readme = join(directory, "README.md");
        const licenseSection = existsSync(readme) ? /^License[^\r\n]*\r?\n[-=]+\r?\n([\s\S]*)$/m.exec(readFileSync(readme, "utf8"))?.[1] : undefined;
        if (licenseSection && /copyright/i.test(licenseSection) && /redistribution|permission is hereby granted/i.test(licenseSection)) {
            notices.push(`${manifest.name}@${manifest.version}\n\n${licenseSection}`);
        }
        else if (header && manifest.license === "MIT" && /@license\s+MIT/.test(header) && /@author/.test(header)) {
            notices.push(`${manifest.name}@${manifest.version}\n\n${header}\n\n${mitPermission}`);
        }
        else if (header && /copyright/i.test(header) && /redistribution|permission is hereby granted/i.test(header)) {
            notices.push(`${manifest.name}@${manifest.version}\n\n${header}`);
        }
        else {
            throw new Error(`Missing bundled license for ${manifest.name}`);
        }
    }
    for (const license of licenses) {
        notices.push(`${manifest.name}@${manifest.version}\n\n${readFileSync(join(directory, license.name), "utf8")}`);
    }
}
writeFileSync("dist/lint/LICENSES.txt", notices.join("\n\n--------------------\n\n"));
