// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-misused-promises/declare_const_value:_Promise<number>_|_boolean;_if_(value)_{}#01 (invocation 1).
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
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    "checksConditionals": {
                        "flagUnions": "all"
                    }
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const value: Promise<number> | boolean; if (value) {}
export {};