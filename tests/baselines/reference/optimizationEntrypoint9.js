//// [tests/cases/compiler/optimizationEntrypoint9.ts] ////

//// [a.ts]

/// <reference path="./b.ts" />
export class A {
	member: typeof GlobalFoo;
}

//// [b.ts]
/// <reference path="./c.d.ts" />
class Foo {
	member: Bar;
}
declare var GlobalFoo: Foo;

//// [c.d.ts]
/// <reference path="./d.d.ts" />
declare class Bar {
	member: Baz;
}

//// [d.d.ts]
declare class Baz {
	member: number;
}

//// [b.ts]
import {A} from "./ref/a";
export class B extends A { }


//// [a.js]
define(["require", "exports"], function (require, exports) {
    /// <reference path="./b.ts" />
    var A = (function () {
        function A() {
        }
        return A;
    })();
    exports.A = A;
});
//// [b.js]
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "./ref/a"], function (require, exports, a_1) {
    var B = (function (_super) {
        __extends(B, _super);
        function B() {
            _super.apply(this, arguments);
        }
        return B;
    })(a_1.A);
    exports.B = B;
});
//// [all.js]
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="./c.d.ts" />
var Foo = (function () {
    function Foo() {
    }
    return Foo;
})();
define("tests/cases/compiler/ref/a", ["require", "exports"], function (require, exports) {
    /// <reference path="./b.ts" />
    var A = (function () {
        function A() {
        }
        return A;
    })();
    exports.A = A;
});
define("tests/cases/compiler/b", ["require", "exports", "tests/cases/compiler/ref/a"], function (require, exports, a_1) {
    var B = (function (_super) {
        __extends(B, _super);
        function B() {
            _super.apply(this, arguments);
        }
        return B;
    })(a_1.A);
    exports.B = B;
});


//// [a.d.ts]
/// <reference path="../../../../all.d.ts" />
export declare class A {
    member: typeof GlobalFoo;
}
//// [b.d.ts]
import { A } from "./ref/a";
export declare class B extends A {
}
//// [all.d.ts]
/// <reference path="tests/cases/compiler/ref/c.d.ts" />
declare class A {
    member: typeof GlobalFoo;
}
declare class Foo {
    member: Bar;
}
export declare class B extends A {
}
export {
};


//// [DtsFileErrors]


all.d.ts(3,20): error TS2304: Cannot find name 'GlobalFoo'.
all.d.ts(8,32): error TS4020: Extends clause of exported class 'B' has or is using private name 'A'.
tests/cases/compiler/ref/a.d.ts(3,20): error TS2304: Cannot find name 'GlobalFoo'.
tests/cases/compiler/ref/a.d.ts(3,20): error TS4031: Public property 'member' of exported class has or is using private name 'GlobalFoo'.


==== tests/cases/compiler/ref/a.d.ts (2 errors) ====
    /// <reference path="../../../../all.d.ts" />
    export declare class A {
        member: typeof GlobalFoo;
                       ~~~~~~~~~
!!! error TS2304: Cannot find name 'GlobalFoo'.
                       ~~~~~~~~~
!!! error TS4031: Public property 'member' of exported class has or is using private name 'GlobalFoo'.
    }
    
==== all.d.ts (2 errors) ====
    /// <reference path="tests/cases/compiler/ref/c.d.ts" />
    declare class A {
        member: typeof GlobalFoo;
                       ~~~~~~~~~
!!! error TS2304: Cannot find name 'GlobalFoo'.
    }
    declare class Foo {
        member: Bar;
    }
    export declare class B extends A {
                                   ~
!!! error TS4020: Extends clause of exported class 'B' has or is using private name 'A'.
    }
    export {
    };
    
==== tests/cases/compiler/ref/c.d.ts (0 errors) ====
    /// <reference path="./d.d.ts" />
    declare class Bar {
    	member: Baz;
    }
    
==== tests/cases/compiler/ref/d.d.ts (0 errors) ====
    declare class Baz {
    	member: number;
    }
    
==== tests/cases/compiler/b.d.ts (0 errors) ====
    import { A } from "./ref/a";
    export declare class B extends A {
    }
    