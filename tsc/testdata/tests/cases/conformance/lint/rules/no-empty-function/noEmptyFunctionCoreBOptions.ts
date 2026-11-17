// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-empty-function":["error",{"allow":["functions","privateConstructors","overrideMethods","decoratedFunctions"]}]}},"files":["input.ts"]}
// @filename: input.ts
function allowed() {}
const arrow = () => {};
class Base { method() {} }
class Item extends Base {
    private constructor() { super(); }
    override method() {}
    @decorate methodWithDecorator() {}
}