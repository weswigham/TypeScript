// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCFunctions/prefer-return-this-type/class_Example_{_method(value:_Example):_Example_{_return_Math.random()_?_value_:_this;_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-return-this-type": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class Example { method(value: Example): Example { return Math.random() ? value : this; } }