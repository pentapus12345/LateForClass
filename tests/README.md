# LateForClass tests

Run the offline suite from the repository root.

```bash
node tests/movement/run-tests.js
```

The runner loads the production scripts and uses browser and Three.js stand-ins. It verifies the game entry point, dependency order, exact path casing, startup errors, and the start, pause, and restart flow. A failed test exits with a nonzero status.

To run the shared cases with Three.js, start the local server from the [project README](../README.md), open <http://localhost:8090/tests/movement/>, and click **Run tests**. These cases verify level geometry and cleanup, movement, mouse look, gravity, wall collisions, and the classroom interaction range.
