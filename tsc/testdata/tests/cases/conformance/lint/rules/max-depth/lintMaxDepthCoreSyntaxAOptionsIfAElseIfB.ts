// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/max-depth/if_(a)_{}_else_if_(b)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-depth": [
                "error",
                1
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (a) {} else if (b) {}