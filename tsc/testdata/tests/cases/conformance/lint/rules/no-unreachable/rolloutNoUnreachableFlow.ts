// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-unreachable": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare function work(): void;
declare const flag: boolean;
function stopped() { return; work(); work(); }
function branches() { if (flag) { return; } else { throw 0; } work(); }
function finalized() { try { work(); } finally { return; } work(); }
function infinite() { while (true) {} work(); }
function hoisted() { return value; var value; }
function catchable() { try { work(); return; } catch { work(); } }