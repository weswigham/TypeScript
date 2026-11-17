// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/loop_header_exclusions (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-loop-func": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (var index = 0, callback = () => index; index < 3; index++) {} for (var item of values.filter(() => item)) {}