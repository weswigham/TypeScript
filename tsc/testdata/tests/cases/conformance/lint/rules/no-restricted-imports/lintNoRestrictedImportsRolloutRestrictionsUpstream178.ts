// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/178 (invocation 1).
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
                    "patterns": [
                        {
                            "allowImportNames": [
                                "Foo",
                                "Bar"
                            ],
                            "group": [
                                "foo/*"
                            ]
                        },
                        {
                            "allowImportNames": [
                                "Foo",
                                "Bar"
                            ],
                            "group": [
                                "*/bar"
                            ],
                            "message": "Good luck!"
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
import * as AllFooBar from "foo/bar";