// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-misleading-character-class": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const legacy = /[\uD83D\uDE00]/;
const combined = /[a\u0301]/u;
const modifier = /[\u{1f44d}\u{1f3fb}]/u;
const flag = /[\u{1f1fa}\u{1f1f8}]/v;
const joined = /[a\u200db]/u;
const safe = /[\uD83D\uDE00]/u;