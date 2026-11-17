//// [tests/cases/conformance/lint/rules/no-async-promise-executor/noAsyncPromiseExecutorDefault.ts] ////

//// [input.ts]
new Promise(async function executor(resolve, reject) {});
new Promise(async (resolve, reject) => {});
new Promise(((((async () => {})))));
new (Promise)(async () => {});
new Promise(/* before */ async /* after */ () => {});
new Promise((resolve, reject) => {});
new Promise(() => {}, async function unrelated() {});
declare const Other: any;
new Other(async () => {});
new globalThis.Promise(async () => {});
const executor = async () => {};
new Promise(executor);
function shadowed(Promise: any) { new Promise(async () => {}); }
function hoisted() {
    new Promise(async () => {});
    var Promise: any;
}
{
    let Promise: any;
    new Promise(async () => {});
}

//// [input.ts]
new Promise(async function executor(resolve, reject) {});
new Promise(async (resolve, reject) => {});
new Promise(((((async () => {})))));
new (Promise)(async () => {});
new Promise(/* before */ async /* after */ () => {});
new Promise((resolve, reject) => {});
new Promise(() => {}, async function unrelated() {});
declare const Other: any;
new Other(async () => {});
new globalThis.Promise(async () => {});
const executor = async () => {};
new Promise(executor);
function shadowed(Promise: any) { new Promise(async () => {}); }
function hoisted() {
    new Promise(async () => {});
    var Promise: any;
}
{
    let Promise: any;
    new Promise(async () => {});
}
