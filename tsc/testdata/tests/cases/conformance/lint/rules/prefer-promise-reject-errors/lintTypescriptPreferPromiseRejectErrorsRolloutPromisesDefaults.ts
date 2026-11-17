// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesDefaults/prefer-promise-reject-errors (invocation 1).
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
Promise.reject('bad'); Promise.reject(new Error('bad'));
export {};