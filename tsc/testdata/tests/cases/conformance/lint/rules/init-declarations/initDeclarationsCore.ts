// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "init-declarations": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
let missing: number;
let initialized = 1;
for (let index; false;) {}
for (const key in object) {}
declare let ambient: number;
declare namespace Ambient { let value: number; }