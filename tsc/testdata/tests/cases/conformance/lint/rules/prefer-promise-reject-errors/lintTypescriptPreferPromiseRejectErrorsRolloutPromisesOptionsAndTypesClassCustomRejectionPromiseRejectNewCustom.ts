// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/prefer-promise-reject-errors/class_CustomRejection_{}_Promise.reject(new_CustomRejection()); (invocation 1).
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
            "@typescript-eslint/prefer-promise-reject-errors": [
                "error",
                {
                    "allow": [
                        {
                            "from": "file",
                            "name": "CustomRejection"
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
class CustomRejection {} Promise.reject(new CustomRejection());
export {};