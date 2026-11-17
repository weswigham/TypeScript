//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream77.ts] ////

//// [input.ts]
class Foo extends Bar {
                constructor() {
                    for (a in b) for (c in d);
                }
            }

//// [input.ts]
class Foo extends Bar {
                constructor() {
                    for (a in b) for (c in d);
                }
            }
