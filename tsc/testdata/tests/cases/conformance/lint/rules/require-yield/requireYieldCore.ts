// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "require-yield": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function* missing() { return 0; }
function* empty() {}
function* outer() { function* inner() { yield 1; } }
function* yielding() { yield 1; }
const object = { *missing() { return 0; } };
class Example { *missing() { return 0; } }