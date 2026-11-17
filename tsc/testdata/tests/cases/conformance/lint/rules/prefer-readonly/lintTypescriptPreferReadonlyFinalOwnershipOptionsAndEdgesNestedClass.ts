// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipOptionsAndEdges/nested_class (invocation 1).
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
class C { private value = 1; method() { return class { private value = 1; method() { this.value++; } }; } }