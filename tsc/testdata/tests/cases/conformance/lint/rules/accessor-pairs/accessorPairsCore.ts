// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "accessor-pairs": ["error", { "getWithoutSet": true, "enforceForTSTypes": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
const missingGetter = { set value(value: number) {} };
const missingSetter = { get value() { return 1; } };
const valid = { get value() { return 1; }, set value(value: number) {} };
class Example { static get value() { return 1; } set value(value: number) {} }
interface Contract { set value(value: number); }
Object.defineProperty(valid, "other", { set(value: number) {} });