// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/const-comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-const": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let /* keep */ x = 1;