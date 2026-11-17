// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedAGeneratedEmpty/generic_mapped (invocation 1).
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
type Generic<T extends string> = Record<T, unknown>;