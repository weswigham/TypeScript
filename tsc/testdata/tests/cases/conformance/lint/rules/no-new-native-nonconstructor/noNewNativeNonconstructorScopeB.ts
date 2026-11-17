// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-new-native-nonconstructor":"error"}},"files":["input.ts"]}
// @filename: input.ts
new Symbol("key");
new BigInt(1);
Symbol("key");
BigInt(1);
new object.Symbol();
function shadow(Symbol, BigInt) {
    new Symbol();
    new BigInt(1);
}