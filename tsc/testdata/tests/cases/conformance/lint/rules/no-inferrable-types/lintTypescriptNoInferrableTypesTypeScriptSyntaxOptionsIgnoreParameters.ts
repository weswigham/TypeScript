// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInferrableTypesOptions/ignore_parameters (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-inferrable-types": [
                "error",
                {
                    "ignoreParameters": true
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
function f(a: number = 1) {} const f2 = (b: string = '') => b; class C { constructor(public c: boolean = true) {} method(d: number = 2) {} }