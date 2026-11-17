// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/return-await/async_function_f()_{_try_{}_finally_{_return_Promise.resolve(1);_}_} (invocation 1).
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
            "@typescript-eslint/return-await": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function f() { try {} finally { return Promise.resolve(1); } }
export {};