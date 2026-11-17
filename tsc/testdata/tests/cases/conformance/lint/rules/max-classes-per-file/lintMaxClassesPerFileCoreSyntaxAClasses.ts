// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/classes (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "max-classes-per-file": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class One {} const Two = class {};