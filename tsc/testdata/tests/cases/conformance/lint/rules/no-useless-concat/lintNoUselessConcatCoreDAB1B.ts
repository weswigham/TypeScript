// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessConcat/no-useless-concat/'a'_+__'b';_1_+_`b`; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-concat": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'a' +
 'b'; 1 + `b`;