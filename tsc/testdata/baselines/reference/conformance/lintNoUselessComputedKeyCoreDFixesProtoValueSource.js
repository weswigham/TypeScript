//// [tests/cases/conformance/lint/rules/no-useless-computed-key/lintNoUselessComputedKeyCoreDFixesProtoValueSource.ts] ////

//// [input.tsx]
({ ['__proto__']: value } = source);

//// [input.tsx]
({ '__proto__': value } = source);
