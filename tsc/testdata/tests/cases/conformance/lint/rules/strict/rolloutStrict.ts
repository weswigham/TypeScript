// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "strict": ["warn", "function"] } }
}
// @filename: input.ts

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