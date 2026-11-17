// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestNoDuplicateCaseDefault (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-duplicate-case": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
switch (value) { case (value): break; case value: break; }