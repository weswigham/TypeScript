// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/inner_options (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-inner-declarations": [
                "error",
                "both",
                {
                    "blockScopedFunctions": "disallow"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {}; if (ready) { function nested() {} var item; let lexical; } class Item { static { if (ready) { var nested; } } }