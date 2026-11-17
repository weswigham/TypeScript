// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesDefaults/no-implied-eval (invocation 1).
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
setTimeout('alert(1)', 0); setTimeout(() => {}, 0);
export {};