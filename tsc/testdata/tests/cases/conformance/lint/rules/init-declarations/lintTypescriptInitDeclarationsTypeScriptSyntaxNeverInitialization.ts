// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxInitDeclarations/never_initialization (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/init-declarations": [
                "error",
                "never"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let value = 1; const valid = 1;