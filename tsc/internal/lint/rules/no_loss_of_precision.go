package rules

import (
	"math"
	"math/big"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noLossOfPrecision struct {
	context Context
}

func newNoLossOfPrecision(context Context) Rule {
	rule := &noLossOfPrecision{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindNumericLiteral},
	}
}

func (rule *noLossOfPrecision) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindNumericLiteral && losesNumericPrecision(helpers.SourceNodeText(rule.context, node)) {
		rule.context.Report(rule.context.Range(node), diagnostics.This_number_literal_will_lose_precision_at_runtime)
	}

	return true
}

type precisionScientific struct {
	coefficient string
	magnitude   int
}

func normalizePrecisionDecimal(text string, asFloat bool) precisionScientific {
	coefficient, exponentText, _ := strings.Cut(strings.ToLower(text), "e")
	exponent, err := strconv.Atoi(exponentText)
	if err != nil && exponentText != "" {
		if strings.HasPrefix(exponentText, "-") {
			exponent = math.MinInt / 2
		} else {
			exponent = math.MaxInt / 2
		}
	}
	integer, fraction, decimal := strings.Cut(coefficient, ".")
	digits := integer + fraction
	trimmed := strings.TrimLeft(digits, "0")
	if trimmed == "" {
		return precisionScientific{coefficient: "0"}
	}
	magnitude := len(integer) - (len(digits) - len(trimmed)) - 1 + exponent
	if !asFloat && !decimal {
		trimmed = strings.TrimRight(trimmed, "0")
	}
	return precisionScientific{coefficient: trimmed, magnitude: magnitude}
}

func losesNumericPrecision(raw string) bool {
	raw = strings.ToLower(strings.ReplaceAll(raw, "_", ""))
	baseTen := !strings.HasPrefix(raw, "0x") && !strings.HasPrefix(raw, "0b") && !strings.HasPrefix(raw, "0o")
	if len(raw) > 1 && raw[0] == '0' && !strings.ContainsAny(raw, ".e89") {
		baseTen = false
	}
	if !baseTen {
		integer, ok := helpers.ParseBigIntLiteralValue(raw)
		if !ok {
			return false
		}
		value, _ := new(big.Float).SetInt(integer).Float64()
		if math.IsInf(value, 0) {
			return true
		}
		stored, _ := new(big.Float).SetFloat64(value).Int(nil)
		return integer.Cmp(stored) != 0
	}
	raw = strings.ReplaceAll(raw, ".e", "e")
	raw = strings.TrimSuffix(raw, ".")
	value, _ := strconv.ParseFloat(raw, 64)
	normalized := normalizePrecisionDecimal(raw, false)
	if normalized.coefficient == "0" {
		return false
	}
	if value == 0 || math.IsInf(value, 0) || len(normalized.coefficient) > 100 {
		return true
	}
	stored := strconv.FormatFloat(value, 'e', len(normalized.coefficient)-1, 64)
	return normalized != normalizePrecisionDecimal(stored, true)
}
