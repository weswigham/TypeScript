// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/init-declarations": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
let missing: number;
var alsoMissing: string;
let initialized = 1;
const constant = 2;
declare let ambient: number;
declare namespace Ambient { let value: number; }
for (const item of [1, 2]) { void item; }
for (const key in { value: 1 }) { void key; }
export {};