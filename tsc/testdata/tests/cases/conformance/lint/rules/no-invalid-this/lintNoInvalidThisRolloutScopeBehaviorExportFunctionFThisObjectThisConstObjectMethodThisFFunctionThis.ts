// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutScopeBehavior/no-invalid-this/export_{};_function_f(this:_object)_{_this;_}_const_object_=_{_method()_{_this;_},_f:_function()_{_this;_}_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "alwaysStrict": false,
        "module": "esnext",
        "moduleDetection": "legacy",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-invalid-this": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts
interface Object {}
interface Function {}
interface Array<T> {}
declare var execScript: any;

// @filename: /input.ts
export {}; function f(this: object) { this; } const object = { method() { this; }, f: function() { this; } };