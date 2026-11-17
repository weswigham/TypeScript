// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/destructure-renamed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-destructuring": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const x = obj.y;