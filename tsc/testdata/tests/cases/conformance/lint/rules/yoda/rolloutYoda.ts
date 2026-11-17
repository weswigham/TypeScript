// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "yoda": ["warn", "never", { "exceptRange": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const value: number, object: any;
if (1 < value) {}
if (-1n <= value) {}
if (0 <= value && value < 1) {}
if (1 <= value && value < 0) {}
if (0 <= object.value && object["value"] <= 1) {}