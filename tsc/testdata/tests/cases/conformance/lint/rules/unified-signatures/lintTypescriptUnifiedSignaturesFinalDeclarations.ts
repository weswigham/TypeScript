// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsUnifiedSignatures (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/unified-signatures": "error"
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
function run(value: string | number): void; function run(value: number | boolean): void;