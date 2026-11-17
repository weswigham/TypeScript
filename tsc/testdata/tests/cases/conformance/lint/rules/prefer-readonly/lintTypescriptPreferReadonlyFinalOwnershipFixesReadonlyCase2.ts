// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipFixes/readonly (invocation 2).
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
class C { private readonly value = 1; }