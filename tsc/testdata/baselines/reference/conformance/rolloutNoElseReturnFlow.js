//// [tests/cases/conformance/lint/rules/no-else-return/rolloutNoElseReturnFlow.ts] ////

//// [input.ts]
declare const ready: boolean, other: boolean;
function simple() { if (ready) { return 1; } else { console.log(ready); } }
function chain() { if (ready) return 1; else if (other) return 2; else { return 3; } }
function collision(value: number) { if (ready) return value; else { let value = 2; console.log(value); } }
function through() { console.log(value); if (ready) return 1; else { let value = 2; } }
function singleStatement() { while (ready) if (other) return 1; else console.log(ready); }
function thrown() { if (ready) throw Error(); else console.log(ready); }

//// [input.ts]
declare const ready: boolean, other: boolean;
function simple() { if (ready) { return 1; }  console.log(ready);  }
function chain() { if (ready) return 1; else if (other) return 2;  return 3;  }
function collision(value: number) { if (ready) return value; else { let value = 2; console.log(value); } }
function through() { console.log(value); if (ready) return 1; else { let value = 2; } }
function singleStatement() { while (ready) if (other) return 1; else console.log(ready); }
function thrown() { if (ready) throw Error(); else console.log(ready); }
