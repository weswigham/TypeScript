// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/30 (invocation 1).
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
                                "DisallowedObject"
                            ],
                            "message": "Please import 'DisallowedObject' from /bar/ instead.",
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
import { 'AllowedObject' as bar } from "foo";