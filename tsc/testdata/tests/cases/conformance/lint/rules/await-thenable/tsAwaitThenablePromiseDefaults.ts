// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/await-thenable": "error" } }
}
// @filename: input.ts
async function check<T>(value: T) {
    await 1;
    await value;
    await Promise.resolve(1);
    await { then(resolve: (value: number) => void) { resolve(1); } };
    for await (const item of [1, 2]) {}
    await using resource = { [Symbol.dispose]() {} };
}
Promise.all([1, Promise.resolve(2)]);
export {};