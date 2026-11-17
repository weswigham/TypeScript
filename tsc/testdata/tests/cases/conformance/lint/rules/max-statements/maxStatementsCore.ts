// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-statements": ["error", { "max": 2 }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
function excessive() { first(); second(); third(); }
function nested() { if (value) { first(); second(); } }
function separate() { function inner() { first(); second(); } last(); }
class Example { static { first(); second(); third(); } }