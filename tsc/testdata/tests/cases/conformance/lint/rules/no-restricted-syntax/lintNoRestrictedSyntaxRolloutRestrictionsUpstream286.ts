// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-syntax/286 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-syntax": [
                "error",
                {
                    "message": "custom error message.",
                    "selector": "FunctionDeclaration[params.length>2]"
                }
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx
function foo(bar, baz, qux) {}