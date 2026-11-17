// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsUnifiedSignatures/declare_function_run(value:_number):_void;_declare_function_run(value:_string):_void; (invocation 1).
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
declare function run(value: number): void; declare function run(value: string): void;