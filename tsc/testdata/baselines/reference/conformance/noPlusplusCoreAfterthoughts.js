//// [tests/cases/conformance/lint/rules/no-plusplus/noPlusplusCoreAfterthoughts.ts] ////

//// [input.ts]
i++;
--j;
for (;; i++, (++j, k--)) {}
for (i++;;) {}
for (;--i;) {}
for (;; i = j++) {}
for (;; i++, f(--j)) {}
for (;; foo + (i++, bar)) {}

//// [input.ts]
i++;
--j;
for (;; i++, (++j, k--)) {}
for (i++;;) {}
for (;--i;) {}
for (;; i = j++) {}
for (;; i++, f(--j)) {}
for (;; foo + (i++, bar)) {}
