// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/dot_notation (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "dot-notation": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
object['name']; object[`other`]; object['with space'];