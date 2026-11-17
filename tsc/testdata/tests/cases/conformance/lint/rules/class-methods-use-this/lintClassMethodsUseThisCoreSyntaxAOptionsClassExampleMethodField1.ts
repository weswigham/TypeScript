// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/class-methods-use-this/class_Example_{_method()_{}_field_=_()_=>_1;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "class-methods-use-this": [
                "error",
                {
                    "enforceForClassFields": false,
                    "exceptMethods": [
                        "method"
                    ]
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Example { method() {} field = () => 1; }