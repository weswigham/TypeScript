//// [tests/cases/conformance/lint/rules/no-caller/noCallerMembers.ts] ////

//// [input.ts]
function inspect() {
    arguments.callee;
    arguments.caller;
    arguments?.callee;
    (arguments).caller;
    arguments["callee"];
    arguments[`caller`];
    arguments[caller];
    arguments.length;
    arguments[0];
    other.caller;
}
function syntactic(arguments) {
    arguments.callee;
}

//// [input.ts]
function inspect() {
    arguments.callee;
    arguments.caller;
    arguments?.callee;
    (arguments).caller;
    arguments["callee"];
    arguments[`caller`];
    arguments[caller];
    arguments.length;
    arguments[0];
    other.caller;
}
function syntactic(arguments) {
    arguments.callee;
}
