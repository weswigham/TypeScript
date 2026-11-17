// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsNamingConvention/interface_Item_{_BadMethod():_void;_BadProperty:_string;_} (invocation 2).
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
                    "selector": "memberLike"
                },
                {
                    "format": [
                        "PascalCase"
                    ],
                    "selector": [
                        "method",
                        "property"
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
interface Item { BadMethod(): void; BadProperty: string; }