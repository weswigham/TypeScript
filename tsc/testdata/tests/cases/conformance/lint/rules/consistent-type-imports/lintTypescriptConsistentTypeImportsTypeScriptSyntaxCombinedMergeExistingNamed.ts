// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentTypeImportsCombined/merge_existing_named (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-type-imports": "error"
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
import type { C } from 'x'; import A, { B } from 'x'; let a: A; let b: B;