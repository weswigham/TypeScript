// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/class-methods-use-this/class_Example_implements_Interface_{_method()_{}_private_internal()_{}_} (invocation 1).
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
                    "ignoreClassesWithImplements": "public-fields"
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Example implements Interface { method() {} private internal() {} }