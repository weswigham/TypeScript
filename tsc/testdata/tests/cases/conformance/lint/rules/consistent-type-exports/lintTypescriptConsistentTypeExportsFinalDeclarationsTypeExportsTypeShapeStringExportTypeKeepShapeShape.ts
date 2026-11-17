// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsTypeExports/type_Shape_=_string;_export_{_type_/*_keep_*/_Shape,_Shape_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-type-exports": [
                "error",
                {
                    "fixMixedExportsWithInlineTypeSpecifier": false
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
type Shape = string; export { type /* keep */ Shape, Shape };