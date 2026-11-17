// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/prefer-promise-reject-errors/const_Promise_=_{_reject(value:_unknown)_{}_};_Promise.reject(1);_export_{}; (invocation 1).
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
            "@typescript-eslint/prefer-promise-reject-errors": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const Promise = { reject(value: unknown) {} }; Promise.reject(1); export {};
export {};