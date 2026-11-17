// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/initialization (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "init-declarations": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let missing; let initialized = 1; declare let ambient: number;