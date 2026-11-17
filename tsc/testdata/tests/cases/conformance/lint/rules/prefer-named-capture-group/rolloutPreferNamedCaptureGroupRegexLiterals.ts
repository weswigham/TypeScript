// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "prefer-named-capture-group": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const unnamed = /(a)(b)/;
const named = /(?<word>a)(?:b)/u;
RegExp("(c)");
new RegExp(String.raw`(\w)`);