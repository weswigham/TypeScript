//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid40.ts] ////

//// [input.tsx]

class CustomWeakMap extends WeakMap<object, string> {}
declare const map: CustomWeakMap;
const o = { ...map };
      

//// [input.tsx]

class CustomWeakMap extends WeakMap<object, string> {}
declare const map: CustomWeakMap;
const o = { ...map };
      
