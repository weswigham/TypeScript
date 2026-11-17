// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/116 (invocation 1).
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
                                "bar"
                            ],
                            "message": "Use `barbaz` instead of `bar`.",
                            "name": "mod"
                        },
                        {
                            "importNames": [
                                "foo",
                                "qux"
                            ],
                            "message": "Don't use 'foo' and `qux` from 'mod'.",
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