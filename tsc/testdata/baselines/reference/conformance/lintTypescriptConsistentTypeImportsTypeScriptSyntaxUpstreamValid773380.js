//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773380.ts] ////

//// [input.tsx]

import { h } from 'some-other-jsx-lib';

export const ComponentFoo: h.FC = () => {
  return <div>Foo Foo</div>;
};
          

//// [input.tsx]

import { h } from 'some-other-jsx-lib';

export const ComponentFoo: h.FC = () => {
  return <div>Foo Foo</div>;
};
          
