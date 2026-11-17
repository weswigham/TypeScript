//// [tests/cases/conformance/lint/rules/complexity/complexityScopeA.ts] ////

//// [input.ts]
function defaults(first = 0) { const { second = 0 } = value; }
function optional(value: any) { value?.method?.(); }
function classic(value: any) {
    switch (value) { case 1: break; case 2: break; default: break; }
}
class Example {
    field = first || second || third;
    arrow = () => first || second || third;
    static { first || second || third; }
}

//// [input.ts]
function defaults(first = 0) { const { second = 0 } = value; }
function optional(value: any) { value?.method?.(); }
function classic(value: any) {
    switch (value) { case 1: break; case 2: break; default: break; }
}
class Example {
    field = first || second || third;
    arrow = () => first || second || third;
    static { first || second || third; }
}
