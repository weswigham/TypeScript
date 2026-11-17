// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsNamingConvention/class_Item_{_#bad_name_=_1;_goodName_=_1;_} (invocation 2).
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
                        "camelCase"
                    ],
                    "selector": "property"
                },
                {
                    "format": [
                        "snake_case"
                    ],
                    "modifiers": [
                        "#private"
                    ],
                    "selector": "property"
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
class Item { #bad_name = 1; goodName = 1; }