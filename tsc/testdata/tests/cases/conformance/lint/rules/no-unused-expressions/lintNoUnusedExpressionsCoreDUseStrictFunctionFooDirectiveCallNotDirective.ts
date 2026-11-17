// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreDNoUnusedExpressions/no-unused-expressions/'use_strict';_function_foo()_{_'directive';_call();_'not_directive';_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unused-expressions": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
'use strict'; function foo() { 'directive'; call(); 'not directive'; }