// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/var-global-augmentation (invocation 1).
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
export {}; declare global { var x: number; }