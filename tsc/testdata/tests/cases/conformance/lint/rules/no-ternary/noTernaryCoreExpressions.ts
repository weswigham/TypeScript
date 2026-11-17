// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-ternary": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const foo = true ? thing : stuff;
true ? thing() : stuff();
function foo(bar) { return bar ? baz : qux; }
"x ? y";