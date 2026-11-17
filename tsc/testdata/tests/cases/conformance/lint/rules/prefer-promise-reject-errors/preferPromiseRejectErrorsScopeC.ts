// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "prefer-promise-reject-errors": "error" } }
}
// @filename: input.ts
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