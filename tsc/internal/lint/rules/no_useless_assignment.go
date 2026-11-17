package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUselessAssignment struct{ helpers.UsageRuleContext }

func (rule *noUselessAssignment) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return false
	}
	rule.Model.Build(rule.Context)
	for _, graph := range rule.Model.Graphs {
		rule.uselessAssignments(graph)
	}
	return false
}
func (rule *noUselessAssignment) OnExitNode(node *ast.Node) {}

func (rule *noUselessAssignment) uselessAssignments(graph *helpers.UsageGraph) {
	live := make(map[*helpers.UsageEvent]map[*helpers.UsageBinding]bool)
	for _, event := range graph.Events {
		live[event] = make(map[*helpers.UsageBinding]bool)
	}
	changed := true
	for changed {
		changed = false
		for _, event := range graph.Events {
			if !event.Reachable {
				continue
			}
			before := make(map[*helpers.UsageBinding]bool)
			for _, next := range event.Next {
				for binding := range live[next] {
					before[binding] = true
				}
			}
			if event.Write {
				delete(before, event.Binding)
			}
			if event.Read && event.Binding != nil {
				before[event.Binding] = true
			}
			if len(before) != len(live[event]) {
				changed = true
			} else {
				for binding := range before {
					if !live[event][binding] {
						changed = true
						break
					}
				}
			}
			live[event] = before
		}
	}
	// Finally creates continuation-specific events for the same source write.
	needed := make(map[*ast.Node]bool)
	for _, event := range graph.Events {
		if event.Reachable && event.Write {
			for _, next := range event.Next {
				if live[next][event.Binding] {
					needed[event.Node] = true
				}
			}
		}
	}
	reported := make(map[*ast.Node]bool)
	for _, event := range graph.Events {
		binding := event.Binding
		if !event.Reachable || !event.Write || event.Assignment == nil || event.Protected || binding == nil || binding.Owner != graph.Owner || binding.Exported || needed[event.Node] || reported[event.Node] {
			continue
		}
		used, escaped := false, false
		for _, reference := range binding.References {
			if reference.Read {
				used = true
				escaped = escaped || reference.Owner != graph.Owner
			}
		}
		if !used || escaped {
			continue
		}
		if used {
			reported[event.Node] = true
			rule.Context.Report(rule.Context.Range(event.Node), diagnostics.The_value_assigned_to_0_is_not_used_in_subsequent_statements, binding.Name)
		}
	}
}

func newNoUselessAssignment(context Context) Rule {
	return &noUselessAssignment{Context: context}
}
