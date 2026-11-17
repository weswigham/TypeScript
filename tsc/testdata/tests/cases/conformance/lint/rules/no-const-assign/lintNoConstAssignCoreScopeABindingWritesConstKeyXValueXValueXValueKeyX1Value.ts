// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABindingWrites/no-const-assign/const_{_key:_x_}_=_value;_[x]_=_value;_({_x_}_=_value);_({_key:_x_=_1_}_=_value); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-const-assign": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const { key: x } = value; [x] = value; ({ x } = value); ({ key: x = 1 } = value);