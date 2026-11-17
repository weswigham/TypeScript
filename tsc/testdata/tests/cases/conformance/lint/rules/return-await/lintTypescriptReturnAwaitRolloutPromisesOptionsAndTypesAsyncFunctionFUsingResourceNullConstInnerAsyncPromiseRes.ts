// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/return-await/async_function_f()_{_using_resource_=_null;_const_inner_=_async_()_=>_Promise.resolve(1);_} (invocation 1).
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
async function f() { using resource = null; const inner = async () => Promise.resolve(1); }
export {};