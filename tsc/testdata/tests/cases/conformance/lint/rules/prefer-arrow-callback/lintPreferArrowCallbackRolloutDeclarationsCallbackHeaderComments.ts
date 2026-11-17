// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/callback-header-comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-arrow-callback": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
foo(function /* keep */ named() {});