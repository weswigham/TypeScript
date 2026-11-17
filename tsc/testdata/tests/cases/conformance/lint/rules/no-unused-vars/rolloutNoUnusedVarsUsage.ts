// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-unused-vars": ["error", { "args": "all", "ignoreRestSiblings": true }] } }
}
// @filename: input.ts
export const exported = 1;
let writeOnly = 0;
writeOnly = writeOnly + 1;
function recursive() {
    return recursive();
}
export function select({ omitted, ...rest }: any, unused: number) {
    return rest;
}
const typeOnlyRead = 1;
type TypeOnly = typeof typeOnlyRead;
try {
    throw new Error();
} catch (error) {}