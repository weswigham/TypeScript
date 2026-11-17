// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/262 (invocation 1).
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
                        {
                            "allowImportNames": [
                                "bar"
                            ],
                            "allowTypeImports": true,
                            "name": "foo"
                        }
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
import { baz } from "foo";