// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutRestrictionsUpstream/no-restricted-imports/185 (invocation 1).
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
                            "importNamePattern": "_Enum$",
                            "regex": "@app/(?!(api/enums$)).*"
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

        // error
        import { Foo_Enum } from '@app/api';
        import { Bar_Enum } from '@app/api/bar';
        import { Baz_Enum } from '@app/api/baz';
        import { B_Enum } from '@app/api/enums/foo';

        // no error
        import { C_Enum } from '@app/api/enums';
        