// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsFixtures/object-shorthand (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "object-shorthand": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {};
const value = 1;
const object = {
    value: value,
    'value': value,
    method: function() {},
    generator: function*() {},
    asynchronous: async function() {},
    retained: /* preserve */ function() {},
    __proto__: function() {},
    named: function named() {},
};