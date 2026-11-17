// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoEmpty/empty_catch_option (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty": [
                "error",
                {
                    "allowEmptyCatch": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
try { work(); } catch {}