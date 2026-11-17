//// [tests/cases/conformance/lint/rules/no-useless-computed-key/lintNoUselessComputedKeyCoreDFixesGet2ClassCStatic0.ts] ////

//// [input.tsx]
({ get[2]() {} }); class C { static[0]; }

//// [input.tsx]
({ get 2() {} }); class C { static 0; }
