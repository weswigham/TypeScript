// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesEdits/await-thenable/const_f_=_async_()_=>_await_{_value:_1_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "lib": [
            "esnext",
            "dom"
        ],
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/await-thenable": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const f = async () => await { value: 1 };
export {};