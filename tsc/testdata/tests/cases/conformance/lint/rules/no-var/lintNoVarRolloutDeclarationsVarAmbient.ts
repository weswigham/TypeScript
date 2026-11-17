// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/var-ambient (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-var": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare namespace N { var x: number; }