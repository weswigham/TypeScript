// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-unneeded-ternary": ["warn", { "defaultAssignment": false }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const value: any, other: any;
const boolean = value ? true : false;
const inverse = value === other ? false : true;
const fallback = value ? value : other ?? 0;
const unchanged = (() => value)() ? true : true;