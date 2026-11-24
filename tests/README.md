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

The wayfinding regressions check the fixed room order on both floors, sign orientation and text, texture cleanup, and that signs remain visible in debug view without adding colliders. Traversal tests walk the public passage and staircase with all six doors closed. The default challenge test visits Ground Room 003 and First-floor Room 101, checks that the clock advances inside Room 101, and then wins in scheduled Room 102. Alternate schedule tests also cover Ground Room 002.

The furniture tests cover all six procedural types, position and rotation, shared resources, collision overrides, debug outlines, and disposal on restart. A movement test walks through a decorative whiteboard and verifies that enabling its collider blocks the same route. Both suites parse the classroom GLB geometry with r128 GLTFLoader, and the browser also decodes the textures. The tests check imported seating and collider bounds, books within the shelf compartments, the route into Room 102, and one model request per path across a restart.

The lighting tests check the default lights, level-defined fixtures and shadow settings, selected casting and receiving surfaces, collision debug mode, and resource disposal on restart.

The clock regressions check scaling across frame intervals, active time across focus and pointer-lock changes, the exact deadline, arrival before it, and result and clock reset on retry. The shared cases run against the same clock used by the game.

The session unit tests supply timestamps and room IDs without creating a scene or DOM. The UI contract test supplies screen state and checks DOM output and menu callbacks without running the game loop. The startup and playthrough regressions exercise the assembled components.

Visual foundation tests verify that the solid surfaces and debug outlines match the colliders, that V preserves camera position, and that the debug outline follows the door as it opens. Both views use the same physics.

## Connected-area lifecycle

Both runners execute the async A/B fixture using Three.js r128, the actual GLTFLoader and the optimized student chair. The two definitions use different relative paths for the same GLB. The tests check request sharing, stable identities, load races and failure recovery, seam movement in world coordinates, restoration of both door swings, shadow and fixture release, and disposal of borrowed and area-owned resources. Chrome renders B into a WebGL context after unloading A. Node also exercises the assembled Game with a running school clock across a reload and a second area's activation.

For performance comparison, use the milestone-19 network settings, resolution, and three timed Room 102 runs. The benchmark and representative paired first-person views are recorded in the [architecture decision](../docs/connected-school-architecture.md#verification).

## First Court blockout

The shared tests load the actual First Court manifest and its GLBs. They cross all three apertures at three offsets, on foot and mid-jump, reverse direction, check the lintels, open the lodge and classroom, climb and descend the lookout stair, and attempt to jump the court parapet. A Three.js ray from each overlook must hit the same cloister-owned tower before any opaque obstruction. Both runners also walk the complete loop in both directions, check the seven public plaques, both staff doors, and validate schedule eligibility. The Node integration cases check both classroom destinations, renumbering across all UI states and the onward sign, the timed and development URLs, the exact deadline and retry. [First-person walk](../docs/first-court-blockout.md)
