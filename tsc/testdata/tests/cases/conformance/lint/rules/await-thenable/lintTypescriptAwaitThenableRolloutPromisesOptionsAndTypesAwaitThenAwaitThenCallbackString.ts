// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/await-thenable/await_{_then()_{}_};_await_{_then(callback:_string)_{}_}; (invocation 1).
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
await { then() {} }; await { then(callback: string) {} };
export {};