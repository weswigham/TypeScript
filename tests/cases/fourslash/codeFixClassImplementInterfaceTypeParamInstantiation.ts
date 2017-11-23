/// <reference path='fourslash.ts' />

//// interface I<T> {
////    x: T;
//// }
////
//// class C implements I { } 

/**
 * The code fix is available despite the error in the the class extends clause file,
 *  since I is instantiated as I<{}> (in TS) or I<any> (in JS)
 */
verify.codeFixAvailable();