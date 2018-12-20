/// <reference path="fourslash.ts" />

////interface Foo {
////    a?: number;
////    b?: number;
////}
////
////function f<T extends Foo>(x: T) { }
////
////f({/*1*/});

verify.completions({
    marker: "1",
    exact: ["a", "b"]
});
