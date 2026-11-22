# LateForClass tests

Run the offline suite from the repository root.

```bash
node tests/movement/run-tests.js
```

The runner loads the production scripts and uses browser and Three.js stand-ins. It verifies the game entry point, dependency order, exact path casing, startup errors, and the start, pause, and restart flow. It also tests jump input and clearing movement on focus or pointer-lock loss. A failed test exits with a nonzero status.

To run the shared cases with Three.js, start the local server from the [project README](../README.md), open <http://localhost:8090/tests/movement/>, and click **Run tests**. The shared tests cover camera-relative movement across frame rates, mouse look, gravity, grounded transitions, wall sliding, and ceiling and platform collisions. They also verify level geometry, cleanup, and classroom interaction range. Elevated-platform cases construct their own collision geometry.

The camera regressions check the world-space forward and right axes for independent yaw and pitch, a level horizon, pitch limits, repeated turns, and restoration of the configured spawn view. Run the browser suite to exercise these checks with Three.js.

The playground regressions check the level selector, gap jumping, stair ascent and descent, step limits, head clearance, ledge falls, and exact correspondence between the rendered box bounds and colliders. The game itself is available at `/?level=2`.

The classroom regressions cover door range, blocked movement while closed, opening and traversal from both sides, and reset with R. Open `/?level=3` to try the door in the game.

The two-floor route tests check grounded ascent and descent across all twelve treads at two frame rates, head clearance, and collision with the landing boundaries.
