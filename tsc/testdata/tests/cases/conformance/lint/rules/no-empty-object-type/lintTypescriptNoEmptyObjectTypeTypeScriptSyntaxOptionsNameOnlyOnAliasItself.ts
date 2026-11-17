// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoEmptyObjectTypeOptions/name_only_on_alias_itself (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-empty-object-type": [
                "error",
                {
                    "allowWithName": "Props$"
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
type Props = { nested: {} }; type MoreProps = {} | null; let Props: {}; type WrappedProps = ({});