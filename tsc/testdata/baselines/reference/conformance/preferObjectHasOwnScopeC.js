//// [tests/cases/conformance/lint/rules/prefer-object-has-own/preferObjectHasOwnScopeC.ts] ////

//// [input.ts]
Object.prototype.hasOwnProperty.call(object, key);
({}).hasOwnProperty.call(object, key);
(Object.hasOwnProperty.call)(object, key);
Object./* keep */prototype.hasOwnProperty.call(object, key);
function shadowed(Object: any) {
    ({}).hasOwnProperty.call(object, key);
}

//// [input.ts]
Object.hasOwn(object, key);
Object.hasOwn(object, key);
(Object.hasOwn)(object, key);
Object./* keep */prototype.hasOwnProperty.call(object, key);
function shadowed(Object: any) {
    ({}).hasOwnProperty.call(object, key);
}
