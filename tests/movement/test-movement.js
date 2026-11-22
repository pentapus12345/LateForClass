function registerMovementTests(test, levelData) {
    const ELEVATED_PLATFORM = { x: 0, y: 2.2, z: 0, width: 2, height: 0.05, depth: 2 };

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

    function nearVector(actual, expected) {
        near(actual.x, expected.x);
        near(actual.y, expected.y);
        near(actual.z, expected.z);
    }

    function cameraDirection(camera) {
        return camera.getWorldDirection(new THREE.Vector3());
    }

    function cameraRight(camera) {
        camera.updateMatrixWorld();
        return camera.localToWorld(new THREE.Vector3(1, 0, 0)).sub(camera.position);
    }

    function setup({ platforms = [], config = GAME_CONFIG } = {}) {
        const player = new Player(config);
        const level = new Level({ ...levelData, platforms }, config);
        const scene = new THREE.Scene();
        level.build(scene);
        player.resetPosition(level.playerStart, level.playerLookAt, level);
        return { camera: player.camera, player, level, scene };
    }

    function advance(player, level, duration, framesPerSecond) {
        const frameTime = 1 / framesPerSecond;
        const frames = Math.floor(duration / frameTime);
        for (let frame = 0; frame < frames; frame++) {
            player.update(frameTime, level);
        }
        player.update(duration - frames * frameTime, level);
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

    test('horizontal mouse movement turns the view without changing its pitch', () => {
        const { camera, player } = setup();
        player.onMouseMove({ movementX: 0, movementY: -240 });
        const before = cameraDirection(camera);
        player.onMouseMove({ movementX: -Math.PI / 0.004, movementY: 0 });
        nearVector(cameraDirection(camera), { x: before.z, y: before.y, z: -before.x });
        near(cameraRight(camera).y, 0);
    });

    test('vertical mouse movement changes pitch while preserving the horizontal heading', () => {
        const { camera, player } = setup();
        player.onMouseMove({ movementX: 360, movementY: 0 });
        const heading = cameraDirection(camera);
        const right = cameraRight(camera);
        player.onMouseMove({ movementX: 0, movementY: 300 });
        nearVector(cameraDirection(camera), {
            x: heading.x * Math.cos(0.6),
            y: -Math.sin(0.6),
            z: heading.z * Math.cos(0.6)
        });
        nearVector(cameraRight(camera), right);
    });

    test('combined mouse movement keeps the horizon level and leaves the player and camera in place', () => {
        const { camera, player } = setup();
        const startPosition = player.position.clone();
        const cameraPosition = camera.position.clone();
        for (const [movementX, movementY] of [[350, -200], [520, 570], [-910, -490]]) {
            player.onMouseMove({ movementX, movementY });
            near(cameraRight(camera).y, 0);
            near(camera.rotation.z, 0);
        }
        nearVector(player.position, startPosition);
        nearVector(camera.position, cameraPosition);
    });

    test('pitch clamps above and below the horizon without flipping', () => {
        const { camera, player } = setup();
        for (const direction of [1, -1]) {
            player.onMouseMove({ movementX: 380, movementY: -direction * 10000 });
            const forward = cameraDirection(camera);
            near(forward.y, direction * Math.cos(0.01));
            near(Math.hypot(forward.x, forward.z), Math.sin(0.01));
            player.onMouseMove({ movementX: 450, movementY: 0 });
            near(cameraDirection(camera).y, forward.y);
            near(cameraRight(camera).y, 0);
            player.onMouseMove({ movementX: 0, movementY: direction * 100 });
            equal(direction * cameraDirection(camera).y < direction * forward.y, true);
        }
    });

    test('successive quarter turns cycle through all headings over multiple full rotations', () => {
        const { camera, player, level } = setup();
        player.resetPosition(level.playerStart, null, level);
        const directions = [
            { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 },
            { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }
        ];
        for (let quarterTurn = 0; quarterTurn < 24; quarterTurn++) {
            player.onMouseMove({ movementX: -Math.PI / 0.004, movementY: 0 });
            nearVector(cameraDirection(camera), directions[quarterTurn % directions.length]);
            near(cameraRight(camera).y, 0);
        }
    });

    test('repeated combined mouse movements return to the same orientation without drift', () => {
        const { camera, player } = setup();
        player.onMouseMove({ movementX: 200, movementY: 125 });
        const direction = cameraDirection(camera);
        const right = cameraRight(camera);
        for (let cycle = 0; cycle < 1000; cycle++) {
            for (const [movementX, movementY] of [[470, 120], [-210, 180], [-470, -120], [210, -180]]) {
                player.onMouseMove({ movementX, movementY });
                near(cameraRight(camera).y, 0);
            }
        }
        nearVector(cameraDirection(camera), direction);
        nearVector(cameraRight(camera), right);
    });

    test('a spawn target sets nonzero yaw and pitch from eye height and reset restores both', () => {
        const { camera, player, level } = setup();
        const start = { x: 1, y: 0, z: -6 };
        const target = { x: 4, y: GAME_CONFIG.cameraHeight + 2, z: -10 };
        const length = Math.hypot(3, 2, 4);
        const expected = { x: 3 / length, y: 2 / length, z: -4 / length };
        player.resetPosition(start, target, level);
        nearVector(cameraDirection(camera), expected);
        near(cameraRight(camera).y, 0);
        player.onMouseMove({ movementX: 1900, movementY: 680 });
        player.resetPosition(start, target, level);
        nearVector(cameraDirection(camera), expected);
        near(cameraRight(camera).y, 0);
    });

    test('a vertical spawn target uses the same pitch clamp as mouse input', () => {
        const { camera, player, level } = setup();
        const start = level.playerStart;
        const eyeY = start.y + GAME_CONFIG.cameraHeight;
        for (const direction of [1, -1]) {
            player.resetPosition(start, { x: start.x, y: eyeY + direction, z: start.z }, level);
            const forward = cameraDirection(camera);
            nearVector(forward, { x: 0, y: direction * Math.cos(0.01), z: -Math.sin(0.01) });
            player.onMouseMove({ movementX: 300, movementY: 0 });
            near(cameraDirection(camera).y, forward.y);
            near(cameraRight(camera).y, 0);
        }
        player.resetPosition(start, { x: start.x, y: eyeY, z: start.z }, level);
        nearVector(cameraDirection(camera), { x: 0, y: 0, z: -1 });
    });

    test('forward movement follows the horizontal view at upward, level, and downward pitch', () => {
        for (const movementY of [-10000, 0, 10000]) {
            const { camera, player, level } = setup();
            player.onMouseMove({ movementX: 450, movementY });
            const { x, z } = cameraDirection(camera);
            const horizontalLength = Math.hypot(x, z);
            const distance = 0.1 * GAME_CONFIG.moveSpeed;
            player.onKeyDown({ code: 'KeyW' });
            player.update(0.1, level);
            nearVector(player.position, {
                x: level.playerStart.x + distance * x / horizontalLength,
                y: level.playerStart.y,
                z: level.playerStart.z + distance * z / horizontalLength
            });
        }
    });

    test('camera stays at eye height when falling onto the floor', () => {
        const { camera, player, level } = setup();
        player.resetPosition({ x: 0, y: 1, z: 0 }, null, level);
        equal(player.isGrounded, false);
        player.onKeyDown({ code: 'Space' });
        player.update(0.2, level);
        near(player.position.y, 1 - GAME_CONFIG.gravity * 0.2 ** 2 / 2);
        near(player.velocity.y, -GAME_CONFIG.gravity * 0.2);
        equal(player.isGrounded, false);
        player.update(1, level);
        equal(player.position.y, 0);
        equal(player.velocity.y, 0);
        equal(player.isGrounded, true);
        near(camera.position.y, GAME_CONFIG.cameraHeight);
    });

    test('Space jumps only from support and holding it does not jump again on landing', () => {
        const { player, level } = setup();
        equal(player.isGrounded, true);
        player.onKeyDown({ code: 'Space' });
        equal(player.isGrounded, false);
        const launchSpeed = Math.sqrt(2 * GAME_CONFIG.gravity * GAME_CONFIG.jumpHeight);
        near(player.velocity.y, launchSpeed);
        player.update(0.2, level);
        const risingVelocity = player.velocity.y;
        player.onKeyUp({ code: 'Space' });
        player.onKeyDown({ code: 'Space' });
        near(player.velocity.y, risingVelocity);
        player.update(0.4, level);
        const fallingVelocity = player.velocity.y;
        equal(fallingVelocity < 0, true);
        player.onKeyDown({ code: 'Space' });
        near(player.velocity.y, fallingVelocity);

        player.update(1, level);
        equal(player.isGrounded, true);
        equal(player.velocity.y, 0);
        player.onKeyDown({ code: 'Space', repeat: true });
        player.update(0.1, level);
        equal(player.position.y, 0);
        player.onKeyUp({ code: 'Space' });
        player.onKeyDown({ code: 'Space' });
        near(player.velocity.y, launchSpeed);
    });

    test('jump height and air time follow configuration across frame rates', () => {
        const config = { ...GAME_CONFIG, gravity: 13, jumpHeight: 1.4 };
        const apexTime = Math.sqrt(2 * config.jumpHeight / config.gravity);
        for (const framesPerSecond of [15, 30, 60, 144]) {
            const { player, level } = setup({ config });
            player.onKeyDown({ code: 'Space' });
            player.onKeyDown({ code: 'KeyW' });
            advance(player, level, apexTime, framesPerSecond);
            near(player.position.y, config.jumpHeight);
            near(player.velocity.y, 0);
            near(player.position.z - level.playerStart.z, config.moveSpeed * apexTime);
            equal(player.isGrounded, false);
            advance(player, level, apexTime - 0.01, framesPerSecond);
            equal(player.isGrounded, false);
            player.update(0.02, level);
            equal(player.isGrounded, true);
            near(player.position.y, 0);
        }
    });

    test('a fast fall lands on the highest thin platform, then walking off resumes gravity', () => {
        const { player, level } = setup({
            platforms: [{ ...ELEVATED_PLATFORM, y: 1.1 }, ELEVATED_PLATFORM]
        });
        const platformTop = ELEVATED_PLATFORM.y + ELEVATED_PLATFORM.height;
        player.resetPosition({ x: 0, y: 3, z: 0 }, null, level);
        player.velocity.y = -70;
        player.update(0.25, level);
        near(player.position.y, platformTop);
        equal(player.velocity.y, 0);
        equal(player.isGrounded, true);
        near(player.camera.position.y, platformTop + GAME_CONFIG.cameraHeight);

        player.onKeyDown({ code: 'KeyD' });
        player.update(0.1, level);
        equal(player.isGrounded, true);
        player.update(0.2, level);
        equal(player.isGrounded, false);
        equal(player.position.y < platformTop && player.velocity.y < 0, true);
        player.onKeyUp({ code: 'KeyD' });
        player.update(1, level);
        equal(player.position.y, 0);
        equal(player.isGrounded, true);
    });

    test('a platform can be reached from an airborne approach and blocks walking through its side', () => {
        const platform = { ...ELEVATED_PLATFORM, y: 0.5, height: 0.1 };
        const { player, level } = setup({ platforms: [platform] });
        player.resetPosition({ x: -2.5, y: 0, z: 0 }, null, level);
        player.onKeyDown({ code: 'KeyD' });
        player.update(0.25, level);
        equal(player.position.x <= -1 - GAME_CONFIG.playerRadius, true);
        player.onKeyDown({ code: 'Space' });
        player.update(0.5, level);
        equal(player.position.x > -1 && player.position.y > platform.y + platform.height, true);
        player.onKeyUp({ code: 'KeyD' });
        player.update(0.4, level);
        equal(player.isGrounded, true);
        near(player.position.y, platform.y + platform.height);
    });

    test('a spawn at a decimal platform height is supported despite rounding', () => {
        const platform = { ...ELEVATED_PLATFORM, y: 0.1, height: 0.2 };
        const { player, level } = setup({ platforms: [platform] });
        player.resetPosition({ x: 0, y: 0.3, z: 0 }, null, level);
        equal(player.isGrounded, true);
        player.update(0.1, level);
        near(player.position.y, 0.3);
        equal(player.velocity.y, 0);
    });

    function checkCeiling(config, platform) {
        const { player, level } = setup({ config, platforms: platform ? [platform] : [] });
        player.resetPosition({ x: 0, y: 0, z: 0 }, null, level);
        const surfaceY = platform ? platform.y : levelData.hallway.height;
        const clearance = surfaceY - config.playerHeight;
        const launchSpeed = Math.sqrt(2 * config.gravity * config.jumpHeight);
        const impactTime = 2 * clearance / (launchSpeed + Math.sqrt(launchSpeed ** 2 - 2 * config.gravity * clearance));
        player.onKeyDown({ code: 'Space' });
        player.update(impactTime + 0.02, level);
        near(player.position.y, clearance - config.gravity * 0.02 ** 2 / 2);
        near(player.velocity.y, -config.gravity * 0.02);
        equal(player.isGrounded, false);
        player.update(2, level);
        equal(player.isGrounded, true);
        equal(player.position.y, 0);
    }

    test('the underside of an elevated platform stops a jump and the player falls back', () => {
        checkCeiling(GAME_CONFIG, ELEVATED_PLATFORM);
    });

    test('the hallway ceiling blocks a jump that would rise above the box', () => {
        checkCeiling({ ...GAME_CONFIG, jumpHeight: 4 });
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
        player.resetPosition({ x: 4.15, y: 0, z: 0 }, { x: 4.15, y: GAME_CONFIG.cameraHeight, z: 1 }, level);
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
        player.resetPosition(level.playerStart, level.playerLookAt, level);
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
