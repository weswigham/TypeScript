// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCMembers/prefer-reduce-type-parameter/[1,_2].reduce((acc,_value)_=>_acc.concat(value),_[]_as_number[]); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-reduce-type-parameter": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
[1, 2].reduce((acc, value) => acc.concat(value), [] as number[]);