// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoIterator/iterator (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-iterator": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
value.__iterator__; value['__iterator__']; value[`__iterator__`]; value[iterator];