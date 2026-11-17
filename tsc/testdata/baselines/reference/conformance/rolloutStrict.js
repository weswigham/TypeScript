//// [tests/cases/conformance/lint/rules/strict/rolloutStrict.ts] ////

//// [input.ts]
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

//// [input.ts]
"use strict";
function absent() {}
function outer() {
    "use strict";
    function inner() {
        
    }
}
function defaults(value = 0) {
    "use strict";
}
class Example {
    method() {
        
    }
}
