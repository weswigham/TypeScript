// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-implied-eval/class_Function_{}_new_Function();_export_{}; (invocation 1).
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
class Function {} new Function(); export {};
export {};