// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAArray/new_/*_keep_*/_Array(); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-array-constructor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new /* keep */ Array();