// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-return-assign": ["error", "always"] } },
    "files": ["input.ts"]
}

// @filename: input.ts
function first() { return (result = a * b); }
function second() { return result || (result = a * b); }
const arrow = () => (result = a * b);
function nested() { return function() { result = a * b; }; }