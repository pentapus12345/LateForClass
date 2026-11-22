function registerMovementTests(test, levelData) {
    function equal(actual, expected) {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
        }
    }

    function near(actual, expected, tolerance = 1e-9) {
        if (!(Math.abs(actual - expected) <= tolerance)) {
            throw new Error(`Expected ${actual} to be within ${tolerance} of ${expected}`);
        }
    }

    function setup() {
        const player = new Player(GAME_CONFIG);
        const level = new Level(levelData, GAME_CONFIG);
        const scene = new THREE.Scene();
        level.build(scene);
        player.resetPosition(level.playerStart, level.playerLookAt);
        return { camera: player.camera, player, level, scene };
    }

    test('WASD moves in the expected directions relative to the starting view', () => {
        for (const [code, offsetX, offsetZ] of [
            ['KeyW', 0, 0.6], ['KeyS', 0, -0.6],
            ['KeyA', 0.6, 0], ['KeyD', -0.6, 0]
        ]) {
            const { player, level } = setup();
            player.onKeyDown({ code });
            player.update(0.1, level);
            near(player.position.x, level.playerStart.x + offsetX);
            near(player.position.z, level.playerStart.z + offsetZ);
        }
    });

    test('one second of movement covers the same distance at 15, 30, 60, and 144 FPS', () => {
        for (const fps of [15, 30, 60, 144]) {
            const { player, level } = setup();
            player.onKeyDown({ code: 'KeyW' });
            for (let frame = 0; frame < fps; frame++) {
                player.update(1 / fps, level);
            }
            near(player.position.z - level.playerStart.z, GAME_CONFIG.moveSpeed);
        }
    });

    test('diagonal movement is normalized and opposite inputs cancel', () => {
        const { player, level } = setup();
        player.onKeyDown({ code: 'KeyW' });
        player.onKeyDown({ code: 'KeyD' });
        player.update(0.1, level);
        const distance = Math.hypot(
            player.position.x - level.playerStart.x,
            player.position.z - level.playerStart.z
        );
        near(distance, 0.6);

        player.onKeyDown({ code: 'KeyS' });
        player.onKeyDown({ code: 'KeyA' });
        const stationary = player.position.clone();
        player.update(0.1, level);
        near(player.position.x, stationary.x);
        near(player.position.z, stationary.z);
    });

    test('releasing a key slows the player consistently across frame rates', () => {
        for (const fps of [30, 60, 144]) {
            const { player, level } = setup();
            player.onKeyDown({ code: 'KeyW' });
            player.update(0.1, level);
            const releasePosition = player.position.z;
            player.onKeyUp({ code: 'KeyW' });
            for (let frame = 0; frame < fps; frame++) {
                player.update(1 / fps, level);
            }
            near(player.velocity.z, GAME_CONFIG.moveSpeed * Math.exp(-GAME_CONFIG.friction));
            const expectedCoast = GAME_CONFIG.moveSpeed * (1 - Math.exp(-GAME_CONFIG.friction)) / GAME_CONFIG.friction;
            near(player.position.z - releasePosition, expectedCoast);
        }
    });

    test('mouse changes yaw and clamps pitch while movement stays horizontal', () => {
        const { camera, player, level } = setup();
        const startYaw = camera.rotation.y;
        player.onMouseMove({ movementX: Math.PI / 0.004, movementY: -10000 });
        near(camera.rotation.y, startYaw - Math.PI / 2);
        near(camera.rotation.x, Math.PI / 2 - 0.01);

        player.onKeyDown({ code: 'KeyW' });
        player.update(0.1, level);
        near(player.position.x - level.playerStart.x, -0.6);
        near(player.position.z, level.playerStart.z);
        near(camera.position.y, GAME_CONFIG.cameraHeight);
    });

    test('camera stays at eye height when falling onto the floor', () => {
        const { camera, player, level } = setup();
        player.resetPosition({ x: 0, y: 1, z: 0 });
        player.update(1, level);
        equal(player.position.y, 0);
        equal(player.velocity.y, 0);
        near(camera.position.y, GAME_CONFIG.cameraHeight);
    });

    test('all four invisible perimeter walls stop the player, even on a long step', () => {
        const { width, depth, wallThickness } = levelData.hallway;
        for (const [code, axis, boxEdge] of [
            ['KeyW', 'z', depth / 2], ['KeyS', 'z', -depth / 2],
            ['KeyA', 'x', width / 2], ['KeyD', 'x', -width / 2]
        ]) {
            const { player, level } = setup();
            const insideEdge = Math.abs(boxEdge) - wallThickness / 2 - GAME_CONFIG.playerRadius;
            player.onKeyDown({ code });
            player.update(9, level);
            near(player.position[axis], Math.sign(boxEdge) * insideEdge, 0.16);
            equal(Math.abs(player.position[axis]) <= insideEdge + 1e-9, true);
            equal(level.isBlocked(player.position, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
            equal(player.velocity[axis], 0);
        }
    });

    test('the player slides along a wall while holding diagonal input', () => {
        const { player, level } = setup();
        player.resetPosition({ x: 4.15, y: 0, z: 0 }, level.playerLookAt);
        player.camera.rotation.y = Math.PI;
        player.onKeyDown({ code: 'KeyW' });
        player.onKeyDown({ code: 'KeyA' });
        player.update(0.5, level);
        equal(player.position.x <= 4.2, true);
        near(player.position.z, 3 / Math.sqrt(2));
    });

    test('the hallway contains twelve distinct outer edges and the configured pillar row', () => {
        const { scene } = setup();
        const { width, height, depth } = levelData.hallway;
        const { count, startX, z, radius, spacing, height: pillarHeight } = levelData.pillars;
        const [frame, ...pillars] = scene.children;
        equal(frame.isLineSegments, true);
        equal(pillars.length, count);

        const positions = frame.geometry.getAttribute('position');
        equal(positions.count, 24);
        const edges = new Set();
        const corners = new Set();
        for (let index = 0; index < positions.count; index += 2) {
            const [a, b] = [index, index + 1].map(i => [
                positions.getX(i), positions.getY(i), positions.getZ(i)
            ]);
            for (const point of [a, b]) {
                near(Math.abs(point[0]), width / 2);
                equal(point[1] === 0 || point[1] === height, true);
                near(Math.abs(point[2]), depth / 2);
                corners.add(point.join(','));
            }
            equal(a.filter((coordinate, axis) => coordinate !== b[axis]).length, 1);
            edges.add([a.join(','), b.join(',')].sort().join('|'));
        }
        equal(edges.size, 12);
        equal(corners.size, 8);

        for (const [index, pillar] of pillars.entries()) {
            equal(pillar.geometry.type, 'CylinderGeometry');
            equal(pillar.geometry.parameters.radiusTop, radius);
            equal(pillar.geometry.parameters.radiusBottom, radius);
            equal(pillar.geometry.parameters.height, pillarHeight);
            equal(pillar.material.wireframe, true);
            near(pillar.position.x, startX + index * spacing);
            near(pillar.position.y, pillarHeight / 2);
            near(pillar.position.z, z);
        }
    });

    test('rebuild replaces level objects and disposes shared resources once', () => {
        const { player, level, scene } = setup();
        const original = [...scene.children];
        const resources = new Set(original.flatMap(object => [object.geometry, object.material]));
        const disposals = new Map();
        for (const resource of resources) {
            disposals.set(resource, 0);
            resource.addEventListener('dispose', () => disposals.set(resource, disposals.get(resource) + 1));
        }
        player.onKeyDown({ code: 'KeyW' });
        player.update(0.2, level);
        level.build(scene);
        player.resetPosition(level.playerStart, level.playerLookAt);
        equal(scene.children.length, original.length);
        equal(scene.children.some(object => original.includes(object)), false);
        for (const disposeCount of disposals.values()) {
            equal(disposeCount, 1);
        }
        near(player.position.z, level.playerStart.z);
        player.update(0.2, level);
        near(player.position.z, level.playerStart.z);
    });

    test('classroom interaction is out of range at spawn and reachable inside the far wall', () => {
        const { player, level } = setup();
        const { x, z, interactionRadius } = levelData.classroom;
        equal(level.canEnterClassroom(player.position), false);
        equal(level.canEnterClassroom({ x, y: 0, z: z - interactionRadius - 0.01 }), false);
        const approach = { x, y: 0, z: z - interactionRadius + 0.01 };
        equal(level.canEnterClassroom(approach), true);
        equal(level.isBlocked(approach, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
    });
}
