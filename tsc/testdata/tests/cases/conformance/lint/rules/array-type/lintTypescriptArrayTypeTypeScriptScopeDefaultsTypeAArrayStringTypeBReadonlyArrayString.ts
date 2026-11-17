// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/array-type/type_A_=_Array<string>;_type_B_=_ReadonlyArray<string>; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/array-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type A = Array<string>; type B = ReadonlyArray<string>;