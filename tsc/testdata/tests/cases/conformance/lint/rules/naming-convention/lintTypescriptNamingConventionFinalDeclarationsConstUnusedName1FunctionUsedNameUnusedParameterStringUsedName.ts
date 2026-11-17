// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsNamingConvention/const_UnusedName_=_1;_function_UsedName(UnusedParameter:_string)_{}_UsedName(''); (invocation 2).
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
                        "snake_case"
                    ],
                    "modifiers": [
                        "unused"
                    ],
                    "selector": "default"
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
const UnusedName = 1; function UsedName(UnusedParameter: string) {} UsedName('');