// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesDefaults/require-await (invocation 1).
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
            "@typescript-eslint/require-await": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
async function f() { return 1; } async function g() { return Promise.resolve(1); }
export {};