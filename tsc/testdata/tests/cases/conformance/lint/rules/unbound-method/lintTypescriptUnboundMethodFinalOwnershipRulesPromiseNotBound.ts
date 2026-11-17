// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipRules/unbound-method/promise_not_bound (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/unbound-method": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const method = Promise.all;