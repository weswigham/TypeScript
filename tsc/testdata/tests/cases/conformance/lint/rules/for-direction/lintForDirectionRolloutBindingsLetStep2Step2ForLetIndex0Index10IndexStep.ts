// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsForDirection/let_step_=_-2;_step_=_2;_for_(let_index_=_0;_index_<_10;_index_+=_step)_{} (invocation 1).
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
let step = -2; step = 2; for (let index = 0; index < 10; index += step) {}