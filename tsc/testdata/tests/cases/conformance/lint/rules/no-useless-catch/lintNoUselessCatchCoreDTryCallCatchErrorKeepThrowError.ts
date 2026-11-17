// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessCatch/no-useless-catch/try_{_call();_}_catch_(error)_{_/*_keep_*/_throw_error;_} (invocation 1).
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
try { call(); } catch (error) { /* keep */ throw error; }