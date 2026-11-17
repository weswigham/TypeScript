// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/prefer-promise-reject-errors (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-promise-reject-errors": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
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