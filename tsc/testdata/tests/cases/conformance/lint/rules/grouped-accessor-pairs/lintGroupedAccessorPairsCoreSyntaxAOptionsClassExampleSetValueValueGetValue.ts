// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/grouped-accessor-pairs/class_Example_{_set_value(value)_{}_get_value()_{}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "grouped-accessor-pairs": [
                "error",
                "getBeforeSet"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Example { set value(value) {} get value() {} }