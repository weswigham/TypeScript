// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-floating-promises/void_Promise.resolve(); (invocation 1).
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
            "@typescript-eslint/no-floating-promises": [
                "error",
                {
                    "ignoreVoid": false
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
void Promise.resolve();
export {};