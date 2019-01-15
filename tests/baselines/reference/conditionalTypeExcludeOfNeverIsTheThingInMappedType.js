//// [conditionalTypeExcludeOfNeverIsTheThingInMappedType.ts]
function f1<T>(x: Extract<T, T>) {
    const y: T = x; // works
    x = y; // should likewise work
}

const fn2 = <Params>(
    params: Pick<Params, Extract<keyof Params, keyof Params>>,
): Params => params; // should also work

// And the opposite:

function f3<T>(x: Exclude<T, never>) {
    const y: T = x; // works
    x = y; // should likewise work
}

const fn4 = <Params>(
    params: Pick<Params, Exclude<keyof Params, never>>,
): Params => params; // should also work


//// [conditionalTypeExcludeOfNeverIsTheThingInMappedType.js]
"use strict";
function f1(x) {
    var y = x; // works
    x = y; // should likewise work
}
var fn2 = function (params) { return params; }; // should also work
// And the opposite:
function f3(x) {
    var y = x; // works
    x = y; // should likewise work
}
var fn4 = function (params) { return params; }; // should also work
