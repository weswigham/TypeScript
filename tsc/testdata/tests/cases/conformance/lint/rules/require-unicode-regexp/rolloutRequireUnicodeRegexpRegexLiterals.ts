// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "require-unicode-regexp": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const legacy = /a/;
const unicode = /b/u;
const sets = /[[a-z]--[aeiou]]/v;
RegExp("c");
new RegExp("d", "g");
RegExp("e", flags);