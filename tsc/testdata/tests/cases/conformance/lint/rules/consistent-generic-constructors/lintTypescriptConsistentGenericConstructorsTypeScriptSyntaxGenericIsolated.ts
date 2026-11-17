// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentGenericConstructors/generic_isolated (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext",
        "isolatedDeclarations": true
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-generic-constructors": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const value: Box<string> = new Box();