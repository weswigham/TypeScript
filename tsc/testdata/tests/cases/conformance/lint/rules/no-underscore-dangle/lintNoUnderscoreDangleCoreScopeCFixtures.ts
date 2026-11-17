// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/no-underscore-dangle (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-underscore-dangle": [
                "error",
                {
                    "allowFunctionParams": false,
                    "allowInObjectDestructuring": false,
                    "enforceInClassFields": true,
                    "enforceInMethodNames": true
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
let _value = 0;
function named_(_parameter = 0) {
    return _parameter;
}
const { _binding } = source;
object._field;
object[_computed];
object["_literal"];
object.__proto__;
class Example {
    #_private;
    _method() {}
}