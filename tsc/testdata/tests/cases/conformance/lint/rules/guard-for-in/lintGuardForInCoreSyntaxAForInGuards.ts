// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxA/for_in_guards (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "guard-for-in": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (const key in object) work(key); for (const key in object) { if (!own(key)) continue; work(key); }