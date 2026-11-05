// Celestia's deterministic bridge for gcsim v2.47.2 (MIT).
// Build this file alongside the pinned cmd/wasm package, never against floating main.
// It adds a seeded, non-debug entry point without altering upstream combat rules.
//go:build !codeanalysis && js && wasm

package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"syscall/js"

	"github.com/genshinsim/gcsim/pkg/core/action"
	"github.com/genshinsim/gcsim/pkg/core/event"
	"github.com/genshinsim/gcsim/pkg/gcs/ast"
	"github.com/genshinsim/gcsim/pkg/gcs/eval"
	"github.com/genshinsim/gcsim/pkg/simulation"
	"github.com/genshinsim/gcsim/pkg/simulator"
)

func init() { js.Global().Set("runCelestia", js.FuncOf(celestiaRun)) }

type celestiaMember struct {
	Key             string         `json:"key"`
	Damage          float64        `json:"damage"`
	ActiveFrames    int            `json:"activeFrames"`
	Actions         int            `json:"actions"`
	FailedIntervals int            `json:"failedIntervals"`
	ActionCounts    map[string]int `json:"actionCounts"`
	BlockedAttempts map[string]int `json:"blockedAttempts"`
}
type celestiaResult struct {
	DiagnosticsVersion int              `json:"diagnosticsVersion"`
	Seed               string           `json:"seed"`
	DurationFrames     int              `json:"durationFrames"`
	TotalDamage        float64          `json:"totalDamage"`
	DPS                float64          `json:"dps"`
	Members            []celestiaMember `json:"members"`
}

func celestiaRun(this js.Value, args []js.Value) (out interface{}) {
	defer func() {
		if r := recover(); r != nil {
			out = marshal(fmt.Errorf("simulation failed: %v", r))
		}
	}()
	seed, err := strconv.ParseUint(args[1].String(), 10, 63)
	if err != nil {
		return marshal(err)
	}
	file := ast.NewFile()
	cfg, program, err := simulator.Parse(file, args[0].String())
	if err != nil {
		return marshal(err)
	}
	core, err := simulation.NewCore(int64(seed), false, cfg)
	if err != nil {
		return marshal(err)
	}
	evaluator, err := eval.NewEvaluator(file, program, core)
	if err != nil {
		return marshal(err)
	}
	sim, err := simulation.New(cfg, evaluator, core)
	if err != nil {
		return marshal(err)
	}
	// Count the native retry reason at each check. Upstream's failure intervals
	// retain only the initial reason and can span changes from cooldown to energy.
	blocked := make([]map[string]int, len(core.Player.Chars()))
	for i := range blocked {
		blocked[i] = map[string]int{}
	}
	core.Events.Subscribe(event.OnActionFailed, func(args ...any) {
		index := args[0].(int)
		reason := args[3].(action.Failure).String()
		blocked[index][reason]++
	}, "celestia-action-diagnostics")
	result, err := sim.Run()
	if err != nil {
		return marshal(err)
	}
	summary := celestiaResult{DiagnosticsVersion: 1, Seed: args[1].String(), DurationFrames: result.Duration, TotalDamage: result.TotalDamage, DPS: result.DPS, Members: []celestiaMember{}}
	for index, char := range result.Characters {
		damage := 0.0
		for _, event := range char.DamageEvents {
			damage += event.Damage
		}
		counts := map[string]int{}
		for _, event := range char.ActionEvents {
			counts[event.Action]++
		}
		summary.Members = append(summary.Members, celestiaMember{
			Key: char.Name, Damage: damage, ActiveFrames: char.ActiveTime,
			Actions: len(char.ActionEvents), FailedIntervals: len(char.FailedActions),
			ActionCounts: counts, BlockedAttempts: blocked[index],
		})
	}
	data, err := json.Marshal(summary)
	if err != nil {
		return marshal(err)
	}
	return string(data)
}
