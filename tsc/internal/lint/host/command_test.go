package host

import (
	"context"
	"testing"

	"gotest.tools/v3/assert"
)

func TestCommandIsExplicitAndCopied(t *testing.T) {
	t.Parallel()
	command := []string{"node-from-launcher", "matching-shim.js"}
	ctx := WithCommand(context.Background(), command)
	command[0] = "changed"
	actual := CommandFromContext(ctx)
	assert.Equal(t, actual[0], "node-from-launcher")
	actual[1] = "changed"
	again := CommandFromContext(ctx)
	assert.Equal(t, again[1], "matching-shim.js")
}
