// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/prototype_calls (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-prototype-builtins": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
object.hasOwnProperty('key'); object?.['isPrototypeOf'](value); object.propertyIsEnumerable?.('key'); Object.prototype.hasOwnProperty.call(object, 'key');