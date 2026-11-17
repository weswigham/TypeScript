// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/no-for-in-array": "error" } }
}
// @filename: input.ts

declare const array: number[] | null | { value: string };
for (const key in array) {}

declare const numericIndex: { [key: number]: number };
for (const key in numericIndex) {}

declare const arrayLike: { [key: number]: number; length: 1 };
for (const key in arrayLike) {}

function generic<T extends readonly number[]>(values: T) {
    for (const key in values) {}
}