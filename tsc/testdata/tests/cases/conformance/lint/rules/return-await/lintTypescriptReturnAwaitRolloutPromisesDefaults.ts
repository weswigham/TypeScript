// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesDefaults/return-await (invocation 1).
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
async function f() { return await 1; } async function g() { try { return Promise.resolve(1); } catch {} }
export {};