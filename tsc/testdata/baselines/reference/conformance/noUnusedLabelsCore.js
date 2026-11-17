//// [tests/cases/conformance/lint/rules/no-unused-labels/noUnusedLabelsCore.ts] ////

//// [input.ts]
unused: { work(); }
used: { break used; }
unused: /* keep */ work();
unused: ("potential directive");
work()
unused: [1].forEach(work);
work();
unused: [1].forEach(work);

//// [input.ts]
{ work(); }
used: { break used; }
unused: /* keep */ work();
unused: ("potential directive");
work()
unused: [1].forEach(work);
work();
[1].forEach(work);
