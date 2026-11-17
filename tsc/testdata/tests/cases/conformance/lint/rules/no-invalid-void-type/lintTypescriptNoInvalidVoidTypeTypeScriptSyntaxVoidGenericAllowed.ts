// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInvalidVoidType/void_generic_allowed (invocation 1).
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
let value: Promise<void>; type T = void | Promise<void>;