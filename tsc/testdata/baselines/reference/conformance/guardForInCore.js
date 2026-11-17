//// [tests/cases/conformance/lint/rules/guard-for-in/guardForInCore.ts] ////

//// [input.ts]
for (const key in object) work(key);
for (const key in object) { work(key); }
for (const key in object) { if (own(key)) work(key); }
for (const key in object) { if (!own(key)) continue; work(key); }
for (const key in object) {}

//// [input.ts]
for (const key in object) work(key);
for (const key in object) { work(key); }
for (const key in object) { if (own(key)) work(key); }
for (const key in object) { if (!own(key)) continue; work(key); }
for (const key in object) {}
