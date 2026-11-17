// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-implied-eval/new_Function('text');_Function('text');_window['setTimeout']('text'); (invocation 1).
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
            "@typescript-eslint/no-implied-eval": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Function('text'); Function('text'); window['setTimeout']('text');
export {};