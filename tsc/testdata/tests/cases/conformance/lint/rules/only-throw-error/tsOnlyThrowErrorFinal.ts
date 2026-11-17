// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/only-throw-error": ["error", { "allowThrowingAny": false, "allowThrowingUnknown": false }] } }
}
// @filename: input.ts

export {};
function invalid(value: any, unknownValue: unknown) {
    if (value) throw value;
    if (unknownValue) throw unknownValue;
    throw undefined;
}
function structural() {
    throw { name: "Error", message: "not an Error instance" };
}
function constrained<T extends Error>(value: T) {
    throw value;
}
try {
    throw new TypeError();
} catch (error) {
    throw error;
}
Promise.reject().catch(error => { throw error; });
Promise.reject().then(undefined, error => { throw error; });