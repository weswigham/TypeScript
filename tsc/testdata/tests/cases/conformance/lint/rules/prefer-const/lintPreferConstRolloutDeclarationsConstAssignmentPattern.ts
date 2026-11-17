// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/const-assignment-pattern (invocation 1).
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
let x, y; ({x, y} = obj);