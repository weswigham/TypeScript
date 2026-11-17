// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-floating-promises/type_Safe_=_Promise<number>_&_{_brand:_true_};_declare_const_value:_Safe;_value; (invocation 1).
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
            "@typescript-eslint/no-floating-promises": [
                "error",
                {
                    "allowForKnownSafePromises": [
                        {
                            "from": "file",
                            "name": "Safe"
                        }
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Safe = Promise<number> & { brand: true }; declare const value: Safe; value;
export {};