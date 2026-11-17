//// [tests/cases/conformance/lint/rules/guard-for-in/lintGuardForInCoreSyntaxAForInGuards.ts] ////

//// [input.ts]
for (const key in object) work(key); for (const key in object) { if (!own(key)) continue; work(key); }

//// [input.ts]
for (const key in object) work(key); for (const key in object) { if (!own(key)) continue; work(key); }
