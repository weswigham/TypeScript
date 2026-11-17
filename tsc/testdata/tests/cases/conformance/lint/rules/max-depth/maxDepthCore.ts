// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-depth": ["error", { "max": 2 }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
if (first) { while (second) { for (;;) { work(); } } }
if (first) {} else if (second) {} else if (third) {}
if (first) { function separate() { if (second) {} } }
class Example { static { if (first) { if (second) { if (third) {} } } } }