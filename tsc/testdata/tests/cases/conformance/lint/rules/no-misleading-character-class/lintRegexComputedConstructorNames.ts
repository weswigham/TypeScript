// @lintOnly: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-misleading-character-class": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const callbacks: (() => unknown)[];
let index = 0;
callbacks[index++]();
globalThis[index++]("[a\\u0301]");
const property = "RegExp";
globalThis[property]("[a\\u0301]");
const { [property]: FromGlobal } = globalThis;
new FromGlobal("[a\\u0301]");
