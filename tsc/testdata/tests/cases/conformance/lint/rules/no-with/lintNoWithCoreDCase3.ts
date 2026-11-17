// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoWith (invocation 3).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-with": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
object.work();