// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABlockAndNative/block-scoped-var/for_(var_index_=_0;;)_{}_for_(var_index_=_0;;)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "block-scoped-var": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (var index = 0;;) {} for (var index = 0;;) {}