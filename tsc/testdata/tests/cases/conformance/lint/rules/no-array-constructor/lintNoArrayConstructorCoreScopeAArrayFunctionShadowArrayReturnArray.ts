// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAArray/function_shadow(Array)_{_return_Array();_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-array-constructor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function shadow(Array) { return Array(); }