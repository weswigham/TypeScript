// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-unmodified-loop-condition": ["error", { "checkConditionalExpressions": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare function work(): void;
function unchanged() { let count = 2; while (count > 0) { work(); } }
function changed() { let count = 2; while (count > 0) { count--; } }
function groups() { let first = 2, second = 3; while (first && second) { first--; } }
function conditional() { let flag = true, count = 3; while (flag ? count : 0) { flag = false; } }
function closure() { let count = 2; function update() { count--; } while (count) { update(); } }