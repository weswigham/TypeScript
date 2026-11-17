// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/if_(a)_{_b_||_c;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "complexity": [
                "error",
                0
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
if (a) { b || c; }