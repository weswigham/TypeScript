// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-return-assign": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function first() { return result = a * b; }
function second() { return (result = a * b); }
function third() { return (result) = (a * b); }
const arrow = () => result = a * b;
const allowed = () => (result = a * b);
const nested = () => function() { result = a * b; };