// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxAdjacentOverloadSignatures/adjacent_construct_name_collision (invocation 1).
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
interface I { new(): I; 'new'(): void; new(a: number): I; }