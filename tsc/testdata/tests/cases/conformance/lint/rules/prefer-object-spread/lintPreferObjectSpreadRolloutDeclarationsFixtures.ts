// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsFixtures/prefer-object-spread (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "prefer-object-spread": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {};
const spread = Object.assign({}, source);
const literal = Object.assign({ value: 1 });
const merged = Object.assign({ first: 1 }, { second: 2, /* preserve */ }, source);
const getter = Object.assign({}, { get value() { return 1; } });
const prototype = Object.assign({}, { __proto__: source });
consume()
Object.assign({}, source);
function shadowed(Object: any) { return Object.assign({}, source); }