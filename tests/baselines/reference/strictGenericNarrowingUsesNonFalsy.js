//// [strictGenericNarrowingUsesNonFalsy.ts]
function f<T extends { x?: number }>(o: Readonly<T>) {
    if (o.x) {
        o.x.toExponential(); // Hover over 'x' shows number
        const n: number = o.x; // Error. Hover over 'x' shows `T["x"]`
        let x: 0 = 0;
        x = o.x;
    }
}

//// [strictGenericNarrowingUsesNonFalsy.js]
"use strict";
function f(o) {
    if (o.x) {
        o.x.toExponential(); // Hover over 'x' shows number
        var n = o.x; // Error. Hover over 'x' shows `T["x"]`
        var x = 0;
        x = o.x;
    }
}
