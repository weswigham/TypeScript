// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-prototype-builtins":"error"}},"files":["input.ts"]}
// @filename: input.ts
object.hasOwnProperty("key");
object?.["isPrototypeOf"](value);
object.propertyIsEnumerable?.("key");
Object.prototype.hasOwnProperty.call(object, "key");
object.hasOwnProperty;
object[dynamic]("key");