// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-backreference": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const forward = /\1(a)/;
const nested = /(a\1)/;
const disjunctive = /(a)|\1/;
const negative = /(?!(a))\1/;
const backward = /(?<=(a)\1)/;
const useful = /(a)\1/;
const names = /(?<word>a)|(?<word>b)\k<word>/u;