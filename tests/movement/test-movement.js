function registerMovementTests(test, levels, models) {
    const [levelData, playgroundData, classroomData] = levels;
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

    function setup({ definition = levelData, platforms = definition.platforms, config = GAME_CONFIG, controls } = {}) {
        const player = new Player(config, controls);
        const level = new Level({ ...definition, platforms }, config, models);
        const scene = new THREE.Scene();
        level.build(scene);
        player.resetPosition(level.playerStart, level.playerLookAt, level);
        return { camera: player.camera, player, level, scene };
    }

    function pressKey(player, code) {
        player.pressAction(getKeyboardAction(code, player.controlSettings.keyboardLayout));
    }

    function releaseKey(player, code) {
        player.releaseAction(getKeyboardAction(code, player.controlSettings.keyboardLayout));
    }

    function advance(player, level, duration, framesPerSecond) {
        const frameTime = 1 / framesPerSecond;
        const frames = Math.floor(duration / frameTime);
        for (let frame = 0; frame < frames; frame++) {
            player.update(frameTime, level);
        }
        player.update(duration - frames * frameTime, level);
    }

    function startPlayground(position, config = GAME_CONFIG) {
        const setupState = setup({ definition: playgroundData, config });
        const { player, level } = setupState;
        player.resetPosition(position, {
            x: position.x, y: position.y + config.cameraHeight, z: position.z + 1
        }, level);
        return setupState;
    }

    test('school time scales active milliseconds and uses a strict deadline', () => {
        const clock = new SchoolClock({ startTime: '08:00' }, '09:00');
        clock.setRunning(true, 123);
        equal(clock.formatTime(10123), '08:10');
        equal(clock.hasReachedDeadline(60122.999), false);
        equal(clock.hasReachedDeadline(60123), true);
        equal(clock.formatTime(60123), '09:00');
        equal(clock.formatTime(90123), '09:00');
    });

    test('school time is independent of sample frequency and excludes stopped intervals', () => {
        const clock = new SchoolClock({ startTime: '08:00', timeScale: 30 }, '08:01');
        for (const frameMs of [5, 16, 1000]) {
            clock.reset();
            clock.setRunning(true, 0);
            for (let now = 0; now < 1000; now += frameMs) {
                equal(clock.formatTime(now), '08:00');
            }
            clock.setRunning(false, 1000);
            equal(clock.getElapsedMs(10000), 1000);
            clock.setRunning(true, 20000);
            equal(clock.hasReachedDeadline(20999), false);
            equal(clock.hasReachedDeadline(21000), true);
        }
    });

    test('a session owns the selected room, pause accounting, and the immutable result', () => {
        const schedule = { className: 'Art', roomId: '102', startTime: '09:00' };
        const session = new GameSession({ schedule, clock: { startTime: '08:00' }, destinationRoomId: '101' });
        session.setPlayAccess(true, 0);
        equal(session.phase, 'ready');
        session.start();
        equal(session.phase, 'paused');
        session.setPlayAccess(true, 1000);
        equal(session.enterRoom('101', 11000), false);
        session.setPlayAccess(false, 11000);
        equal(session.snapshot(100000).schoolTime, '08:10');
        equal(session.enterRoom('102', 100000), false);
        session.setPlayAccess(true, 100000);
        equal(session.enterRoom('102', 149999), true);
        equal(session.snapshot(300000).arrivedRoomId, '102');
        equal(session.snapshot(300000).schoolTime, '08:59');
        equal(session.checkDeadline(300000), false);
        equal(session.phase, 'arrived');
        session.reset();
        equal(session.snapshot(300000).arrivedRoomId, null);
        equal(session.snapshot(300000).schoolTime, '08:00');
        equal(session.phase, 'paused');
    });

    test('a session resolves the exact deadline ahead of arrival or a pause transition', () => {
        const schedule = { roomId: '101', startTime: '09:00' };
        for (const event of ['entry', 'pause']) {
            const session = new GameSession({ schedule, clock: { startTime: '08:00' } });
            session.start();
            session.setPlayAccess(true, 0);
            equal(session.checkDeadline(59999), false);
            const finished = event === 'entry' ? session.enterRoom('101', 60000) : session.setPlayAccess(false, 60000);
            equal(finished, true);
            equal(session.snapshot(120000).schoolTime, '09:00');
            equal(session.snapshot(120000).arrivedRoomId, null);
            session.setPlayAccess(true, 120000);
            equal(session.phase, 'late');
        }
        const hallway = new GameSession({ destinationRoomId: 'legacy' });
        equal(hallway.destinationRoomId, 'legacy');
        hallway.start();
        hallway.setPlayAccess(true, 0);
        equal(hallway.confirmLegacyArrival(100), true);
        equal(hallway.phase, 'arrived');
        equal(hallway.snapshot(100).schoolTime, null);
    });

    test('WASD moves in the expected directions relative to the starting view', () => {
        for (const [code, offsetX, offsetZ] of [
            ['KeyW', 0, 0.6], ['KeyS', 0, -0.6],
            ['KeyA', 0.6, 0], ['KeyD', -0.6, 0]
        ]) {
            const { player, level } = setup();
            pressKey(player, code);
            player.update(0.1, level);
            near(player.position.x, level.playerStart.x + offsetX);
            near(player.position.z, level.playerStart.z + offsetZ);
        }
    });

    test('one second of movement covers the same distance at 15, 30, 60, and 144 FPS', () => {
        for (const fps of [15, 30, 60, 144]) {
            const { player, level } = setup();
            pressKey(player, 'KeyW');
            for (let frame = 0; frame < fps; frame++) {
                player.update(1 / fps, level);
            }
            near(player.position.z - level.playerStart.z, GAME_CONFIG.moveSpeed);
        }
    });

    test('diagonal movement is normalized and opposite inputs cancel', () => {
        const { player, level } = setup();
        pressKey(player, 'KeyW');
        pressKey(player, 'KeyD');
        player.update(0.1, level);
        const distance = Math.hypot(
            player.position.x - level.playerStart.x,
            player.position.z - level.playerStart.z
        );
        near(distance, 0.6);

        pressKey(player, 'KeyS');
        pressKey(player, 'KeyA');
        const stationary = player.position.clone();
        player.update(0.1, level);
        near(player.position.x, stationary.x);
        near(player.position.z, stationary.z);
    });

    test('releasing a key slows the player consistently across frame rates', () => {
        for (const fps of [30, 60, 144]) {
            const { player, level } = setup();
            pressKey(player, 'KeyW');
            player.update(0.1, level);
            const releasePosition = player.position.z;
            releaseKey(player, 'KeyW');
            for (let frame = 0; frame < fps; frame++) {
                player.update(1 / fps, level);
            }
            near(player.velocity.z, GAME_CONFIG.moveSpeed * Math.exp(-GAME_CONFIG.friction));
            const expectedCoast = GAME_CONFIG.moveSpeed * (1 - Math.exp(-GAME_CONFIG.friction)) / GAME_CONFIG.friction;
            near(player.position.z - releasePosition, expectedCoast);
        }
    });

    test('both layouts map four movement directions and four independent look directions', () => {
        const wasd = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];
        const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        for (const [layout, moveKeys, lookKeys] of [['standard', wasd, arrows], ['swapped', arrows, wasd]]) {
            const controls = { ...DEFAULT_CONTROL_SETTINGS, keyboardLayout: layout };
            for (const [index, offset] of [[0, [0, 0.6]], [1, [0, -0.6]], [2, [0.6, 0]], [3, [-0.6, 0]]]) {
                const { player, level } = setup({ controls });
                const { yaw, pitch } = player;
                pressKey(player, moveKeys[index]);
                player.update(0.1, level);
                near(player.position.x, level.playerStart.x + offset[0]);
                near(player.position.z, level.playerStart.z + offset[1]);
                near(player.yaw, yaw);
                near(player.pitch, pitch);
            }
            const angle = Math.PI / 15;
            for (const [index, yawDelta, pitchDelta] of [[0, 0, angle], [1, 0, -angle], [2, angle, 0], [3, -angle, 0]]) {
                const { player, camera, level } = setup({ controls });
                const { yaw, pitch } = player;
                pressKey(player, lookKeys[index]);
                player.update(0.1, level);
                near(player.yaw, yaw + yawDelta);
                near(player.pitch, pitch + pitchDelta);
                nearVector(player.position, level.playerStart);
                near(cameraRight(camera).y, 0);
            }
        }
    });

    test('keyboard look uses the configured speed at different frame rates and clamps pitch', () => {
        for (const fps of [15, 30, 144]) {
            const controls = { ...DEFAULT_CONTROL_SETTINGS, keyboardLookSpeed: 90, mouseLook: false };
            const { camera, player, level } = setup({ controls });
            player.resetPosition(level.playerStart, null, level);
            player.onMouseMove({ movementX: 500, movementY: 200 });
            pressKey(player, 'ArrowRight');
            advance(player, level, 1, fps);
            nearVector(cameraDirection(camera), { x: 1, y: 0, z: 0 });
            pressKey(player, 'ArrowUp');
            advance(player, level, 1.5, fps);
            near(cameraDirection(camera).y, Math.cos(0.01));
            near(cameraRight(camera).y, 0);
            nearVector(player.position, level.playerStart);
        }
    });

    test('holding movement and keyboard turn follows the same arc across frame rates', () => {
        const samples = [15, 60, 144].map(fps => {
            const { player, level } = setup();
            pressKey(player, 'KeyW');
            pressKey(player, 'ArrowRight');
            advance(player, level, 0.75, fps);
            return player.position;
        });
        for (const sample of samples.slice(1)) {
            near(sample.x, samples[0].x, 0.005);
            near(sample.z, samples[0].z, 0.005);
        }
    });

    test('mouse sensitivity and inversion apply independently of keyboard look and movement', () => {
        for (const keyboardLook of [false, true]) {
            const controls = { ...DEFAULT_CONTROL_SETTINGS, keyboardLook, mouseSensitivity: 2, invertMouseY: true };
            const { camera, player, level } = setup({ controls });
            player.resetPosition(level.playerStart, null, level);
            pressKey(player, 'ArrowLeft');
            player.onMouseMove({ movementX: 100, movementY: 75 });
            player.update(0.1, level);
            near(player.yaw, -0.4 + (keyboardLook ? Math.PI / 15 : 0));
            near(cameraDirection(camera).y, Math.sin(0.3));
            near(cameraRight(camera).y, 0);
            nearVector(player.position, level.playerStart);
            pressKey(player, 'KeyW');
            player.update(0.1, level);
            near(Math.hypot(player.position.x - level.playerStart.x, player.position.z - level.playerStart.z), 0.6);
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
            pressKey(player, 'KeyW');
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
        pressKey(player, 'Space');
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

    test('jump applies launch speed only from support', () => {
        const { player, level } = setup();
        equal(player.isGrounded, true);
        pressKey(player, 'Space');
        equal(player.isGrounded, false);
        const launchSpeed = Math.sqrt(2 * GAME_CONFIG.gravity * GAME_CONFIG.jumpHeight);
        near(player.velocity.y, launchSpeed);
        player.update(0.2, level);
        const risingVelocity = player.velocity.y;
        pressKey(player, 'Space');
        near(player.velocity.y, risingVelocity);
        player.update(0.4, level);
        const fallingVelocity = player.velocity.y;
        equal(fallingVelocity < 0, true);
        pressKey(player, 'Space');
        near(player.velocity.y, fallingVelocity);

        player.update(1, level);
        equal(player.isGrounded, true);
        equal(player.velocity.y, 0);
        pressKey(player, 'Space');
        near(player.velocity.y, launchSpeed);
    });

    test('jump height and air time follow configuration across frame rates', () => {
        const config = { ...GAME_CONFIG, gravity: 13, jumpHeight: 1.4 };
        const apexTime = Math.sqrt(2 * config.jumpHeight / config.gravity);
        for (const framesPerSecond of [15, 30, 60, 144]) {
            const { player, level } = setup({ config });
            pressKey(player, 'Space');
            pressKey(player, 'KeyW');
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

        pressKey(player, 'KeyD');
        player.update(0.1, level);
        equal(player.isGrounded, true);
        player.update(0.2, level);
        equal(player.isGrounded, false);
        equal(player.position.y < platformTop && player.velocity.y < 0, true);
        releaseKey(player, 'KeyD');
        player.update(1, level);
        equal(player.position.y, 0);
        equal(player.isGrounded, true);
    });

    test('a platform can be reached from an airborne approach and blocks walking through its side', () => {
        const platform = { ...ELEVATED_PLATFORM, y: 0.5, height: 0.1 };
        const { player, level } = setup({ platforms: [platform] });
        player.resetPosition({ x: -2.5, y: 0, z: 0 }, null, level);
        pressKey(player, 'KeyD');
        player.update(0.25, level);
        equal(player.position.x <= -1 - GAME_CONFIG.playerRadius, true);
        pressKey(player, 'Space');
        player.update(0.5, level);
        equal(player.position.x > -1 && player.position.y > platform.y + platform.height, true);
        releaseKey(player, 'KeyD');
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
        pressKey(player, 'Space');
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
            pressKey(player, code);
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
        pressKey(player, 'KeyW');
        pressKey(player, 'KeyA');
        player.update(0.5, level);
        equal(player.position.x <= 4.2, true);
        near(player.position.z, 3 / Math.sqrt(2));
    });

    test('the playground gap drops walkers into the pit and can be cleared by jumping', () => {
        const start = { x: 0, y: 0, z: -6.4 };
        const walking = startPlayground(start);
        pressKey(walking.player, 'KeyW');
        advance(walking.player, walking.level, 1.4, 60);
        near(walking.player.position.y, -2);
        equal(walking.player.position.z < -3.5, true);

        const { player, level } = startPlayground(start);
        pressKey(player, 'KeyW');
        pressKey(player, 'Space');
        advance(player, level, 0.27, 60);
        equal(player.position.z > -6 && player.position.z < -3.5, true);
        equal(player.position.y > 0 && !player.isGrounded, true);
        advance(player, level, 0.70, 60);
        equal(player.position.z > -3.5 && player.isGrounded, true);
        near(player.position.y, 0);
    });

    test('walking climbs and descends every stair tread while staying grounded', () => {
        const { player, level } = startPlayground({ x: 0, y: 0, z: 0.2 });
        const walk = (code, rising) => {
            const visited = new Set();
            let previousY = player.position.y;
            pressKey(player, code);
            for (let frame = 0; frame < 57; frame++) {
                player.update(1 / 60, level);
                equal(player.isGrounded, true);
                equal(rising ? player.position.y >= previousY : player.position.y <= previousY, true);
                equal(Math.abs(player.position.y - previousY) <= GAME_CONFIG.maxStepHeight, true);
                equal(level.isBlocked(player.position, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
                visited.add(player.position.y);
                previousY = player.position.y;
            }
            releaseKey(player, code);
            return [...visited];
        };
        equal(walk('KeyW', true).join(','), '0,0.25,0.5,0.75,1,1.25,1.5');
        near(player.position.y, 1.5);
        equal(walk('KeyS', false).join(','), '1.5,1.25,1,0.75,0.5,0.25,0');
        near(player.position.y, 0);
    });

    test('lowering the step limit blocks the first tread and the exact tread height is allowed', () => {
        for (const maxStepHeight of [0.2, 0.25]) {
            const config = { ...GAME_CONFIG, maxStepHeight };
            const { player, level } = startPlayground({ x: 0, y: 0, z: 0.5 }, config);
            pressKey(player, 'KeyW');
            advance(player, level, 0.15, 60);
            near(player.position.y, maxStepHeight === 0.25 ? 0.25 : 0);
            equal(player.isGrounded, true);
            equal(level.isBlocked(player.position, config.playerRadius, config.playerHeight), false);
        }
    });

    test('tall platform faces block walking but players can jump between raised platforms', () => {
        const start = { x: -4.5, y: 0.65, z: 1.7 };
        const walking = startPlayground(start);
        pressKey(walking.player, 'KeyW');
        advance(walking.player, walking.level, 0.8, 60);
        equal(walking.player.position.z < 2.35, true);
        equal(walking.player.position.y < 1.3, true);

        const { player, level } = startPlayground(start);
        pressKey(player, 'KeyW');
        pressKey(player, 'Space');
        advance(player, level, 0.42, 60);
        releaseKey(player, 'KeyW');
        advance(player, level, 0.5, 60);
        near(player.position.y, 1.3);
        equal(player.isGrounded, true);
    });

    test('walking off the elevated deck falls to the lower surface', () => {
        const { player, level } = startPlayground({ x: 0, y: 1.5, z: 7.5 });
        pressKey(player, 'KeyA');
        advance(player, level, 0.25, 60);
        near(player.position.y, 1.5);
        equal(player.isGrounded, true);
        advance(player, level, 0.16, 60);
        equal(player.position.y < 1.5 && player.velocity.y < 0 && !player.isGrounded, true);
        releaseKey(player, 'KeyA');
        advance(player, level, 0.7, 60);
        near(player.position.y, 0);
        equal(player.isGrounded, true);
    });

    test('the low ceiling stops the player head at its visible underside', () => {
        const { player, level } = startPlayground({ x: 4.75, y: 0, z: 2.5 });
        const ceiling = playgroundData.platforms.find(platform => platform.name === 'Low ceiling');
        pressKey(player, 'Space');
        let peak = 0;
        for (let frame = 0; frame < 120; frame++) {
            player.update(1 / 120, level);
            peak = Math.max(peak, player.position.y);
        }
        near(peak + GAME_CONFIG.playerHeight, ceiling.y, 0.001);
        equal(player.isGrounded, true);
        near(player.position.y, 0);
    });

    test('diagonal input slides along high stair sides without clipping', () => {
        const { player, level } = startPlayground({ x: -2, y: 0, z: 3.625 });
        pressKey(player, 'KeyA');
        pressKey(player, 'KeyW');
        for (let frame = 0; frame < 20; frame++) {
            player.update(1 / 60, level);
            equal(level.isBlocked(player.position, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
            near(player.position.y, 0);
        }
        equal(player.position.x <= -1.6 + 1e-9, true);
        equal(player.position.z > 4.8, true);
    });

    test('a stair below a low overhang cannot lift the player into it', () => {
        const { player, level } = setup({ platforms: [
            { x: 0, y: 0, z: 1.5, width: 2, height: 0.25, depth: 1 },
            { x: 0, y: 2, z: 1.5, width: 2, height: 0.25, depth: 1.5 }
        ] });
        player.resetPosition({ x: 0, y: 0, z: 0 }, { x: 0, y: GAME_CONFIG.cameraHeight, z: 1 }, level);
        pressKey(player, 'KeyW');
        player.update(0.4, level);
        near(player.position.y, 0);
        equal(player.position.z <= 0.7 + 1e-9, true);
        equal(player.isGrounded, true);
    });

    test('every playground wireframe uses the exact bounds of its solid collider', () => {
        const { level, scene } = setup({ definition: playgroundData });
        equal(scene.children.length, playgroundData.platforms.length);
        equal(level.solids.length, scene.children.length);
        for (const [index, frame] of scene.children.entries()) {
            const solid = level.solids[index];
            equal(frame.name, playgroundData.platforms[index].name);
            equal(frame.isLineSegments, true);
            const positions = frame.geometry.getAttribute('position');
            equal(positions.count, 24);
            for (const axis of ['X', 'Y', 'Z']) {
                const coordinates = Array.from({ length: positions.count }, (_, vertex) =>
                    positions[`get${axis}`](vertex)
                );
                near(Math.min(...coordinates), solid[`min${axis}`], 1e-6);
                near(Math.max(...coordinates), solid[`max${axis}`], 1e-6);
            }
        }
    });

    test('the open doorway can be walked through and back with continuous floor support', () => {
        const { player, level } = setup({ definition: classroomData });
        equal(level.openDoor({ x: 0, y: 0, z: -1 }), true);
        for (const [code, expectedZ] of [['KeyW', 3], ['KeyS', classroomData.playerStart.z]]) {
            pressKey(player, code);
            for (let frame = 0; frame < 90; frame++) {
                player.update(1 / 60, level);
                equal(player.isGrounded, true);
                near(player.position.y, 0);
                near(player.position.x, 0);
            }
            releaseKey(player, code);
            near(player.position.z, expectedZ);
        }
    });

    test('both sides of the doorway wall block walking from either room', () => {
        for (const x of [-1.4, 1.4]) {
            for (const side of [-1, 1]) {
                const { player, level } = setup({ definition: classroomData });
                equal(level.openDoor({ x: 0, y: 0, z: -1 }), true);
                player.resetPosition({ x, y: 0, z: side * 1.5 }, {
                    x, y: GAME_CONFIG.cameraHeight, z: 4
                }, level);
                pressKey(player, side < 0 ? 'KeyW' : 'KeyS');
                advance(player, level, 0.6, 60);
                const minimumClearance = 0.125 + GAME_CONFIG.playerRadius;
                equal(side * player.position.z >= minimumClearance - 1e-9, true);
                near(player.position.z, side * minimumClearance, 0.06);
                near(player.position.y, 0);
                equal(level.isBlocked(player.position, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
            }
        }
    });

    test('the doorway jamb leaves clearance only where the full player fits', () => {
        for (const [x, fits] of [[0.55, true], [0.75, false]]) {
            const { player, level } = setup({ definition: classroomData });
            equal(level.openDoor({ x: 0, y: 0, z: -1 }), true);
            player.resetPosition({ x, y: 0, z: -2 }, { x, y: GAME_CONFIG.cameraHeight, z: 4 }, level);
            pressKey(player, 'KeyW');
            advance(player, level, 0.6, 60);
            equal(player.position.z > 0, fits);
            equal(level.isBlocked(player.position, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
        }
    });

    test('the closed door stops travel from either side and swings away when opened', () => {
        const { playerRadius, playerHeight } = GAME_CONFIG;
        const definition = classroomData.doors[0];
        for (const side of [-1, 1]) {
            const { player, level, scene } = setup({ definition: classroomData });
            const panel = scene.children.find(object => object.name === definition.name);
            const approach = { x: definition.x, y: definition.y, z: definition.z + side * 2 };
            equal(level.openDoor(approach), false);
            near(panel.rotation.y, 0);
            equal(level.canOpenDoor({ ...approach, z: definition.z + side * definition.interactionRadius }), true);
            player.resetPosition(approach, { ...approach, y: GAME_CONFIG.cameraHeight, z: 4 }, level);
            pressKey(player, side < 0 ? 'KeyW' : 'KeyS');
            advance(player, level, 0.6, 60);
            equal(side * player.position.z >= definition.depth / 2 + playerRadius - 1e-9, true);
            equal(level.openDoor(player.position), true);
            near(panel.rotation.y, side * Math.PI / 2);
            near(panel.position.z, definition.z - side * definition.width / 2);
            equal(level.isBlocked(panel.position, playerRadius, playerHeight), true);
            equal(level.isBlocked(player.position, playerRadius, playerHeight), false);
            equal(level.openDoor(player.position), false);
            advance(player, level, 0.5, 60);
            equal(side * player.position.z < 0 && player.isGrounded, true);
        }
    });

    test('the side classrooms on both floors have matching signs, doors, and arrival volumes', () => {
        equal(new Set(classroomData.classrooms.map(room => room.id)).size, classroomData.classrooms.length);
        for (const door of classroomData.doors.filter(door => door.axis === 'x')) {
            const room = classroomData.classrooms.find(room => room.id === door.roomId);
            const outward = Math.sign(door.x);
            for (const side of [-1, 1]) {
                const { player, level, scene } = setup({ definition: classroomData });
                const plaque = scene.children.find(object => object.name === `Room ${door.roomId}`);
                nearVector(plaque.position, room.sign);
                near(plaque.rotation.y, room.sign.rotationY * Math.PI / 180);
                const approach = { x: door.x + side * outward * 1.4, y: door.y, z: door.z };
                player.resetPosition(approach, { ...approach, y: door.y + GAME_CONFIG.cameraHeight, z: door.z + 1 }, level);
                pressKey(player, side * outward < 0 ? 'KeyA' : 'KeyD');
                advance(player, level, 0.4, 60);
                equal(side * outward * (player.position.x - door.x) >= GAME_CONFIG.playerRadius + door.depth / 2 - 1e-9, true);
                equal(level.getEnteredRoomId(player.position), null);
                equal(level.openDoor(player.position), true);
                equal(level.doors.filter(door => door.isOpen).length, 1);
                advance(player, level, 0.45, 60);
                equal(side * outward * (player.position.x - door.x) < 0 && player.isGrounded, true);
                equal(level.getEnteredRoomId(player.position), side < 0 ? room.id : null);
            }
        }
    });

    test('E selects the nearest closed door when interaction ranges overlap', () => {
        const { level } = setup({ definition: {
            ...classroomData,
            doors: classroomData.doors.map(door => ({ ...door, interactionRadius: 4 }))
        } });
        const approach = { x: -1, y: 0, z: -5 };
        equal(level.openDoor(approach), true);
        equal(level.doors.find(door => door.isOpen).definition.roomId, '002');
        equal(level.doors.filter(door => door.isOpen).length, 1);
    });

    test('the connected route stays grounded on all twelve treads in both directions', () => {
        const expectedHeights = Array.from({ length: 13 }, (_, index) => index * 0.25);
        for (const framesPerSecond of [30, 144]) {
            const { player, level } = setup({ definition: classroomData });
            player.resetPosition({ x: 0, y: 0, z: 9.4 }, { x: 0, y: GAME_CONFIG.cameraHeight, z: 11 }, level);
            for (const [code, heights, targetZ] of [
                ['KeyW', expectedHeights, 21.4],
                ['KeyS', [...expectedHeights].reverse(), 9.4]
            ]) {
                const visited = new Set([player.position.y]);
                pressKey(player, code);
                for (let frame = 0; frame < 2 * framesPerSecond; frame++) {
                    player.update(1 / framesPerSecond, level);
                    equal(player.isGrounded, true);
                    equal(level.isBlocked(player.position, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
                    visited.add(player.position.y);
                }
                releaseKey(player, code);
                equal([...visited].join(','), heights.join(','));
                near(player.position.z, targetZ);
            }
        }
    });

    test('Room 003 has a solid rear wall on both sides of the former stair opening', () => {
        const { player, level } = setup({ definition: classroomData });
        for (const [startZ, key, wallZ, direction] of [
            [7, 'KeyW', 8, 1], [9.4, 'KeyS', 8.25, -1]
        ]) {
            player.resetPosition({ x: 0, y: 0, z: startZ }, { x: 0, y: GAME_CONFIG.cameraHeight, z: startZ + 1 }, level);
            pressKey(player, key);
            advance(player, level, 0.5, 60);
            near(player.position.z, wallZ - direction * GAME_CONFIG.playerRadius, 0.06);
            equal(player.isGrounded, true);
            equal(player.velocity.z, 0);
        }
    });

    test('the stairwell has standing and jumping clearance at every tread and the landing', () => {
        const { level } = setup({ definition: classroomData });
        const { playerRadius, playerHeight, jumpHeight } = GAME_CONFIG;
        const elevatedSurfaces = classroomData.platforms.filter(box =>
            box.name.startsWith('Classroom stair ') || box.name === 'Upper-floor landing'
        );
        const beams = classroomData.platforms.filter(box => box.name.startsWith('Stairwell ') && box.name.endsWith(' beam'));
        equal(elevatedSurfaces.length, 13);
        for (const { x, y, z, height } of elevatedSurfaces) {
            const feet = { x, y: y + height, z };
            equal(level.isBlocked(feet, playerRadius, playerHeight), false);
            const overheadContact = level.getVerticalCollision(feet, feet.y + 10, playerRadius, playerHeight);
            const beam = beams.find(box => Math.abs(z - box.z) < box.depth / 2 + playerRadius);
            near(overheadContact + playerHeight, beam?.y ?? 6.4);
            equal(overheadContact > feet.y + jumpHeight, true);
        }
    });

    test('the upper landing has side walls and opens into the first-floor corridor', () => {
        const { player, level } = setup({ definition: classroomData });
        const { playerRadius } = GAME_CONFIG;
        for (const [code, axis, edge] of [['KeyA', 'x', 1.75], ['KeyD', 'x', -1.75]]) {
            player.resetPosition({ x: 0, y: 3, z: 20 }, { x: 0, y: 4.6, z: 21 }, level);
            pressKey(player, code);
            advance(player, level, 0.7, 60);
            const side = Math.sign(edge);
            const limit = edge - side * playerRadius;
            equal(side * player.position[axis] <= side * limit + 1e-9, true);
            near(player.position[axis], limit, 0.06);
            near(player.position.y, 3);
            equal(player.isGrounded, true);
            equal(player.velocity[axis], 0);
        }
        player.resetPosition({ x: 0, y: 3, z: 20 }, { x: 0, y: 4.6, z: 21 }, level);
        pressKey(player, 'KeyW');
        advance(player, level, 0.7, 60);
        near(player.position.z, 24.2);
        near(player.position.y, 3);
        equal(player.isGrounded, true);
    });

    test('the public west passage and staircase can be walked in both directions with every door closed', () => {
        const { player, level } = setup({ definition: classroomData });
        for (const [axis, target, floor] of [
            ['z', -0.95, 0], ['x', -6.5, 0], ['z', 9.4, 0], ['x', 0, 0], ['z', 24, 3],
            ['z', 9.4, 0], ['x', -6.5, 0], ['z', -0.95, 0], ['x', 0, 0], ['z', -6, 0]
        ]) {
            const distance = target - player.position[axis];
            const code = axis === 'x' ? (distance > 0 ? 'KeyA' : 'KeyD') : (distance > 0 ? 'KeyW' : 'KeyS');
            player.clearInput();
            pressKey(player, code);
            advance(player, level, Math.abs(distance) / GAME_CONFIG.moveSpeed, 60);
            near(player.position[axis], target);
            near(player.position.y, floor);
            equal(player.isGrounded, true);
            equal(level.getEnteredRoomId(player.position), null);
        }
        equal(level.doors.every(door => !door.isOpen), true);
    });

    test('the upper end classroom opens from the corridor and requires the correct floor', () => {
        const { player, level } = setup({ definition: classroomData });
        player.resetPosition({ x: 0, y: 3, z: 30.8 }, { x: 0, y: 4.6, z: 33 }, level);
        equal(level.openDoor(player.position), true);
        pressKey(player, 'KeyW');
        advance(player, level, 0.5, 60);
        equal(level.getEnteredRoomId(player.position), '103');
        equal(level.getEnteredRoomId({ ...player.position, y: 0 }), null);
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
        pressKey(player, 'KeyW');
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

    test('the room registers a whole player inside its open doorway and vertical bounds', () => {
        const { level, scene } = setup({ definition: classroomData });
        const { id, bounds: { x, y, z, width, height, depth } } = classroomData.classrooms[0];
        const { playerRadius, playerHeight } = GAME_CONFIG;
        const center = { x, y, z };
        const entrance = z - depth / 2;
        equal(scene.children.some(object => object.name === 'Classroom destination'), false);
        equal(level.getEnteredRoomId(center), null);
        equal(level.openDoor({ x, y, z: entrance - 1 }), true);
        equal(level.getEnteredRoomId({ x, y, z: entrance }), null);
        equal(level.getEnteredRoomId({ x, y, z: entrance + playerRadius - 0.01 }), null);
        equal(level.getEnteredRoomId({ x, y, z: entrance + playerRadius }), id);
        equal(level.getEnteredRoomId({ ...center, x: x + width / 2 - playerRadius + 0.01 }), null);
        equal(level.getEnteredRoomId({ ...center, z: z + depth / 2 - playerRadius + 0.01 }), null);
        equal(level.getEnteredRoomId({ ...center, y: y + height - playerHeight }), id);
        equal(level.getEnteredRoomId({ ...center, y: y + height - playerHeight + 0.01 }), null);
        equal(level.getEnteredRoomId({ ...center, y: y - 0.01 }), null);
        equal(level.getEnteredRoomId({ x, y: 3, z: 17.5 }), null);
        equal(level.canConfirmArrival(center), false);
        equal(level.isBlocked(center, playerRadius, playerHeight), false);
        level.build(scene);
        equal(level.getEnteredRoomId(center), null);
    });

    test('the corridor signs face both approaches and follow the fixed room order', () => {
        const { level, scene } = setup({ definition: classroomData });
        const [origin, farEnd] = classroomData.signs;
        const doors = new Map(classroomData.doors.map(door => [door.roomId, door]));
        for (const [prefix, reference, floor] of [['0', origin, 0], ['1', classroomData.signs.find(sign => sign.name === 'First-floor landing'), 3]]) {
            const east = doors.get(prefix + '01');
            const west = doors.get(prefix + '02');
            const end = doors.get(prefix + '03');
            equal(reference.z < east.z, true);
            equal(east.z, west.z);
            equal(east.x > 0 && west.x < 0, true);
            equal(end.z > west.z, true);
            equal([east, west, end].every(door => door.y === floor), true);
        }
        for (const sign of [origin, farEnd]) {
            const plaque = scene.children.find(object => object.name === sign.name);
            nearVector(plaque.position, sign);
            near(plaque.rotation.y, sign.rotationY * Math.PI / 180);
        }
        const withoutSigns = setup({ definition: { ...classroomData, signs: [] } });
        equal(level.solids.length, withoutSigns.level.solids.length);
        level.toggleDebugView();
        equal(scene.children.find(object => object.name === origin.name).visible !== false, true);
        equal(scene.children.find(object => object.name === farEnd.name).visible !== false, true);
    });

    test('level lighting creates fixtures, scopes shadows to solid view, and disposes resources on rebuild', () => {
        const scene = new THREE.Scene();
        const renderer = { shadowMap: {} };
        const manager = new LightingManager(scene, renderer);
        manager.register('world', { lights: DEFAULT_LEVEL_LIGHTS });
        equal(manager.lights.length, 2);
        equal(renderer.shadowMap.enabled, false);
        const fallback = [...manager.lights];

        manager.release('world');
        manager.register('school', classroomData.lighting);
        equal(fallback.some(light => scene.children.includes(light)), false);
        equal(manager.lights.filter(light => light.castShadow).length, 3);
        const light = manager.lights.find(light => light.castShadow);
        const config = classroomData.lighting.lights.find(definition => definition.shadow);
        nearVector(light.position, config.position);
        nearVector(light.target.position, config.target);
        equal(light.shadow.mapSize.x, config.shadow.mapSize);
        for (const name of ['Corridor window daylight', 'Room 101 window daylight']) {
            const daylight = manager.lights.find(light => light.name === name);
            equal(daylight.castShadow, true);
            equal(daylight.shadow.mapSize.x, 512);
        }
        equal(renderer.shadowMap.type, THREE.PCFSoftShadowMap);
        equal(renderer.shadowMap.enabled, true);
        equal(manager.fixtures.length, classroomData.lighting.fixtures.length);
        const fixture = manager.fixtures[0];
        equal(scene.children.includes(fixture), true);
        equal(fixture.castShadow === true, false);
        manager.setDebugView(true);
        equal(renderer.shadowMap.enabled, false);
        equal(fixture.visible, false);
        manager.setDebugView(false);
        equal(renderer.shadowMap.enabled, true);
        equal(fixture.visible, true);

        let fixtureDisposals = 0;
        let shadowDisposals = 0;
        fixture.geometry.addEventListener('dispose', () => fixtureDisposals++);
        fixture.material.addEventListener('dispose', () => fixtureDisposals++);
        light.shadow.map = { dispose() { shadowDisposals++; } };
        manager.release('school');
        manager.setDebugView(true);
        manager.register('school', classroomData.lighting);
        equal(shadowDisposals, 1);
        equal(fixtureDisposals, 2);
        equal(scene.children.includes(light.target), false);
        equal(scene.children.includes(fixture), false);
        equal(renderer.shadowMap.enabled, false);
        equal(scene.children.filter(child => child.name === fixture.name).length, 1);
    });

    test('level settings select furniture, doors and structural surfaces for shadows', () => {
        const { level, scene } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        equal(find('Classroom door').castShadow, true);
        equal(find('Classroom floor').receiveShadow, true);
        equal(find('Classroom west wall').receiveShadow, true);
        equal(find('Room 003 back east inner desk top').castShadow, true);
        equal(find('Room 003 whiteboard frame').castShadow, false);
        const original = find('Classroom door');
        equal(level.openDoor({ x: 0, y: 0, z: -1 }), true);
        equal(find('Classroom door'), original);
        equal(original.castShadow, true);
        near(original.rotation.y, -Math.PI / 2);
    });

    test('all six furniture types follow placement, orientation, and collision settings', () => {
        const factory = new EnvironmentObjectFactory();
        for (const type of ['studentDesk', 'studentChair', 'teacherDesk', 'whiteboard', 'locker', 'bench']) {
            const [part] = factory.create({ type, x: 1, y: 3, z: 2, rotationY: 90 });
            near(part.surface.position.x, 1);
            near(part.surface.position.z, 2);
            equal(part.surface.position.y > 3, true);
            near(part.surface.rotation.y, Math.PI / 2);
            equal(part.bounds !== null, type !== 'whiteboard');
        }
        const [original] = factory.create({ type: 'studentDesk', x: 1, z: 2 });
        const [moved] = factory.create({ type: 'studentDesk', x: 5, z: 9, collidable: false, color: '#cc8844' });
        near(moved.surface.position.x - original.surface.position.x, 4);
        near(moved.surface.position.z - original.surface.position.z, 7);
        equal(original.surface.geometry === moved.surface.geometry, true);
        equal(original.surface.material === moved.surface.material, false);
        equal(moved.bounds, null);
    });

    test('walking passes decorative furniture and stops when the same object is made solid', () => {
        for (const collidable of [false, true]) {
            const { level, player } = setup({ definition: {
                ...levelData,
                environmentObjects: [{ type: 'whiteboard', x: 0, z: -10, collidable }]
            } });
            pressKey(player, 'KeyW');
            advance(player, level, 0.75, 60);
            equal(player.position.z < -10, collidable);
            equal(player.isGrounded, true);
        }
    });

    test('Room 003 keeps its center and cross aisles walkable around solid desks and chairs', () => {
        const { level, player } = setup({ definition: classroomData });
        function faceIntoRoom(x, z) {
            player.resetPosition({ x, y: 0, z }, { x, y: GAME_CONFIG.cameraHeight, z: z + 1 }, level);
        }
        function walk(code, duration) {
            pressKey(player, code);
            advance(player, level, duration, 60);
            releaseKey(player, code);
        }

        faceIntoRoom(0, -1);
        equal(level.openDoor(player.position), true);
        walk('KeyW', 3);
        equal(level.getEnteredRoomId(player.position), '003');
        near(player.position.z, 8 - GAME_CONFIG.playerRadius, 1e-4);
        equal(player.isGrounded, true);

        faceIntoRoom(0, 3.625);
        walk('KeyA', 2);
        near(player.position.x, 5 - GAME_CONFIG.playerRadius, 1e-4);
        walk('KeyD', 4);
        near(player.position.x, -5 + GAME_CONFIG.playerRadius, 1e-4);

        faceIntoRoom(1.7, 1.5);
        walk('KeyW', 1);
        near(player.position.z, 2.25 - 0.22 - GAME_CONFIG.playerRadius, 0.05);
        faceIntoRoom(1.7, 3.625);
        walk('KeyS', 1);
        near(player.position.z, 2.95 + 0.275 + GAME_CONFIG.playerRadius, 0.05);
    });

    test('corridor lockers and bench have solid bounds and leave the corridor center open', () => {
        const { level, scene } = setup({ definition: classroomData });
        const blocked = (x, z) => level.isBlocked({ x, y: 0, z }, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight);
        for (const name of ['Corridor locker 1 cabinet', 'Corridor locker 2 cabinet',
            'Corridor locker 3 cabinet', 'Corridor bench seat']) {
            const { position } = scene.children.find(object => object.name === name);
            equal(blocked(position.x, position.z), true);
            equal(blocked(0, position.z), false);
        }
    });

    test('furniture shares resources and rebuild disposes them once while keeping debug view', () => {
        const { level, scene } = setup({ definition: classroomData });
        const desk = name => scene.children.find(object => object.name === `Room 003 ${name} desk top`);
        const original = desk('back east inner');
        equal(original.geometry === desk('back west inner').geometry, true);
        equal(original.material === desk('back west inner').material, true);
        let geometryDisposals = 0;
        let materialDisposals = 0;
        original.geometry.addEventListener('dispose', () => geometryDisposals++);
        original.material.addEventListener('dispose', () => materialDisposals++);
        const count = scene.children.length;
        level.toggleDebugView();
        equal(original.visible, false);
        equal(scene.children.find(object => object.name === `${original.name} collision`).visible, true);
        equal(scene.children.find(object => object.name === 'Room 003 whiteboard frame').visible !== false, true);
        level.build(scene);
        equal(geometryDisposals, 1);
        equal(materialDisposals, 1);
        equal(scene.children.includes(original), false);
        equal(scene.children.length, count);
        equal(desk('back east inner').visible, false);
        equal(scene.children.find(object => object.name === `${original.name} collision`).visible, true);
    });

    test('GLB furniture shares resources across instances and rebuilds with rotated collision bounds', () => {
        const { level, scene, player } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        const firstMesh = group => {
            let mesh;
            group.traverse(node => {
                if (node.isMesh) {
                    mesh ??= node;
                }
            });
            return mesh;
        };
        const desk = find('Room 003 back east outer desk');
        const chair = find('Room 003 back east outer chair');
        const deskMesh = firstMesh(desk);
        const otherDeskMesh = firstMesh(find('Room 003 back west outer desk'));
        equal(deskMesh === otherDeskMesh, false);
        equal(deskMesh.geometry === otherDeskMesh.geometry, true);
        equal(deskMesh.material === otherDeskMesh.material, true);
        equal(deskMesh.castShadow && deskMesh.receiveShadow, true);
        equal(firstMesh(chair).material === firstMesh(find('Room 003 back west outer chair')).material, true);

        const placement = classroomData.environmentObjects.find(object => object.name === chair.name);
        const factory = new EnvironmentObjectFactory(models, classroomData.modelCatalog);
        const [{ bounds: straight }] = factory.create({ ...placement, rotationY: 180 });
        const [{ bounds: turned }] = factory.create({ ...placement, x: 10, y: 2, z: 20, rotationY: 270 });
        near(turned.maxX - turned.minX, straight.maxZ - straight.minZ);
        near(turned.maxZ - turned.minZ, straight.maxX - straight.minX);
        near(turned.minY, 2);
        near(turned.minX - 10, straight.minZ - placement.z);
        equal(factory.create({ ...placement, collidable: false })[0].bounds, null);

        level.openDoor({ x: 0, y: 0, z: -1 });
        player.resetPosition({ x: 3.5, y: 0, z: 1.4 }, { x: 3.5, y: GAME_CONFIG.cameraHeight, z: 5 }, level);
        pressKey(player, 'KeyW');
        advance(player, level, 0.8, 60);
        near(player.position.z, straight.minZ - GAME_CONFIG.playerRadius, 0.05);

        let disposals = 0;
        deskMesh.geometry.addEventListener('dispose', () => disposals++);
        deskMesh.material.addEventListener('dispose', () => disposals++);
        level.toggleDebugView();
        const outline = find(`${desk.name} collision`);
        equal(desk.visible, false);
        equal(outline.visible, true);
        outline.geometry.addEventListener('dispose', () => disposals++);
        level.build(scene);
        equal(disposals, 1);
        equal(scene.children.includes(desk), false);
        equal(firstMesh(find(desk.name)).geometry === deskMesh.geometry, true);
        equal(firstMesh(find(desk.name)).material === deskMesh.material, true);
        equal(find(desk.name).visible, false);
        equal(find(outline.name).visible, true);
    });

    test('catalog defaults can replace a model and placements can override scale, facing, and collision', () => {
        const catalog = classroomData.modelCatalog;
        const factory = new EnvironmentObjectFactory(models, catalog);
        const placement = { asset: 'studentChair', type: 'studentChair', x: 1, y: 2, z: 3, rotationY: 180 };
        const [chair] = factory.create(placement);
        const [larger] = factory.create({ ...placement, scale: 1.5, rotationOffset: -90 });
        near(chair.surface.rotation.y, 0);
        near(larger.surface.rotation.y, Math.PI / 2);
        near(larger.bounds.minY, 2);
        near(larger.bounds.maxY - 2, (chair.bounds.maxY - 2) * 1.5);
        near(larger.bounds.maxX - larger.bounds.minX, (chair.bounds.maxZ - chair.bounds.minZ) * 1.5);
        const replacement = { ...catalog.studentChair, model: catalog.studentDesk.model };
        const swappedFactory = new EnvironmentObjectFactory(models, { ...catalog, studentChair: replacement });
        const [swapped] = swappedFactory.create(placement);
        const [explicit] = factory.create({ ...placement, model: catalog.studentDesk.model, collidable: false });
        near(swapped.bounds.maxY - swapped.bounds.minY, new THREE.Box3().setFromObject(explicit.surface).max.y - 2);
        equal(explicit.bounds, null);
        equal(factory.create({ type: 'studentChair', x: 0, z: 0 })[0].surface.isGroup === true, false);
    });

    test('reused vaulted bays leave the hall route open and the oak leaf still matches its collider', () => {
        const { level, scene } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        const arch = find('Vaulted hall near rib vault');
        const farArch = find('Vaulted hall far rib vault');
        function firstGeometry(group) {
            let geometry;
            group.traverse(node => { geometry ??= node.geometry; });
            return geometry;
        }
        equal(Boolean(firstGeometry(arch)), true);
        equal(firstGeometry(arch) === firstGeometry(farArch), true);
        equal(new THREE.Box3().setFromObject(arch).max.y > 9.5, true);
        const { playerRadius, playerHeight } = GAME_CONFIG;
        for (const z of [22.32, 24.5, 27, 29.5]) {
            equal(level.isBlocked({ x: 0, y: 4, z }, playerRadius, playerHeight), false);
        }
        equal(level.isBlocked({ x: 1.8, y: 3, z: 24.5 }, playerRadius, playerHeight), true);
        const wall = find('Vaulted hall east wall before doorway');
        const wallBox = new THREE.Box3().setFromObject(wall);
        near(wallBox.max.x - wallBox.min.x, 0.8, 1e-6);
        const farWall = find('Vaulted hall west wall after doorway');
        near(new THREE.Box3().setFromObject(farWall).max.x, -2, 1e-6);
        equal(firstGeometry(wall), firstGeometry(farWall));
        for (const materialName of ['Aged lime plaster', 'Panelled oak', 'Weathered masonry']) {
            let textured = false;
            wall.traverse(node => { textured ||= node.material?.name === materialName && Boolean(node.material.map); });
            equal(textured, true);
        }
        for (const name of ['Vaulted hall near oak floor', 'Vaulted hall far oak floor']) {
            const floor = find(name);
            near(floor.position.y + floor.geometry.parameters.height / 2, 3);
            equal(floor.geometry.parameters.width, 4);
            equal(floor.geometry.parameters.depth, 5);
            equal(floor.material.name, 'Worn oak');
        }

        const { definition, panel, wireframe } = level.doors.find(door => door.definition.roomId === '101');
        const leaf = panel.children[0];
        const box = new THREE.Box3().setFromObject(leaf);
        near(box.max.x - box.min.x, definition.width, 1e-6);
        near(box.max.y - box.min.y, definition.height + Math.max(...classroomData.doorProfiles[definition.arch].rise), 1e-6);
        near(box.max.z - box.min.z, definition.depth, 1e-6);
        equal(panel.material.visible, false);
        equal(level.openDoor({ x: 1.6, y: 3, z: 27 }), true);
        nearVector(panel.position, wireframe.position);
        near(panel.rotation.y, wireframe.rotation.y);
        level.toggleDebugView();
        equal(panel.visible, false);
        equal(wireframe.visible, true);
        equal(arch.visible, false);
        equal(find('Vaulted hall pointed stair portal collision').visible, true);
        equal(find('Room 102 mullioned window sample collision').visible, true);
    });

    test('the console and green chair fit the side of the hall below the signs', () => {
        const { level, scene } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        const sign = classroomData.signs.find(sign => sign.name === 'Stairs from first floor');
        const { playerRadius, playerHeight } = GAME_CONFIG;
        level.toggleDebugView();
        const [consoleBox, chairBox] = ['Hallway console', 'Green hallway chair'].map(name => {
            const surface = find(name);
            const box = new THREE.Box3().setFromObject(surface);
            near(box.min.y, 3);
            equal(box.min.x > 0.8 + playerRadius && box.max.x < 2, true);
            equal(box.max.y < sign.y - sign.height / 2, true);
            equal(box.max.z < 26.1 - playerRadius, true);
            equal(level.isBlocked(surface.position, playerRadius, playerHeight), true);
            equal(level.isBlocked({ x: 0.8, y: 3, z: surface.position.z }, playerRadius, playerHeight), false);
            equal(find(`${name} collision`).visible, true);
            return box;
        });
        const consoleHeight = consoleBox.max.y - consoleBox.min.y;
        const chairHeight = chairBox.max.y - chairBox.min.y;
        equal(chairHeight > consoleHeight * 1.3, true);
        equal(chairBox.max.z < consoleBox.min.z, true);
    });

    test('historic finishes reuse model materials across geometry and restart without changing route clearance', () => {
        const { level, scene } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        const namedFinish = name => level.finishMaterials.get(name);
        equal(find('Classroom stair 1').material, find('Classroom stair 12').material);
        equal(find('Room 101 flagstone threshold').getObjectByProperty('isMesh', true).material, namedFinish('flagstones'));
        equal(find('Vaulted hall near oak floor').material, find('First-floor Room 101 floor').material);
        equal(find('Classroom stair 1').material, namedFinish('stairLimestone'));
        equal(find('Stairwell ceiling').material.name, 'Limewashed masonry');
        equal(find('Stairwell east wall').material, find('First-floor Room 101 outer wall').material);
        equal(find('Room 101 center oak beam').material, find('First-floor Room 101 floor').material);
        const floor = find('First-floor Room 101 floor');
        const uvs = floor.geometry.getAttribute('uv');
        const normals = floor.geometry.getAttribute('normal');
        const coordinates = Array.from({ length: uvs.count }, (_, index) => index);
        const maxU = Math.max(...coordinates.filter(index => normals.getY(index) === 1).map(index => uvs.getX(index)));
        near(maxU, 7.25 / classroomData.surfaceFinishes.oakBoards.tileWidth, 1e-6);
        const material = floor.material;
        const texture = material.map;
        let disposals = 0;
        material.addEventListener('dispose', () => disposals++);
        texture.addEventListener('dispose', () => disposals++);
        level.toggleDebugView();
        equal(floor.visible, false);
        equal(find('First-floor Room 101 floor collision').visible, true);
        equal(find('Room 101').visible !== false, true);
        level.build(scene);
        equal(find('First-floor Room 101 floor').material, material);
        equal(disposals, 0);
        const { playerRadius, playerHeight } = GAME_CONFIG;
        equal(level.openDoor({ x: 1.6, y: 3, z: 27 }), true);
        equal(level.isBlocked({ x: 3.13, y: 3, z: 27 }, playerRadius, playerHeight), false);
        equal(level.getEnteredRoomId({ x: 3.13, y: 3, z: 27 }), '101');
        equal(level.isBlocked({ x: 5.02, y: 4, z: 26.9 }, playerRadius, playerHeight), false);
        const studentGeometry = find('Room 102 north student chair').getObjectByProperty('isMesh', true).geometry;
        for (const side of ['west', 'east']) {
            const chair = find(`Room 101 ${side} student chair`);
            equal(chair.getObjectByProperty('isMesh', true).geometry, studentGeometry);
            near(chair.rotation.y, 0);
            const chairBounds = new THREE.Box3().setFromObject(chair);
            const deskBounds = new THREE.Box3().setFromObject(find(`Room 101 ${side} student desk`));
            near(chairBounds.min.y, 3);
            equal(chairBounds.max.z < deskBounds.min.z, true);
        }
    });

    test('the portrait and college notices are wall decorations with no colliders', () => {
        const { level, scene } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        const portrait = find('Hall portrait of John Locke');
        const board = find('College notices');
        const canvas = portrait.getObjectByProperty('isMesh', true).geometry;
        let disposed = false;
        board.material.map.addEventListener('dispose', () => { disposed = true; });
        const withoutDecorations = setup({ definition: {
            ...classroomData,
            environmentObjects: classroomData.environmentObjects.filter(item => item.name !== portrait.name),
            signs: classroomData.signs.filter(item => item.name !== board.name)
        } });
        equal(level.solids.length, withoutDecorations.level.solids.length);
        level.toggleDebugView();
        equal(find(`${portrait.name} collision`), undefined);
        equal(find(`${board.name} collision`), undefined);
        level.build(scene);
        equal(disposed, true);
        equal(find(portrait.name).getObjectByProperty('isMesh', true).geometry, canvas);
    });

    test('the two windows open the wall through to their glazing and prevent jumping out', () => {
        const { level, player, scene } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === name);
        const { playerRadius, playerHeight, cameraHeight } = GAME_CONFIG;
        const corridorFrame = find('Corridor mullioned window');
        const classroomFrame = find('Room 101 mullioned window');
        equal(corridorFrame.getObjectByProperty('isMesh', true).geometry,
            classroomFrame.getObjectByProperty('isMesh', true).geometry);
        for (const [name, innerWall, centerZ] of [['Corridor', 2, 31.04], ['Room 101', 7.25, 27.75]]) {
            const pane = find(`${name} window glazing`);
            const inside = { x: innerWall + 0.04, y: 4, z: centerZ };
            equal(level.isBlocked(inside, 0.04, playerHeight), false);
            equal(level.isBlocked({ ...inside, y: 3.1 }, 0.04, playerHeight), true);
            equal(level.isBlocked({ ...inside, z: centerZ + 0.73 }, 0.04, playerHeight), true);
            equal(level.isBlocked({ ...inside, x: pane.position.x }, playerRadius, playerHeight), true);
            equal(pane.castShadow, false);
            const start = { x: innerWall - 0.57, y: 3, z: centerZ };
            player.resetPosition(start, { x: innerWall + 3, y: 3 + cameraHeight, z: centerZ }, level);
            pressKey(player, 'KeyW');
            pressKey(player, 'Space');
            let furthest = start.x;
            for (let frame = 0; frame < 72; frame++) {
                player.update(1 / 60, level);
                furthest = Math.max(furthest, player.position.x);
            }
            equal(furthest > innerWall - playerRadius, true);
            equal(furthest <= pane.position.x - pane.geometry.parameters.width / 2 - playerRadius + 1e-6, true);
        }
        level.toggleDebugView();
        equal(find('Quadrangle east gateway').visible, false);
        equal(find('Corridor window glazing collision').visible, true);
        equal(find('Room 101 window glazing collision').visible, true);
    });

    test('arched doors preserve their base hinge pose and expose an open crown above the original opening', () => {
        const { level } = setup({ definition: classroomData });
        for (const [roomId, approach, center, shoulder] of [
            ['101', { x: 1.6, y: 3, z: 27 }, { x: 2.5, y: 3, z: 27 }, { x: 2.5, y: 3, z: 26.17 }],
            ['103', { x: 0, y: 3, z: 30.9 }, { x: 0, y: 3, z: 32 }, { x: 0.83, y: 3, z: 32 }]
        ]) {
            const door = level.doors.find(entry => entry.definition.roomId === roomId);
            equal(level.isBlocked(center, 0.05, 2.45), true);
            const { panel, parts } = door;
            equal(parts.length > 1, true);
            equal(level.openDoor(approach), true);
            const swing = roomId === '101'
                ? { x: 3.4, y: 4.125, z: 27.9 }
                : { x: -0.9, y: 4.125, z: 32.9 };
            nearVector(panel.position, swing);
            for (const { wireframe } of parts) {
                nearVector(wireframe.position, panel.position);
                near(wireframe.rotation.y, panel.rotation.y);
            }
            equal(level.isBlocked(center, 0.05, 2.45), false);
            equal(level.isBlocked(shoulder, 0.05, 2.45), true);
            equal(level.isBlocked(center, 0.05, 2.9), true);
        }
        equal(level.doors.find(door => door.definition.roomId === '003').parts.length, 1);
    });

    test('Room 102 keeps its doorway and center aisle clear of imported furniture', () => {
        const { level, scene, player } = setup({ definition: classroomData });
        const find = name => scene.children.find(object => object.name === `Room 102 ${name}`);
        for (const name of ['north student desk', 'south student desk', 'north student chair', 'south student chair',
            'teacher desk', 'standing chalkboard', 'wooden display shelves']) {
            const surface = find(name);
            const box = new THREE.Box3().setFromObject(surface);
            near(box.min.y, 3);
            equal(box.min.x >= -7.25 && box.max.x <= -2.25, true);
            equal(box.min.z >= 24 && box.max.z <= 30, true);
            equal(Boolean(find(`${name} collision`)), true);
        }
        const bookGroup = find('shelf books');
        const books = new THREE.Box3().setFromObject(bookGroup);
        const shelf = new THREE.Box3().setFromObject(find('wooden display shelves'));
        equal(shelf.containsBox(books), true);
        const shelfCenterX = (shelf.min.x + shelf.max.x) / 2;
        const dividerOffsets = [-0.176, 0.176];
        bookGroup.traverse(mesh => {
            if (mesh.isMesh) {
                const book = new THREE.Box3().setFromObject(mesh);
                for (const offset of dividerOffsets) {
                    const divider = shelfCenterX + offset;
                    equal(book.max.x < divider - 0.011 || book.min.x > divider + 0.011, true);
                }
            }
        });
        equal(Boolean(find('shelf books collision')), false);
        near(find('north student chair').rotation.y, -Math.PI / 2);
        near(scene.children.find(object => object.name === 'Room 003 back east outer chair').rotation.y, 0);

        player.resetPosition({ x: -1.5, y: 3, z: 27 }, { x: -7, y: 4.6, z: 27 }, level);
        equal(level.openDoor(player.position), true);
        pressKey(player, 'KeyW');
        advance(player, level, 0.65, 60);
        equal(level.getEnteredRoomId(player.position), '102');
        equal(player.position.x < -5, true);
        equal(player.isGrounded, true);
    });

    test('classroom surfaces and debug outlines match their colliders without replacing them', () => {
        const { level, scene } = setup({ definition: classroomData });
        const colliders = [...level.solids];
        const pairs = level.renderPairs;
        const sign = scene.children.find(object => object.name === `Room ${classroomData.schedule.roomId}`);
        equal(pairs.length, colliders.length);
        const matchBounds = ({ surface, wireframe, partial }, collider) => {
            const positions = wireframe.geometry.getAttribute('position');
            const sin = Math.sin(wireframe.rotation.y);
            const cos = Math.cos(wireframe.rotation.y);
            const modelBox = surface.isGroup ? new THREE.Box3().setFromObject(surface) : null;
            const { width, height, depth } = surface.geometry?.parameters ?? {};
            const surfaceSin = Math.abs(Math.sin(surface.rotation.y));
            const surfaceCos = Math.abs(Math.cos(surface.rotation.y));
            const worldWidth = surfaceCos * width + surfaceSin * depth;
            const worldDepth = surfaceSin * width + surfaceCos * depth;
            const vertices = Array.from({ length: positions.count }, (_, vertex) => {
                const x = positions.getX(vertex);
                const z = positions.getZ(vertex);
                return {
                    x: x * cos + z * sin + wireframe.position.x,
                    y: positions.getY(vertex) + wireframe.position.y,
                    z: z * cos - x * sin + wireframe.position.z
                };
            });
            for (const [axis, size] of [['X', worldWidth], ['Y', height], ['Z', worldDepth]]) {
                const coordinate = axis.toLowerCase();
                if (!partial) {
                    near(modelBox?.min[coordinate] ?? surface.position[coordinate] - size / 2, collider[`min${axis}`]);
                    near(modelBox?.max[coordinate] ?? surface.position[coordinate] + size / 2, collider[`max${axis}`]);
                }
                const values = vertices.map(vertex => vertex[coordinate]);
                // Wireframe coordinates are stored as 32-bit floats.
                near(Math.min(...values), collider[`min${axis}`], 2e-6);
                near(Math.max(...values), collider[`max${axis}`], 2e-6);
            }
        };
        const transparentNames = classroomData.platforms.filter(platform => platform.opacity !== undefined).map(platform => platform.name);
        for (const [index, { surface, wireframe, partial }] of pairs.entries()) {
            matchBounds({ surface, wireframe, partial }, colliders[index]);
            equal(surface.visible, true);
            equal(surface.material?.transparent === true, transparentNames.includes(surface.name));
            equal(wireframe.visible, false);
        }
        const signVisibility = sign.visible;
        equal(level.toggleDebugView(), true);
        equal(pairs.every(({ surface, wireframe }) => !surface.visible && wireframe.visible), true);
        equal(level.solids.every((collider, index) => collider === colliders[index]), true);
        equal(sign.visible, signVisibility);
        equal(level.toggleDebugView(), true);
        equal(pairs.every(({ surface, wireframe }) => surface.visible && !wireframe.visible), true);
        for (const { definition, solidIndex, parts } of level.doors) {
            equal(level.openDoor(definition), true);
            for (let index = solidIndex; index < solidIndex + parts.length; index++) {
                matchBounds(pairs[index], level.solids[index]);
            }
        }
        equal(setup().level.toggleDebugView(), false);
        equal(setup({ definition: playgroundData }).level.toggleDebugView(), false);
    });

    test('the debug door follows its open panel and the selected view survives restart', () => {
        const { level, scene } = setup({ definition: classroomData });
        equal(level.toggleDebugView(), true);
        equal(level.openDoor({ x: 0, y: 0, z: -1 }), true);
        const { panel, wireframe, solidIndex } = level.doors[0];
        nearVector(wireframe.position, panel.position);
        near(wireframe.rotation.y, panel.rotation.y);
        near(level.solids[solidIndex].minZ, 0);
        equal(wireframe.visible, true);
        equal(panel.visible, false);
        level.build(scene);
        equal(level.debugView, true);
        equal(level.doors[0].isOpen, false);
        equal(level.doors[0].wireframe.visible, true);
        equal(scene.children.includes(wireframe), false);
        equal(scene.children.includes(panel), false);
    });

    test('a room reports its own identifier independently of the scheduled destination', () => {
        const [room] = classroomData.classrooms;
        const [door] = classroomData.doors;
        const { id, bounds: { x, y, z } } = room;
        const position = { x, y, z };
        const otherDestination = setup({ definition: {
            ...classroomData, schedule: { ...classroomData.schedule, roomId: 'other' }, destinationRoomId: id
        } });
        equal(otherDestination.level.openDoor(door), true);
        equal(otherDestination.level.getEnteredRoomId(position), id);
        const { classrooms, doors, ...singleRoomLevel } = classroomData;
        const renamed = setup({ definition: {
            ...singleRoomLevel,
            schedule: { ...classroomData.schedule, roomId: 'A1' },
            door: { ...door, roomId: 'A1' },
            classroom: { ...room, id: 'A1' }
        } });
        equal(renamed.level.openDoor(door), true);
        equal(renamed.level.getEnteredRoomId(position), 'A1');
        equal(renamed.scene.children.some(object => object.name === 'Room A1'), true);
    });

    test('classroom interaction is out of range at spawn and reachable inside the far wall', () => {
        const { player, level } = setup();
        const { x, z, interactionRadius } = levelData.classroom;
        equal(level.canConfirmArrival(player.position), false);
        equal(level.canConfirmArrival({ x, y: 0, z: z - interactionRadius - 0.01 }), false);
        const approach = { x, y: 0, z: z - interactionRadius + 0.01 };
        equal(level.canConfirmArrival(approach), true);
        equal(level.isBlocked(approach, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight), false);
    });
}
