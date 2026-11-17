//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintPreferPromiseRejectErrorsCoreScopeCFixtures.ts] ////

//// [input.ts]
Promise.reject();
Promise.reject("reason");
Promise.reject(undefined);
Promise.reject(new Error("reason"));
new Promise((resolve, reject) => {
    reject(0);
    (() => reject(false))();
    function shadowed(reject: (value: string) => void) {
        reject("not a Promise rejection");
    }
});
function shadowed(Promise: any) {
    Promise.reject("not a Promise rejection");
}

//// [input.ts]
Promise.reject();
Promise.reject("reason");
Promise.reject(undefined);
Promise.reject(new Error("reason"));
new Promise((resolve, reject) => {
    reject(0);
    (() => reject(false))();
    function shadowed(reject: (value: string) => void) {
        reject("not a Promise rejection");
    }
});
function shadowed(Promise: any) {
    Promise.reject("not a Promise rejection");
}
