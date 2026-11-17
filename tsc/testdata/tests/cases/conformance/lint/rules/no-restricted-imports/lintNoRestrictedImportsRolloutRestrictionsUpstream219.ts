// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/219 (invocation 1).
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
                            "allowTypeImports": true,
                            "message": "usage of import1 private modules not allowed.",
                            "regex": "import1/.*"
                        },
                        {
                            "allowTypeImports": true,
                            "message": "usage of import2 private modules not allowed.",
                            "regex": "import2/.*"
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

  import type { foo } from 'import1/private/bar';
  import type { foo } from 'import2/private/bar';
		