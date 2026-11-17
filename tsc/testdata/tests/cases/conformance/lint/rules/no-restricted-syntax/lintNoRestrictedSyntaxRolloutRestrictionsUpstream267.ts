// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-syntax/267 (invocation 1).
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
                "ArrowFunctionExpression > BlockStatement"
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx
() => 5