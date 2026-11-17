// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/return-await/async_function_f()_{_return_await_Promise.resolve(1);_} (invocation 1).
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
                "error-handling-correctness-only"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function f() { return await Promise.resolve(1); }
export {};