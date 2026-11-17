// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/spread-alias (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-object-spread": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const assign = Object.assign; const o = assign({}, source);