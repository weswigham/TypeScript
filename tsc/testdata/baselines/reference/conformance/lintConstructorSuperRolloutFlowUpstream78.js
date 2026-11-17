//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream78.ts] ////

//// [input.ts]
class C extends D {

                constructor() {
                    do {
                        something();
                    } while (foo);
                }

            }

//// [input.ts]
class C extends D {

                constructor() {
                    do {
                        something();
                    } while (foo);
                }

            }
