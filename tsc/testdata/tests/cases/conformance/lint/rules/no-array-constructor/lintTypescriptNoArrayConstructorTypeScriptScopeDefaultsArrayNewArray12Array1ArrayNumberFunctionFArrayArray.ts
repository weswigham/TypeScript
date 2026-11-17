// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-array-constructor/Array();_new_Array(1,_2);_Array(1);_Array<number>();_function_f(Array)_{_Array();_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-array-constructor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
Array(); new Array(1, 2); Array(1); Array<number>(); function f(Array) { Array(); }