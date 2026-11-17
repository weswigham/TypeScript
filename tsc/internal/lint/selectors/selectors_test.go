package selectors

import "testing"

func TestSelectors(t *testing.T) {
	t.Parallel()
	root := &Node{Type: "Program"}
	call := &Node{Type: "CallExpression", Parent: root, Field: "body", Index: 0, List: true, Attributes: map[string]any{"arguments.length": float64(0)}}
	callee := &Node{Type: "Identifier", Parent: call, Field: "callee", Attributes: map[string]any{"name": "eval"}}
	call.Children = []*Node{callee}
	root.Children = []*Node{call}
	call.Attributes["callee.name"] = "eval"
	for _, text := range []string{"CallExpression[callee.name='eval']", "Program > CallExpression", "Program CallExpression", "CallExpression:has(Identifier[name=/^eval$/])", "CallExpression:not([arguments.length>0])", "CallExpression:matches(CallExpression, NewExpression)", "CallExpression:is(CallExpression, NewExpression)", "CallExpression:first-child", "CallExpression:nth-child(1)", "CallExpression[callee.name=type(string)]"} {
		selector, err := Parse(text)
		if err != nil {
			t.Errorf("%s: %v", text, err)
			continue
		}
		if !selector.Match(call) {
			t.Errorf("%s did not match", text)
		}
	}
	for _, text := range []string{"CallExpression[", "Identifier:unknown", "CallExpression >", "[name=/(/]"} {
		if _, err := Parse(text); err == nil {
			t.Errorf("accepted invalid selector %q", text)
		}
	}
}
