// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedAGeneratedEmpty/index_signature (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-generated-empty-object-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Dict<T> = { [key: string]: T }; type Other = Dict<string>;