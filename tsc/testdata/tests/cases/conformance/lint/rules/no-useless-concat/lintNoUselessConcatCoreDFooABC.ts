// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUselessConcat/no-useless-concat/(foo_+_'a')_+_('b'_+_'c'); (invocation 1).
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
(foo + 'a') + ('b' + 'c');