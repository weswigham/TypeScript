//// [tests/cases/conformance/es6/modules/exportsAndImports1-es6.ts] ////

//// [t1.ts]
var v = 1;
function f() { }
class C {
}
interface I {
}
enum E {
    A, B, C
}
const enum D {
    A, B, C
}
module M {
    export var x;
}
module N {
    export interface I {
    }
}
type T = number;
import a = M.x;

export { v, f, C, I, E, D, M, N, T, a };

//// [t2.ts]
export { v, f, C, I, E, D, M, N, T, a } from "./t1";

//// [t3.ts]
import { v, f, C, I, E, D, M, N, T, a } from "./t1";
export { v, f, C, I, E, D, M, N, T, a };


//// [t1.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var v = 1;
exports.v = v;
function f() { }
exports.f = f;
class C {
}
exports.C = C;
var E;
(function (E) {
    E[E["A"] = 0] = "A";
    E[E["B"] = 1] = "B";
    E[E["C"] = 2] = "C";
})(E || (E = {}));
exports.E = E;
var M;
(function (M) {
})(M || (M = {}));
exports.M = M;
var a = M.x;
exports.a = a;
//// [t2.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var t1_1 = require("./t1");
Object.defineProperty(exports, "v", { enumerable: true, get: () => t1_1.v });
Object.defineProperty(exports, "f", { enumerable: true, get: () => t1_1.f });
Object.defineProperty(exports, "C", { enumerable: true, get: () => t1_1.C });
Object.defineProperty(exports, "E", { enumerable: true, get: () => t1_1.E });
Object.defineProperty(exports, "M", { enumerable: true, get: () => t1_1.M });
Object.defineProperty(exports, "a", { enumerable: true, get: () => t1_1.a });
//// [t3.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t1_1 = require("./t1");
Object.defineProperty(exports, "v", { enumerable: true, get: () => t1_1.v });
Object.defineProperty(exports, "f", { enumerable: true, get: () => t1_1.f });
Object.defineProperty(exports, "C", { enumerable: true, get: () => t1_1.C });
Object.defineProperty(exports, "E", { enumerable: true, get: () => t1_1.E });
Object.defineProperty(exports, "M", { enumerable: true, get: () => t1_1.M });
Object.defineProperty(exports, "a", { enumerable: true, get: () => t1_1.a });
