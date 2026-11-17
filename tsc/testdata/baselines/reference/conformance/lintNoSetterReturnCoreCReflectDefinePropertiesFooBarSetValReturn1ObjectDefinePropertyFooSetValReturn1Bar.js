//// [tests/cases/conformance/lint/rules/no-setter-return/lintNoSetterReturnCoreCReflectDefinePropertiesFooBarSetValReturn1ObjectDefinePropertyFooSetValReturn1Bar.ts] ////

//// [input.ts]
Reflect.defineProperties(foo, {bar: {set(val) {return 1;}}}); Object.defineProperty(foo, {set(val) {return 1;}}, 'bar');

//// [input.ts]
Reflect.defineProperties(foo, {bar: {set(val) {return 1;}}}); Object.defineProperty(foo, {set(val) {return 1;}}, 'bar');
