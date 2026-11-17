// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutScopeBehavior/no-eval/const_object_=_{_method()_{_this.eval('code');_}_};_class_C_{_field_=_this.eval('code');_static_{_this.eval('code');_}_} (invocation 1).
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
            "no-eval": "error"
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
const object = { method() { this.eval('code'); } }; class C { field = this.eval('code'); static { this.eval('code'); } }