// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessCatch/no-useless-catch/try_{}_catch_({_error_})_{_throw_error;_}_try_{}_catch_(error)_{_work();_throw_error;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-catch": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
try {} catch ({ error }) { throw error; } try {} catch (error) { work(); throw error; }