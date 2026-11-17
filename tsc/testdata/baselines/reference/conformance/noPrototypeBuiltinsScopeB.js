//// [tests/cases/conformance/lint/rules/no-prototype-builtins/noPrototypeBuiltinsScopeB.ts] ////

//// [input.ts]
object.hasOwnProperty("key");
object?.["isPrototypeOf"](value);
object.propertyIsEnumerable?.("key");
Object.prototype.hasOwnProperty.call(object, "key");
object.hasOwnProperty;
object[dynamic]("key");

//// [input.ts]
object.hasOwnProperty("key");
object?.["isPrototypeOf"](value);
object.propertyIsEnumerable?.("key");
Object.prototype.hasOwnProperty.call(object, "key");
object.hasOwnProperty;
object[dynamic]("key");
