// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalDeclarationsUnifiedSignatures/interface_Item<T>_{_run():_void;_run(values:_T[]):_void;_} (invocation 1).
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
interface Item<T> { run(): void; run(values: T[]): void; }