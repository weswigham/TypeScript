// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-control-regex": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const escaped = /\x00\u001f/;
const conventional = /\n\t\cA/;
const unicodeSets = /[\q{\x01|ab}]/v;
RegExp("\\x02");
function shadowed(RegExp: Function) { RegExp("\\x03"); }