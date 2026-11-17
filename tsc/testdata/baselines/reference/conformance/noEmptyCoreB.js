//// [tests/cases/conformance/lint/rules/no-empty/noEmptyCoreB.ts] ////

//// [input.ts]
if (value) {}
switch (value) {}
try {} catch {}
while (ready) { /* intentional */ }
function allowed() {}
class Item { static {} }

//// [input.ts]
if (value) {}
switch (value) {}
try {} catch {}
while (ready) { /* intentional */ }
function allowed() {}
class Item { static {} }
