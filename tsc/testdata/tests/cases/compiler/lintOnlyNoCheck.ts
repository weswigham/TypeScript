// @lintOnly: true
// @noCheck: false
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "strict": true },
    "lint": {
        "rules": {
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-unnecessary-type-arguments": "error"
        }
    },
    "files": ["input.ts"]
}
// @filename: input.ts
declare function value<T = string>(): T;
async function check() {
    const invalid: number = "text";
    await 123;
    value<string>();
    Promise.resolve();
}
