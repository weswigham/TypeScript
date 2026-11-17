// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCReports/radix/function_local(parseInt,_Number,_undefined)_{_parseInt();_Number.parseInt();_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "radix": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function local(parseInt, Number, undefined) { parseInt(); Number.parseInt(); }