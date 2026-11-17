// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "valid-typeof": ["error", { "requireStringLiterals": true }] } }
}
// @filename: input.ts
typeof value === "strnig";
typeof value === undefined;
typeof value === 0;
typeof value === other;
typeof value === typeof other;
typeof value === "bigint";
"number" !== typeof value;
function shadowed(undefined: string) {
    return typeof value === undefined;
}