# Late For Class tests

From the repository root:

```bash
node test/movement/run-tests.js
```

The runner loads the production `Player`, `Level`, and `Wall` classes. It supplies a minimal Three.js stand-in so the tests can run offline. A failure makes the process exit with a nonzero status.

To run the same gameplay cases with Three.js, start the local server from the project README, open <http://localhost:8090/test/movement/>, and click **Run tests**.

The suite covers movement directions, diagonal speed, frame-rate independence, braking, mouse yaw and pitch, eye height, perimeter collision, wall sliding, level rebuilds, and classroom interaction range. The Node runner also checks the exact filename casing of scripts loaded by the game page.
