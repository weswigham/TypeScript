// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "module": "esnext", "target": "esnext", "strict": true },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/strict-boolean-expressions": "error"
        }
    },
    "files": ["first.ts", "second.ts"]
}
// @filename: first.ts
declare const value: { enabled: boolean } | undefined;
declare const count: number | undefined;
export const enabled = value && value.enabled;
if (count) {}
// @filename: second.ts
declare const value: { enabled: boolean } | undefined;
declare const count: number | undefined;
export const enabled = value && value.enabled;
if (count) {}
