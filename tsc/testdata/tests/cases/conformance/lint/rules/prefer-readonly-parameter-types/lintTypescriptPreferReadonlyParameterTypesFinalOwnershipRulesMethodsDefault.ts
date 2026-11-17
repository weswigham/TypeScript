// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipRules/prefer-readonly-parameter-types/methods_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-readonly-parameter-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(value: { method(): void }) {}