// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "consistent-return": ["warn", { "treatUndefinedAsUnspecified": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const ready: boolean, value: number;
function missing() { if (ready) return value; }
function mixed() { if (ready) return value; return; }
function unspecified() { if (ready) return undefined; return void 0; }
function complete() { switch (value) { case 0: return 1; default: throw Error(); } }
function finalizer() { try { if (ready) return value; } finally { return value; } }
function infinite() { outer: for (;;) { if (ready) return value; continue outer; } }
function nested() { function inner() { return value; } }
function Constructor() { if (ready) return {}; }