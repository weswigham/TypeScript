// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxAdjacentOverloadSignatures/adjacent_names (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/adjacent-overload-signatures": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
interface I { f(a: string): void; ['f'](a: number): void; [f](a: boolean): void; }