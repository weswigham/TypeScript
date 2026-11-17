// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/233 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-imports": [
                "error",
                {
                    "paths": [
                        "import1",
                        "import2"
                    ],
                    "patterns": [
                        "import1/private/*",
                        "import2/*",
                        "!import2/good"
                    ]
                }
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx
export { foo } from 'import1/private/foo';