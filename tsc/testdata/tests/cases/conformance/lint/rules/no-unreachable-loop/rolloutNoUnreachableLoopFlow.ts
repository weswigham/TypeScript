// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-unreachable-loop": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const items: unknown[], flag: boolean;
declare function work(): void;
function once() { for (const item of items) { return item; } }
function repeat() { for (const item of items) { if (item) continue; break; } }
function nested() { outer: while (flag) { do { break outer; } while (flag); } }
function finallyStops() { while (flag) { try { work(); } finally { break; } } }
function catchRepeats() { while (flag) { try { return work(); } catch {} } }