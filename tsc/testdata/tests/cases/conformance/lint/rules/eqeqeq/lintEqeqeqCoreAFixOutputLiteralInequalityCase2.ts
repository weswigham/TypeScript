// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAEqeqeqFixOutput/literal_inequality (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "eqeqeq": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
1/* Left */!==/* Right */2;