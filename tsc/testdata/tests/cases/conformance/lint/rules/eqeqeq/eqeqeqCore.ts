// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "eqeqeq": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
left == right;
left != null;
typeof left == "string";
1 != 2;
"first" == `second`;
left === right;
typeof left /* Keep */ == "string";