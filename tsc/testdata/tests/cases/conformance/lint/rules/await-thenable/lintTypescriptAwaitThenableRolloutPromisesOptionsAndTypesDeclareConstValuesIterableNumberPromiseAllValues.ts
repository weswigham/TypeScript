// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/await-thenable/declare_const_values:_Iterable<number>;_Promise.all(values); (invocation 1).
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
declare const values: Iterable<number>; Promise.all(values);
export {};