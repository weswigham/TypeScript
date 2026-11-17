// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/prefer-promise-reject-errors": "error" } }
}
// @filename: input.ts
Promise.reject("text");
Promise.reject(new Error("text"));
Promise.reject();
new Promise((resolve, reject) => {
    reject(1);
    function shadowed(reject: (value: number) => void) { reject(1); }
});
class Derived<T> extends Promise<T> {}
Derived.reject(1);
export {};