// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessCatch/no-useless-catch/try_{}_catch_(error)_{_throw_(error);_unreachable();_}_finally_{} (invocation 1).
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
try {} catch (error) { throw (error); unreachable(); } finally {}