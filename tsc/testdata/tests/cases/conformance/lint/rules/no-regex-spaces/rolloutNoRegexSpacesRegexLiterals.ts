// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-regex-spaces": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const repeated = /a   b/;
const quantified = /a   +/;
const safe = /[  ]/;
const sets = /[[  ]--[a]]/v;
new RegExp("c  d");
RegExp("\\d  x");