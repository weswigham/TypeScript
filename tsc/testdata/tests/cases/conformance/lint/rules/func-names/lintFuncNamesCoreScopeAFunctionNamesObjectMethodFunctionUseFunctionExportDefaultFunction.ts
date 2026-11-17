// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAFunctionNames/object.method_=_function()_{};_use(function()_{});_export_default_function()_{} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "func-names": [
                "error",
                "as-needed"
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
object.method = function() {}; use(function() {}); export default function() {}