// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsNamingConvention/const_isReady:_boolean_|_undefined_=_true; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    "format": [
                        "PascalCase"
                    ],
                    "prefix": [
                        "is"
                    ],
                    "selector": "variable",
                    "types": [
                        "boolean"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts",
        "module.ts"
    ]
}
// @filename: /module.ts
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
// @filename: /input.ts
const isReady: boolean | undefined = true;