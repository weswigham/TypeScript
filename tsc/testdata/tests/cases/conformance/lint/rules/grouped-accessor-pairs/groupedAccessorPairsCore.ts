// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "grouped-accessor-pairs": ["error", "getBeforeSet", { "enforceForTSTypes": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
const separated = { get value() { return 1; }, other: 1, set value(value: number) {} };
class WrongOrder { set value(value: number) {} get value() { return 1; } }
class Valid { get value() { return 1; } set value(value: number) {} }
interface Contract { set value(value: number); get value(): number; }