// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "capitalized-comments": ["error", "always", { "ignorePattern": "todo" }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
// lowercase
const value = /* lowercase */ 1;
/* Uppercase */
// todo: ignored
// eslint-disable-next-line
// https://example.com
/** @param value The value. */
function inspect(value: number) { return value; }