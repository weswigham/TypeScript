package rules

import (
	"maps"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type requireAtomicUpdates struct{ helpers.UsageRuleContext }

func newRequireAtomicUpdates(context Context) Rule {
	rule := &requireAtomicUpdates{Context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *requireAtomicUpdates) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return false
	}
	rule.Model.Build(rule.Context)
	for _, graph := range rule.Model.Graphs {
		rule.atomicUpdates(graph)
	}
	return false
}

func (rule *requireAtomicUpdates) atomicUpdates(graph *helpers.UsageGraph) {
	if ast.GetFunctionFlags(graph.Owner)&(ast.FunctionFlagsAsync|ast.FunctionFlagsGenerator) == 0 {
		return
	}
	states := make(map[*helpers.UsageEvent]map[*helpers.UsageBinding]uint8)
	states[graph.Entry] = make(map[*helpers.UsageBinding]uint8)
	queue := []*helpers.UsageEvent{graph.Entry}
	queued := map[*helpers.UsageEvent]bool{graph.Entry: true}
	for len(queue) > 0 {
		event := queue[0]
		queue = queue[1:]
		queued[event] = false
		after := make(map[*helpers.UsageBinding]uint8)
		maps.Copy(after, states[event])
		if event.Read && !event.AtomicSkipRead && event.Binding != nil {
			after[event.Binding] = 1
		}
		if event.Suspend {
			for binding := range after {
				after[binding] = 2
			}
		}
		for _, next := range event.Next {
			incoming, visited := states[next]
			if !visited {
				incoming = make(map[*helpers.UsageBinding]uint8)
				states[next] = incoming
			}
			changed := !visited
			for binding, state := range after {
				if incoming[binding]|state != incoming[binding] {
					incoming[binding] |= state
					changed = true
				}
			}
			if changed && !queued[next] {
				queue = append(queue, next)
				queued[next] = true
			}
		}
	}
	reported := make(map[*ast.Node]bool)
	for _, event := range graph.Events {
		for _, target := range event.Targets {
			base := helpers.UsageBase(target)
			binding := rule.Model.Binding(base)
			if binding == nil || states[event][binding]&2 == 0 || reported[event.Node] {
				continue
			}
			member := target != base
			if rule.Boolean("allowProperties") && member {
				continue
			}
			escaped := binding.Owner != graph.Owner || member && binding.Parameter
			for _, reference := range binding.References {
				escaped = escaped || reference.Owner != binding.Owner
			}
			if !escaped {
				continue
			}
			reported[event.Node] = true
			if member {
				rule.Context.Report(rule.Context.Range(event.Node), diagnostics.Possible_race_condition_Colon_0_might_be_assigned_based_on_an_outdated_state_of_1, rule.Text(target), binding.Name)
			} else {
				rule.Context.Report(rule.Context.Range(event.Node), diagnostics.Possible_race_condition_Colon_0_might_be_reassigned_based_on_an_outdated_value_of_0, binding.Name)
			}
		}
	}
}
