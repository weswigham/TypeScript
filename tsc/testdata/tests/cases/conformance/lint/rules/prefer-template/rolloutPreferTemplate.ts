// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "prefer-template": "warn" } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const value: number, other: number;
const greeting = "hello " + value + "!";
const numeric = value + other + "px";
const escaped = "${literal}`" + value;
const comments = "prefix" /* keep */ + value;
const unchanged = "a" + "b";