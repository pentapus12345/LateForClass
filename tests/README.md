# LateForClass tests

Run the offline suite from the repository root.

```bash
node tests/movement/run-tests.js
```

The runner loads the production scripts and uses browser and Three.js stand-ins. It verifies the game entry point, dependency order, exact path casing, startup errors, and the start, pause, and restart flow. It also tests jump input and clearing movement on focus or pointer-lock loss. A failed test exits with a nonzero status.

To run the shared cases with Three.js, start the local server from the [project README](../README.md), open <http://localhost:8090/tests/movement/>, and click **Run tests**. The shared tests cover camera-relative movement across frame rates, mouse look, gravity, grounded transitions, wall sliding, and ceiling and platform collisions. They also verify level geometry, cleanup, and classroom interaction range. Elevated-platform cases construct their own collision geometry.

The camera regressions check the world-space forward and right axes for independent yaw and pitch, a level horizon, pitch limits, repeated turns, and restoration of the configured spawn view. Run the browser suite to exercise these checks with Three.js.
