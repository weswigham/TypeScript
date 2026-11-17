// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/coercion_allow (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-implicit-coercion": [
                "error",
                {
                    "allow": [
                        "!!",
                        "+",
                        "- -",
                        "*",
                        "-",
                        "~"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
!!value; +value; - -value; value * 1; value - 0; '' + value; value += ''; ~items.indexOf(value);