// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-unexpected-multiline": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const value = (foo || bar)
(value).method();
const property = foo
[key];
tag
`template`;
foo
/bar/g.test(value);
foo
();
foo
?.(value);
foo?.
[key];
foo /bar/g;