//// [tests/cases/conformance/lint/rules/getter-return/rolloutGetterReturnFlow.ts] ////

//// [input.ts]
declare const ready: boolean, object: object;
class Item {
    get missing() {}
    get partial() { if (ready) return 1; }
    get implicit() { return; }
    get complete() { try { return 1; } finally { console.log(ready); } }
    get thrown() { throw Error(); }
}
Object.defineProperty(object, "value", { get: function() {} });
Reflect.defineProperty(object, "other", { get: () => { if (ready) return 1; } });
Object.create(null, { value: { get() {} } });
Object.defineProperties(object, { value: { get() { return 1; } } });

//// [input.ts]
declare const ready: boolean, object: object;
class Item {
    get missing() {}
    get partial() { if (ready) return 1; }
    get implicit() { return; }
    get complete() { try { return 1; } finally { console.log(ready); } }
    get thrown() { throw Error(); }
}
Object.defineProperty(object, "value", { get: function() {} });
Reflect.defineProperty(object, "other", { get: () => { if (ready) return 1; } });
Object.create(null, { value: { get() {} } });
Object.defineProperties(object, { value: { get() { return 1; } } });
