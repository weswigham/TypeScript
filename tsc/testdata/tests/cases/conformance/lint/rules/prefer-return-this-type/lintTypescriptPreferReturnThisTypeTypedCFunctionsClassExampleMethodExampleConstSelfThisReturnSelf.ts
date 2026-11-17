// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCFunctions/prefer-return-this-type/class_Example_{_method():_Example_{_const_self_=_this;_return_self;_}_} (invocation 1).
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
class Example { method(): Example { const self = this; return self; } }