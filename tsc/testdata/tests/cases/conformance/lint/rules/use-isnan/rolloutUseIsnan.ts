// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "use-isnan": ["warn", { "enforceForIndexOf": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
declare const value: number, values: number[];
value === NaN;
value != Number.NaN;
value < NaN;
switch (NaN) { case NaN: break; }
values.indexOf(NaN);
values.lastIndexOf(NaN, 1);
function shadowed(NaN: number) { return value === NaN; }