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
        const camera = new THREE.PerspectiveCamera();
        camera.rotation.order = 'YXZ';
        const player = new Player(camera, gameConfig);
        const level = new Level(levelData, gameConfig);
        const scene = new THREE.Scene();
        level.build(scene);
        player.resetPosition(level.playerStart, level.playerLookAt);
        return { camera, player, level, scene };
    }

    test('WASD moves in the expected directions relative to the starting view', () => {
        for (const [code, dx, dz] of [
            ['KeyW', 0, 0.6], ['KeyS', 0, -0.6],
            ['KeyA', 0.6, 0], ['KeyD', -0.6, 0]
        ]) {
            const { player, level } = setup();
            player.onKeyDown({ code });
            player.update(0.1, level);
            near(player.position.x, level.playerStart.x + dx);
            near(player.position.z, level.playerStart.z + dz);
        }
    });

    test('one second of movement covers the same distance at 15, 30, 60, and 144 FPS', () => {
        for (const fps of [15, 30, 60, 144]) {
            const { player, level } = setup();
            player.onKeyDown({ code: 'KeyW' });
            for (let frame = 0; frame < fps; frame++) {
                player.update(1 / fps, level);
            }
            near(player.position.z - level.playerStart.z, gameConfig.moveSpeed);
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
            near(player.velocity.z, gameConfig.moveSpeed * Math.exp(-gameConfig.friction));
            const expectedCoast = gameConfig.moveSpeed * (1 - Math.exp(-gameConfig.friction)) / gameConfig.friction;
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
        near(camera.position.y, gameConfig.cameraHeight);
    });

    test('camera stays at eye height when falling onto the floor', () => {
        const { camera, player, level } = setup();
        player.resetPosition({ x: 0, y: 1, z: 0 });
        player.update(1, level);
        equal(player.position.y, 0);
        equal(player.velocity.y, 0);
        near(camera.position.y, gameConfig.cameraHeight);
    });

    test('all four perimeter walls stop the player, even on a long step', () => {
        for (const [code, axis, edge] of [
            ['KeyW', 'z', 14.5], ['KeyS', 'z', -14.5],
            ['KeyA', 'x', 4.5], ['KeyD', 'x', -4.5]
        ]) {
            const { player, level } = setup();
            player.onKeyDown({ code });
            player.update(9, level);
            near(player.position[axis], edge - Math.sign(edge) * gameConfig.playerRadius, 0.16);
            equal(level.isBlocked(player.position, gameConfig.playerRadius, gameConfig.playerHeight), false);
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

    test('wall meshes match their level dimensions and are disposed on rebuild', () => {
        const { player, level, scene } = setup();
        const original = [...scene.children];
        const wallMeshes = original.filter(object => object.material.color.getHex() === 0x607289);
        equal(wallMeshes.length, levelData.walls.length);
        for (const [index, mesh] of wallMeshes.entries()) {
            const { x, y, z, width, height, depth } = levelData.walls[index];
            equal(mesh.position.x, x);
            equal(mesh.position.y, y + height / 2);
            equal(mesh.position.z, z);
            equal(mesh.geometry.parameters.width, width);
            equal(mesh.geometry.parameters.height, height);
            equal(mesh.geometry.parameters.depth, depth);
        }

        let disposals = 0;
        for (const mesh of wallMeshes) {
            mesh.geometry.addEventListener('dispose', () => disposals++);
            mesh.material.addEventListener('dispose', () => disposals++);
        }
        player.onKeyDown({ code: 'KeyW' });
        player.update(0.2, level);
        level.build(scene);
        player.resetPosition(level.playerStart, level.playerLookAt);
        equal(scene.children.length, original.length);
        equal(scene.children.some(object => original.includes(object)), false);
        equal(disposals, wallMeshes.length * 2);
        near(player.position.z, level.playerStart.z);
        player.update(0.2, level);
        near(player.position.z, level.playerStart.z);
    });

    test('classroom interaction is available only near the door', () => {
        const { player, level } = setup();
        const { x, z, interactionRadius } = levelData.classroom;
        equal(level.canEnterClassroom(player.position), false);
        equal(level.canEnterClassroom({ x, z: z - interactionRadius - 0.01 }), false);
        equal(level.canEnterClassroom({ x, z: z - interactionRadius + 0.01 }), true);
    });
}
