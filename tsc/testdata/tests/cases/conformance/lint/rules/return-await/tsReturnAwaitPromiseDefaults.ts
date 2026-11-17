// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/return-await": "error" } }
}
// @filename: input.ts
async function nonPromise() { return await /* retained */ 1; }
async function ordinary() { return await Promise.resolve(1); }
async function guarded() {
    try { return Promise.resolve(1); } catch { return Promise.resolve(2); }
}
const object = async () => await { value: 1 };
async function resources() {
    using resource = { [Symbol.dispose]() {} };
    return Promise.resolve(1);
}
export {};