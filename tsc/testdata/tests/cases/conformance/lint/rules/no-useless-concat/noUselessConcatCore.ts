// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-concat": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
"a" + "b";
foo + `a` + `b`;
(foo + "a") + ("b" + "c");
"a" +
    "b";
1 + "b";