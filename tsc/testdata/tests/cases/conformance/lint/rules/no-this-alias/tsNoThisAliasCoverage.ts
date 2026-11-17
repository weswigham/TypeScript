// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-this-alias":["error",{"allowedNames":["self"],"allowDestructuring":false}]}},"files":["input.ts"]}
// @filename: input.ts
export {};
class Context {
    value = 1;
    capture() {
        const alias = this;
        const { value } = this;
        const self = this;
        const property = this.value;
        return [alias, value, self, property];
    }
}