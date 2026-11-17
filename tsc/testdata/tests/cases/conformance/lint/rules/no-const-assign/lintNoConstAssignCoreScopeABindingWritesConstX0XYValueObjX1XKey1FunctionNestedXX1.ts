// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeABindingWrites/no-const-assign/const_x_=_0;_({_[x]:_y_}_=_value);_obj.x_=_1;_x.key_=_1;_function_nested(x)_{_x_=_1;_} (invocation 1).
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
const x = 0; ({ [x]: y } = value); obj.x = 1; x.key = 1; function nested(x) { x = 1; }