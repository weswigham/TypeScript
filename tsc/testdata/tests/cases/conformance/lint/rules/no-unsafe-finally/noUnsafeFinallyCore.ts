// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-unsafe-finally": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function unsafe() { try {} finally { return 1; } }
outer: while (true) { try {} finally { while (true) { continue outer; } } }
try {} finally { label: while (true) { continue label; } }
try {} finally { while (true) { break; } }
try {} finally { function nested() { return 1; } }