// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesEdits/return-await/async_function_f()_{_return_Promise.resolve(1);_} (invocation 1).
// Migrated from TestRolloutPromisesOptionsAndTypes/return-await/async_function_f()_{_return_Promise.resolve(1);_} (invocation 1).
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
            "@typescript-eslint/return-await": [
                "error",
                "always"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function f() { return Promise.resolve(1); }
export {};