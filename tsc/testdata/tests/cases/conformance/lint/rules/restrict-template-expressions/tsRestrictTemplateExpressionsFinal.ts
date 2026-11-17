// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/restrict-template-expressions": ["error", { "allowArray": true, "allowNumber": false, "allowAny": false }] } }
}
// @filename: input.ts

export {};
declare const unknownValue: unknown;
declare const neverValue: never;
declare const branded: string & { brand: true };
`${{}}`;
`${123}`;
`${["text", 1]}`;
`${unknownValue}`;
`${neverValue}`;
`${new Error()}`;
`${branded}`;
`${["text"]}`;
function constrained<T extends string | { value: number }>(value: T) {
    return `${value}`;
}