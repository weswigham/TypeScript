//// [tests/cases/conformance/lint/rules/no-ex-assign/noExAssignScopeA.ts] ////

//// [input.ts]
try {} catch (error) {
    error = 1;
    [error] = values;
    error.message = "allowed";
    function shadow(error: number) { error = 1; }
}
try {} catch ({ message }) {
    ({ key: message = 0 } = value);
}

//// [input.ts]
try {} catch (error) {
    error = 1;
    [error] = values;
    error.message = "allowed";
    function shadow(error: number) { error = 1; }
}
try {} catch ({ message }) {
    ({ key: message = 0 } = value);
}
