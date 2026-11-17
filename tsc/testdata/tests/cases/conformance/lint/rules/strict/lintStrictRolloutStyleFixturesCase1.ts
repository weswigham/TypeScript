// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutStyleFixtures/strict (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {},
    "lint": {
        "rules": {
            "strict": [
                "error",
                "function"
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts

"use strict";
function absent() {}
function outer() {
    "use strict";
    function inner() {
        "use strict";
    }
}
function defaults(value = 0) {
    "use strict";
}
class Example {
    method() {
        "use strict";
    }
}