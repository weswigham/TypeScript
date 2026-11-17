//// [tests/cases/conformance/lint/rules/no-iterator/noIteratorCoreB.ts] ////

//// [input.ts]
value.__iterator__;
value['__iterator__'];
value[`__iterator__`];
value?.__iterator__;
value[iterator];
({ __iterator__: value });

//// [input.ts]
value.__iterator__;
value['__iterator__'];
value[`__iterator__`];
value?.__iterator__;
value[iterator];
({ __iterator__: value });
