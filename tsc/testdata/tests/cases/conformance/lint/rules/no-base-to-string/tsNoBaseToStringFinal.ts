// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/no-base-to-string": ["error", { "checkUnknown": true }] } }
}
// @filename: input.ts

export {};
declare const unknownValue: unknown;
declare const mixed: string | { value: number };
declare const tuple: [string, { value: number }];
declare const coercible: { [Symbol.toPrimitive](): string };
class Custom {
    toString() { return "custom"; }
}
String({});
String(mixed);
String(unknownValue);
tuple.join();
({}).toLocaleString();
String(new Custom());
String(coercible);
function stringify<T extends { value: number }>(value: T) {
    return `${value}`;
}