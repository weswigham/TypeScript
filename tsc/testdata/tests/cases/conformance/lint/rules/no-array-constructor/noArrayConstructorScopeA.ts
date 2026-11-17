// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-array-constructor": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
const empty = new Array();
const values = Array(first, second);
const length = Array(3);
const typed = Array<number>();
const optional = Array?.();
const spread = Array(...items);
const header = new /* keep */ Array();
const commented = Array(/* keep */ first, second);
function shadow(Array: any) { return Array(); }
work()
Array();