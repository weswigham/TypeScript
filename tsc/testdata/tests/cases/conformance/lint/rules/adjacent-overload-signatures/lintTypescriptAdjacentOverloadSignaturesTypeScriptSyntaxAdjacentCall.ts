// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxAdjacentOverloadSignatures/adjacent_call (invocation 1).
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
interface I { (): void; call(): void; (a: number): void; }