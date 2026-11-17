// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInvalidVoidType/void_overload_allowed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-invalid-void-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(): void; function f(x?: string): string | void {}