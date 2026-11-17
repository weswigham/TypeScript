// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/require-atomic-updates/_____________async_function_foo()_{_________________if_(1);_________________if_(2);_________________if_(3);_________________if_(4);_________________if_(5);_________________if_(6);_________________if_(7);_________________if_(8);_________________if_(9);_________________if_(10);_________________if_(11);_________________if_(12);_________________if_(13);_________________if_(14);_________________if_(15);_________________if_(16);_________________if_(17);_________________if_(18);_________________if_(19);_________________if_(20);_____________}_________ (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "legacy",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "require-atomic-updates": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts

            async function foo() {
                if (1);
                if (2);
                if (3);
                if (4);
                if (5);
                if (6);
                if (7);
                if (8);
                if (9);
                if (10);
                if (11);
                if (12);
                if (13);
                if (14);
                if (15);
                if (16);
                if (17);
                if (18);
                if (19);
                if (20);
            }
        