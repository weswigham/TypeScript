// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-classes-per-file": ["error", { "max": 1, "ignoreExpressions": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
class First {}
const expression = class {};
class Second {}