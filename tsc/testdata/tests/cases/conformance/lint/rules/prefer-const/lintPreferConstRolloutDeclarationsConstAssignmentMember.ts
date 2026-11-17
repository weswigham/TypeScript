// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/const-assignment-member (invocation 1).
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
let x; [obj.y, x] = values;