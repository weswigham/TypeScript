//// [tests/cases/conformance/lint/rules/init-declarations/lintInitDeclarationsCoreSyntaxAOptionsForLetKeyInObjectForLetIndexBreakDeclareNamespaceAmbientLetValue.ts] ////

//// [input.ts]
for (let key in object) {} for (let index;;) break; declare namespace Ambient { let value; }

//// [input.ts]
for (let key in object) {} for (let index;;) break; declare namespace Ambient { let value; }
