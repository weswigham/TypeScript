// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "prefer-exponentiation-operator": "warn" } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const value: number, exponent: number;
Math.pow(value, exponent);
Math.pow(-value, exponent + 1);
Math.pow(value, exponent).toString();
const { pow } = Math;
pow(value, exponent);
Math.pow(/* keep */ value, exponent);
function shadowed(Math: any) { return Math.pow(value, exponent); }