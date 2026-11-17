//// [tests/cases/conformance/lint/rules/no-prototype-builtins/lintNoPrototypeBuiltinsCoreScopeBPrototypeCalls.ts] ////

//// [input.ts]
object.hasOwnProperty('key'); object?.['isPrototypeOf'](value); object.propertyIsEnumerable?.('key'); Object.prototype.hasOwnProperty.call(object, 'key');

//// [input.ts]
object.hasOwnProperty('key'); object?.['isPrototypeOf'](value); object.propertyIsEnumerable?.('key'); Object.prototype.hasOwnProperty.call(object, 'key');
