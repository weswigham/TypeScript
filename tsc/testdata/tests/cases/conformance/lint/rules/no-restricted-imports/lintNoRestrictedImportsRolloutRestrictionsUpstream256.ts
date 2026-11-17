// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/256 (invocation 1).
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
                            "allowTypeImports": false,
                            "message": "This export is restricted.",
                            "name": "restricted-path"
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

			  // Both regular and type imports should still be restricted
			  export { Foo } from 'restricted-path';
			  export type { Bar } from 'restricted-path';
			