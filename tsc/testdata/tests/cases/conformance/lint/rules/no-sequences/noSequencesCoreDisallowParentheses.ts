// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-sequences": ["error", { "allowInParentheses": false }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
const value = (1, 2);
(0, eval)("foo()");
if ((doSomething(), test)) {}
for ((i = 0, j = 0); test; (i++, j++)) {}