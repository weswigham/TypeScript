// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "arrow-body-style": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
const numeric = () => { return 1; };
const object = () => { return { value: 1 }; };
const commented = () => { /* Keep */ return 1; };
const sequence = () => { return (first(), second()); };
const empty = () => {};
const valid = () => 1;