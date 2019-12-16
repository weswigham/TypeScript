//// [tests/cases/conformance/jsdoc/declarations/jsDeclarationsExportForms.ts] ////

//// [cls.js]
export class Foo {}

//// [func.js]
export function func() {}

//// [bar.js]
export * from "./cls";

//// [bar2.js]
export * from "./func";
export * from "./cls";

//// [baz.js]
import {Foo} from "./cls";
export {Foo};

//// [bat.js]
import * as ns from "./cls";
export default ns;

//// [ban.js]
import * as ns from "./cls";
export {ns};

//// [bol.js]
import * as ns from "./cls";
export { ns as classContainer };

//// [cjs.js]
const ns = require("./cls");
module.exports = { ns };

//// [cjs2.js]
const ns = require("./cls");
module.exports = ns;

//// [cjs3.js]
const ns = require("./cls");
module.exports.ns = ns;

//// [cjs4.js]
const ns = require("./cls");
module.exports.names = ns;

//// [includeAll.js]
import "./cjs4";
import "./cjs3";
import "./cjs2";
import "./cjs";
import "./bol";
import "./ban";
import "./bat";
import "./baz";
import "./bar";
import "./bar2";


//// [cls.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Foo = /** @class */ (function () {
    function Foo() {
    }
    return Foo;
}());
exports.Foo = Foo;
//// [func.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function func() { }
exports.func = func;
//// [bar.js]
"use strict";
function __export(m) {
    for (var p in m) b(p);
    function b(p) {
        if (!exports.hasOwnProperty(p)) Object.defineProperty(exports, p, {
            enumerable: true,
            get: function () {
                return m[p];
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./cls"));
//// [bar2.js]
"use strict";
function __export(m) {
    for (var p in m) b(p);
    function b(p) {
        if (!exports.hasOwnProperty(p)) Object.defineProperty(exports, p, {
            enumerable: true,
            get: function () {
                return m[p];
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./func"));
__export(require("./cls"));
//// [baz.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cls_1 = require("./cls");
Object.defineProperty(exports, "Foo", { enumerable: true, get: () => cls_1.Foo });
//// [bat.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ns = require("./cls");
exports.default = ns;
//// [ban.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ns = require("./cls");
exports.ns = ns;
//// [bol.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ns = require("./cls");
exports.classContainer = ns;
//// [cjs.js]
var ns = require("./cls");
module.exports = { ns: ns };
//// [cjs2.js]
var ns = require("./cls");
module.exports = ns;
//// [cjs3.js]
var ns = require("./cls");
module.exports.ns = ns;
//// [cjs4.js]
var ns = require("./cls");
module.exports.names = ns;
//// [includeAll.js]
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./cjs4");
require("./cjs3");
require("./cjs2");
require("./cjs");
require("./bol");
require("./ban");
require("./bat");
require("./baz");
require("./bar");
require("./bar2");


//// [cls.d.ts]
export class Foo {
}
//// [func.d.ts]
export function func(): void;
//// [bar.d.ts]
export * from "./cls";
//// [bar2.d.ts]
export * from "./func";
export * from "./cls";
//// [baz.d.ts]
export { Foo };
import { Foo } from "./cls";
//// [bat.d.ts]
export default ns;
import * as ns from "./cls";
//// [ban.d.ts]
export { ns };
import * as ns from "./cls";
//// [bol.d.ts]
export { ns as classContainer };
import * as ns from "./cls";
//// [cjs.d.ts]
export const ns: typeof import("./cls");
//// [cjs2.d.ts]
export = ns;
declare const ns: typeof import("./cls");
//// [cjs3.d.ts]
export var ns: typeof import("./cls");
//// [cjs4.d.ts]
export var names: typeof import("./cls");
//// [includeAll.d.ts]
export {};
