//// [tests/cases/conformance/lint/rules/no-extend-native/lintNoExtendNativeCoreScopeABlockAndNativeObjectDefinePropertyArrayPrototypeKeyObjectDefinePropertiesStringProt.ts] ////

//// [input.ts]
Object.defineProperty(Array.prototype, 'key', {}); Object?.defineProperties(String?.prototype, {});

//// [input.ts]
Object.defineProperty(Array.prototype, 'key', {}); Object?.defineProperties(String?.prototype, {});
