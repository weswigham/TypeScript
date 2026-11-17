// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/no-array-delete": "error" } }
}
// @filename: input.ts

declare const array: number[];
delete array[0];
declare const tuple: [number, string];
delete tuple[0];
declare const mixed: number[] | { [key: number]: number };
delete mixed[0];
declare const intersected: string & number[];
delete intersected[0];
function generic<T extends number[]>(values: T) {
    delete values[0];
}