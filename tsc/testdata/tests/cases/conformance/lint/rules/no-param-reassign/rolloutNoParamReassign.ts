// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-param-reassign":["error",{"props":true,"ignorePropertyModificationsFor":["ignored"],"ignorePropertyModificationsForRegex":["^allowed"]}]}},"files":["input.ts"]}
// @filename: input.ts
function task(value, { nested }, ignored, allowedValue) {
    value = 1;
    value.property++;
    delete value.property;
    ({ key: nested = 0 } = source);
    for (value.property of values) {}
    cache[value.property] = 1;
    ignored.property = 1;
    allowedValue.property = 1;
    function closure() { nested++; }
    { let value; value = 1; }
}