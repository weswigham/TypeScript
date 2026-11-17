//// [tests/cases/conformance/lint/rules/no-useless-return/rolloutNoUselessReturnFlow.ts] ////

//// [input.ts]
declare const ready: boolean, value: number;
function trailing() { console.log(ready); return; }
function branch() { if (ready) { return; } }
function important() { if (ready) return; console.log(ready); }
function loop() { while (ready) { return; } }
function finalizer() { try { return; } finally { console.log(ready); } }
function finalizerReturn() { try { console.log(ready); } finally { return; } }
function switchBreak() { switch (value) { case 0: return; break; default: console.log(value); } }
function switchFallthrough() { switch (value) { case 0: return; default: console.log(value); } }
function comment() { return /* keep */; }
function unreachable() { throw Error(); return; }

//// [input.ts]
declare const ready: boolean, value: number;
function trailing() { console.log(ready);  }
function branch() { if (ready) {  } }
function important() { if (ready) return; console.log(ready); }
function loop() { while (ready) { return; } }
function finalizer() { try {  } finally { console.log(ready); } }
function finalizerReturn() { try { console.log(ready); } finally { return; } }
function switchBreak() { switch (value) { case 0:  break; default: console.log(value); } }
function switchFallthrough() { switch (value) { case 0: return; default: console.log(value); } }
function comment() { return /* keep */; }
function unreachable() { throw Error(); return; }
