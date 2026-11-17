//// [tests/cases/conformance/lint/rules/consistent-this/consistentThisScopeA.ts] ////

//// [input.ts]
var self;
self = this;
var vm = this;
var context = this;
function nested() {
    var self;
    (() => { self = this; })();
}
function assigned() {
    let vm;
    vm = this;
}
vm += this;

//// [input.ts]
var self;
self = this;
var vm = this;
var context = this;
function nested() {
    var self;
    (() => { self = this; })();
}
function assigned() {
    let vm;
    vm = this;
}
vm += this;
