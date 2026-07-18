# Friction

- critic requirements: 4 rounds, blocking 1,3,1,0 (round 1 needed user adjudication of a goals-vs-code contradiction on size-suffix blocking; rounds 2–3 surfaced wind4 default-theme leaks the goals never anticipated)
- state engine: prettier commit hook reformatted requirements.md after its approval hash was recorded → spurious mismatch/cascade; workaround adopted: run `yarn prettier --write` on mise artifacts before approving
- critic plan: 2 rounds, blocking 2,0 (round 1 caught by EXECUTING the design: wind4 m/p/gap resolves the numeric multiplier before theme lookup, and var-based output broke all literal assertions — reading the code alone had missed both)
- acceptance: user flagged src/index.ts type patching — as-unknown-as Preset cast; fix: preset generic = PresetWind4Theme, strict theme at options boundary only (verified compiling in scratch)
