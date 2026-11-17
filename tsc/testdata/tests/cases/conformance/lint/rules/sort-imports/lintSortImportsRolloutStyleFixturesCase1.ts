// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/sort-imports (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "sort-imports": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

import { zeta, beta as alpha, gamma } from "one";
import named from "two";
import * as namespace from "three";
import "four";