// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoUnusedExpressions/unused_module_directive_allowed (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unused-expressions": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
namespace N { 'use strict'; f(); }