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

	"github.com/genshinsim/gcsim/pkg/gcs/ast"
	"github.com/genshinsim/gcsim/pkg/gcs/eval"
	"github.com/genshinsim/gcsim/pkg/simulation"
	"github.com/genshinsim/gcsim/pkg/simulator"
)

func init() { js.Global().Set("runCelestia", js.FuncOf(celestiaRun)) }

type celestiaMember struct {
	Key             string  `json:"key"`
	Damage          float64 `json:"damage"`
	ActiveFrames    int     `json:"activeFrames"`
	Actions         int     `json:"actions"`
	FailedIntervals int     `json:"failedIntervals"`
}
type celestiaResult struct {
	Seed           string           `json:"seed"`
	DurationFrames int              `json:"durationFrames"`
	TotalDamage    float64          `json:"totalDamage"`
	DPS            float64          `json:"dps"`
	Members        []celestiaMember `json:"members"`
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
	result, err := sim.Run()
	if err != nil {
		return marshal(err)
	}
	summary := celestiaResult{Seed: args[1].String(), DurationFrames: result.Duration, TotalDamage: result.TotalDamage, DPS: result.DPS, Members: []celestiaMember{}}
	for _, char := range result.Characters {
		damage := 0.0
		for _, event := range char.DamageEvents {
			damage += event.Damage
		}
		summary.Members = append(summary.Members, celestiaMember{char.Name, damage, char.ActiveTime, len(char.ActionEvents), len(char.FailedActions)})
	}
	data, err := json.Marshal(summary)
	if err != nil {
		return marshal(err)
	}
	return string(data)
}
