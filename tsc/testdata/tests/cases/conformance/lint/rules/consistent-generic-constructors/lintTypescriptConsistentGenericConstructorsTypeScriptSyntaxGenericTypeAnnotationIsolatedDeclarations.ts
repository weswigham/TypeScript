// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxGenericTypeAnnotation/isolated_declarations (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext",
        "isolatedDeclarations": true
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-generic-constructors": [
                "error",
                "type-annotation"
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
const a = new Foo<string>();