//// [tests/cases/conformance/lint/rules/no-setter-return/noSetterReturnCoreDescriptors.ts] ////

//// [input.ts]
const object = { set value(val) { return val; return undefined; } };
class Example { set value(val) { if (val) { return 1; } return; } }
Object.defineProperty(object, 'foo', { set(val) { return val; } });
Reflect.defineProperty(object, 'foo', { set: val => val });
Object.defineProperties(object, { foo: { ['set'](val) { return null; } } });
Object.create(null, { foo: { set: function(val) { return undefined; } } });
Object?.defineProperty(object, 'foo', { set: val => val });
function shadowed(Object) { Object.defineProperty(object, 'foo', { set(val) { return 1; } }); }
const allowed = { set value(val) { function nested() { return 1; } return; } };

//// [input.ts]
const object = { set value(val) { return val; return undefined; } };
class Example { set value(val) { if (val) { return 1; } return; } }
Object.defineProperty(object, 'foo', { set(val) { return val; } });
Reflect.defineProperty(object, 'foo', { set: val => val });
Object.defineProperties(object, { foo: { ['set'](val) { return null; } } });
Object.create(null, { foo: { set: function(val) { return undefined; } } });
Object?.defineProperty(object, 'foo', { set: val => val });
function shadowed(Object) { Object.defineProperty(object, 'foo', { set(val) { return 1; } }); }
const allowed = { set value(val) { function nested() { return 1; } return; } };
