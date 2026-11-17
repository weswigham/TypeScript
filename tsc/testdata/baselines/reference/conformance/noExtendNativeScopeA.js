//// [tests/cases/conformance/lint/rules/no-extend-native/noExtendNativeScopeA.ts] ////

//// [input.ts]
Object.prototype.method = value;
Object.defineProperty(String.prototype, "method", { value });
Object?.defineProperties(Number?.prototype, {});
Array.prototype.method = value;
delete Object.prototype.method;
function shadow(Object: any) { Object.prototype.method = value; }

//// [input.ts]
Object.prototype.method = value;
Object.defineProperty(String.prototype, "method", { value });
Object?.defineProperties(Number?.prototype, {});
Array.prototype.method = value;
delete Object.prototype.method;
function shadow(Object: any) { Object.prototype.method = value; }
