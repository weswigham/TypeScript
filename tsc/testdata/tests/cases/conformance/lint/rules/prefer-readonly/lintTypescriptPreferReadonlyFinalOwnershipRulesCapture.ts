// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipRules/prefer-readonly/capture (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-readonly": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C { private value = 1; constructor() { const self = this; (() => self.value++)(); } }