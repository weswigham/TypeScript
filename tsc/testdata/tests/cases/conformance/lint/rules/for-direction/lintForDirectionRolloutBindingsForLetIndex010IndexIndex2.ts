// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsForDirection/for_(let_index_=_0;_10_>_index;_index_-=_2)_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "for-direction": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (let index = 0; 10 > index; index -= 2) {}