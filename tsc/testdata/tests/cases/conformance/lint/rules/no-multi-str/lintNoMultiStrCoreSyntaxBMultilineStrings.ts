// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoMultiStr/multiline_strings (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-multi-str": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const first = 'line\
next'; const second = `line
next`; const third = 'line\nnext';