// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesEdits/await-thenable/await_/*_keep_*/_1; (invocation 1).
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
await /* keep */ 1;
export {};