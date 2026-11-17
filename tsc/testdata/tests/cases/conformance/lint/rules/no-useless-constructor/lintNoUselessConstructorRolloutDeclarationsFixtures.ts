// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsFixtures/no-useless-constructor (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-constructor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export {};
class Empty { constructor() {} }
class Derived extends Base { constructor(value: number) { super(value); } }
class ParameterProperty { constructor(public value: number) {} }
class Restricted { private constructor() {} }
class PublicDerived extends Base { public constructor() { super(); } }
class Separator {
    value = 1
    constructor() {}
    [computed]() {}
}