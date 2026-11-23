# LateForClass tests

Run the offline suite from the repository root.

```bash
node tests/movement/run-tests.js
```

The runner loads the production scripts and uses browser and Three.js stand-ins. It verifies the game entry point, local Three.js dependency, script order and casing, startup errors, and the start, pause, and restart flow. It also tests jump input and clearing movement on focus or pointer-lock loss. A failed test exits with a nonzero status.

To run the shared cases with Three.js, start the local server from the [project README](../README.md), open <http://localhost:8090/tests/movement/>, and click **Run tests**. The shared tests cover camera-relative movement across frame rates, mouse look, gravity, grounded transitions, wall sliding, and ceiling and platform collisions. They also verify level geometry, cleanup, and classroom interaction range. Elevated-platform cases construct their own collision geometry.

The camera regressions check the world-space forward and right axes for independent yaw and pitch, a level horizon, pitch limits, repeated turns, and restoration of the configured spawn view. Run the browser suite to exercise these checks with Three.js.

The controls regressions exercise every direction in both layouts, keyboard turn speed across frame rates, independent look toggles, mouse sensitivity and inversion, and camera roll. The offline runner also checks saved settings across reloads, Restore Defaults, unavailable storage, and jump input in and out of gameplay.

The playground regressions check the level selector, gap jumping, stair ascent and descent, step limits, head clearance, ledge falls, and exact correspondence between the rendered box bounds and colliders. The game itself is available at `/?level=2`.

The classroom regressions cover door range and nearest-door selection, blocked movement while closed, traversal in both directions, and reset with R. They check that closed and open panels and debug outlines match their colliders, including doors mounted along the side walls. Open `/?level=3` to try the doors in the game.

The two-floor route tests check grounded ascent and descent across all twelve treads at two frame rates, head clearance, and collision with the landing boundaries.

The classroom objective tests check full doorway clearance, containment between the room's floor and ceiling, the room label, and automatic arrival in the scheduled room. Restart coverage checks that the door and objective reset and that the previous sign texture is disposed.

The schedule tests replace the configured class, room, and start time and verify the displayed values and objective. They also check panel visibility on pause, resume, completion, and restart. A wrong-room entry leaves the scheduled objective and clock active. Changing the scheduled room is enough to win through either side door.

The wayfinding regressions check the fixed room order on both floors, sign orientation and text, texture cleanup, and that signs remain visible in debug view without adding colliders. Traversal tests walk the public passage and staircase with all six doors closed. The default challenge test visits Ground Room 003, checks that the clock continues, and then wins in First-floor Room 102. Alternate schedule tests also cover Ground Room 002.

The furniture tests cover all six types, position and rotation, shared resources, collision overrides, debug outlines, and disposal on restart. A movement test walks through a decorative whiteboard and verifies that enabling its collider blocks the same route. Both suites parse the real desk and chair GLBs with r128 GLTFLoader and check rotated bounds, floor placement, and resource reuse on rebuild. The offline startup test also verifies one request per model across a restart and the load-error screen when a model is missing.

The lighting tests check the default lights, level-defined fixtures and shadow settings, selected casting and receiving surfaces, collision debug mode, and resource disposal on restart.

The clock regressions check scaling across frame intervals, active time across focus and pointer-lock changes, the exact deadline, arrival before it, and result and clock reset on retry. The shared cases run against the same clock used by the game.

The session unit tests supply timestamps and room IDs without creating a scene or DOM. The UI contract test supplies screen state and checks DOM output and menu callbacks without running the game loop. The startup and playthrough regressions exercise the assembled components.

Visual foundation tests verify that the solid surfaces and debug outlines match the colliders, that V preserves camera position, and that the debug outline follows the door as it opens. Both views use the same physics.
