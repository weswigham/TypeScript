// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/117 (invocation 1).
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
                            "importNames": [
                                "foo",
                                "baz"
                            ],
                            "message": "Don't use 'foo' or 'baz' from 'mod'.",
                            "name": "mod"
                        },
                        {
                            "importNames": [
                                "a",
                                "c"
                            ],
                            "message": "Don't use 'a' or 'c' from 'mod'.",
                            "name": "mod"
                        },
                        {
                            "importNames": [
                                "b",
                                "bar"
                            ],
                            "message": "Use 'b' or `bar` from 'quux/mod' instead.",
                            "name": "mod"
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
import { foo, bar, baz, qux } from 'mod'