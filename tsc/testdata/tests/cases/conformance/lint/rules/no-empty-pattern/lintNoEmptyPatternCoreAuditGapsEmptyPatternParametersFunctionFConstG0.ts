// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreAuditGapsEmptyPatternParameters/function_f({})_{}_const_g_=_({}_=_{})_=>_0; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-empty-pattern": [
                "error",
                {
                    "allowObjectPatternsAsParameters": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f({}) {} const g = ({} = {}) => 0;