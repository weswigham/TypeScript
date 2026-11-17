// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoExtraneousClass/extraneous_classes (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-extraneous-class": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Empty {} class Constructor { constructor() {} } class Static { static value = 1; }