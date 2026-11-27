// Exercise the shipped school through the same spatial queries used by Player.
function registerFirstCourtTests(test, manifest, levelsUrl) {
    function check(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    async function withSchool(run) {
        const world = new World(schoolFromManifest(manifest), GAME_CONFIG, levelsUrl);
        const scene = new THREE.Scene();
        try {
            world.attach(scene, new LightingManager(scene, { shadowMap: {} }));
            await Promise.all([...world.areas.keys()].map(id => world.loadArea(id)));
            for (const id of world.areas.keys()) {
                world.activateArea(id);
            }
            run(world, scene);
        } finally {
            world.dispose();
        }
    }

    test('First Court registers reciprocal links and rejects broken paths to the scheduled room', () => {
        const school = schoolFromManifest(manifest);
        const { areas, rooms } = registerSchoolAreas(school);
        check(rooms.get(manifest.challenge.schedule.roomId) === 'east-range', 'Missing East Range room');
        for (const { from, to } of manifest.connections) {
            check(areas.get(from).neighbors.includes(to) && areas.get(to).neighbors.includes(from), 'One-way link');
        }
        const [ab, bc] = manifest.connections;
        for (const [connections, expected] of [
            [[ab], /Unreachable scheduled room/],
            [[ab, bc, ab], /Invalid school connection/],
            [[ab, { ...bc, to: 'missing' }], /Invalid school connection/],
            [[ab, { ...bc, approachFrom: [0, 1, 2] }], /Invalid school connection/],
            [[ab, { ...bc, approachFrom: [0, 8, 8, 36] }], /Streaming regions must cover/],
            [[ab, { ...bc, aperture: { ...bc.aperture, max: bc.aperture.min } }], /Invalid school connection/]
        ]) {
            let message = '';
            try {
                schoolFromManifest({ ...manifest, connections });
            } catch (error) {
                message = error.message;
            }
            check(expected.test(message), 'Invalid graph accepted or incorrect error: ' + message);
        }
        for (const mutate of [
            data => { data.areas[1].id = data.areas[0].id; },
            data => { data.areas[1].required = []; },
            data => { data.areas[1].definition.rooms[0].id = data.areas[0].definition.rooms[0].id; },
            data => { data.challenge.schedule.roomId = 'unknown-room'; },
            data => { data.challenges.latin.schedule.roomId = 'old-library'; }
        ]) {
            const invalid = JSON.parse(JSON.stringify(manifest));
            mutate(invalid);
            let accepted = false;
            try {
                registerSchoolAreas(schoolFromManifest(invalid));
                accepted = true;
            } catch (error) {
                check(/Invalid|Duplicate|Unreachable/.test(error.message), error.message);
            }
            check(!accepted, 'Invalid area or room was accepted');
        }
    });

    test('First Court streams ten alternating loops with reversals, stable resources and restored door swings', async () => {
        const world = new World(schoolFromManifest(manifest), GAME_CONFIG, levelsUrl);
        const scene = new THREE.Scene();
        world.attach(scene, new LightingManager(scene, { shadowMap: {} }));
        const requests = new Map();
        const readTemplate = world.cache.readTemplate.bind(world.cache);
        world.cache.readTemplate = url => {
            requests.set(url, (requests.get(url) ?? 0) + 1);
            return readTemplate(url);
        };
        const doors = [[-21, -3], [1, 23], [26, 37]];
        const [a, b, c] = manifest.areas.map(area => area.id);
        const retained = [];
        const retired = new Set();
        const route = [[-19.8, 2], [-7, 2], [-5, 2], [-7, 2], [2.45, 2], [2.45, 34],
            [9, 34], [11, 34], [9, 34], [18, 34], [18, 35], [26, 35], [26, 37], [26, 35],
            [18, 35], [18, 42], [11, 42], [9, 42], [11, 42], [-13, 42], [-13, 22], [-19.8, 22], [-19.8, 2]];
        const player = new Player(GAME_CONFIG);
        let now = 0;
        async function update(delta) {
            now += delta * 1000;
            const missing = world.updateResidency(player.position, now, GAME_CONFIG.moveSpeed * delta + GAME_CONFIG.playerRadius);
            check(!missing, 'Hold on a prepared route: ' + missing);
            await Promise.all([...world.areas.values()].map(area => area.streaming));
            for (const id of [a, b, c]) {
                if (!world.active.has(id)) {
                    retired.add(id);
                }
            }
            player.update(delta, world);
        }
        async function walk(x, z, airborne) {
            const dx = x - player.position.x;
            const dz = z - player.position.z;
            const distance = Math.hypot(dx, dz);
            player.turnCamera(Math.atan2(-dx, -dz) - player.yaw, 0);
            player.pressAction('moveForward');
            const orientation = player.camera.quaternion.clone();
            let remaining = distance / GAME_CONFIG.moveSpeed;
            while (remaining > 1e-8) {
                const delta = Math.min(1 / 30, remaining);
                await update(delta);
                remaining -= delta;
            }
            player.clearInput();
            check(Math.hypot(player.position.x - x, player.position.z - z) < 0.01, 'Broken streamed route at ' + [x, z]);
            check(airborne ? player.position.y > 0.1 : Math.abs(player.position.y) < 0.001,
                'Unexpected seam height at ' + [x, z]);
            check(orientation.angleTo(player.camera.quaternion) < 1e-6, 'Streaming changed orientation');
        }
        function open(x, z) {
            check(world.openDoor({ x, y: 0, z }), 'Door did not open at ' + [x, z]);
        }
        function swing(id) {
            const [doorId] = world.area(id).doors.keys();
            return [doorId, world.active.get(id).doors.find(door => door.id === doorId).panel.rotation.y];
        }
        function verifySwing(id, [doorId, angle]) {
            const level = world.active.get(id);
            const door = level?.doors.find(door => door.id === doorId);
            check(door?.isOpen, 'Restored door was closed: ' + id);
            check(angle === door.panel.rotation.y, 'Restored door changed swing: ' + id);
        }
        function measure() {
            return JSON.stringify([
                [...world.active.keys()].sort(), world.cache.templates.size, scene.children.length,
                [...world.active.values()].reduce((sum, level) => sum + level.solids.length, 0),
                world.lighting.fixtures.length, world.lighting.lights.filter(light => light.castShadow).length
            ]);
        }
        try {
            await Promise.all(world.initialAreaIds.map(id => world.streamArea(id)));
            check(world.active.has(a) && world.active.has(b) && !world.active.has(c), 'Startup did not defer the range');
            player.resetPosition({ x: -19.8, y: 0, z: 2 }, null, world);
            open(...doors[0]);
            open(...doors[1]);
            const original = [swing(a), swing(b)];
            for (let loop = 0; loop < 10; loop++) {
                const points = loop % 2 ? route.slice().reverse() : route;
                for (let index = 1; index < points.length; index++) {
                    const point = points[index];
                    const reversing = loop === 0 && points[index - 1].join() === points[index + 1]?.join();
                    if (reversing) {
                        player.pressAction('jump');
                        await walk(...point, true);
                        await walk(...points[++index], true);
                        await update(0.4);
                        check(player.isGrounded, 'Player lost floor support after reversing in the air');
                    } else {
                        await walk(...point, false);
                    }
                    if (point[0] === 26 && point[1] === 37 && !original[2]) {
                        open(...doors[2]);
                        original[2] = swing(c);
                    }
                    for (const [index, id] of [a, b, c].entries()) {
                        if (original[index] && world.active.has(id)) {
                            verifySwing(id, original[index]);
                        }
                    }
                }
                // Let the area keep interval elapse in the same A+B viewpoint each lap.
                await update(0.6);
                retained.push(measure());
            }
            check(retired.size === 3 && !world.active.has(c), 'One or more areas never retired');
            check(retained.every(value => value === retained[0]), 'Retained resources grew: ' + retained);
            check(requests.size === world.cache.templates.size &&
                [...requests.values()].every(count => count === 1), 'Shared template fetched or parsed twice');
            world.reset();
            check(world.active.has(a) && world.active.has(b) && !world.active.has(c) &&
                [...world.areas.values()].every(area => !area.doors.size), 'Restart did not restore the initial area and doors');
        } finally {
            world.dispose();
        }
        check(scene.children.length === 0 && world.cache.templates.size === 0 &&
            world.lighting.registrations.size === 0, 'World teardown retained resources');
    });

    test('First Court ignores a late preparation after retreat and can immediately request it again', async () => {
        const world = new World(schoolFromManifest(manifest), GAME_CONFIG, levelsUrl);
        try {
            const scene = new THREE.Scene();
            world.attach(scene, new LightingManager(scene, { shadowMap: {} }));
            await Promise.all(world.initialAreaIds.map(id => world.streamArea(id)));
            const destination = [...world.areas.keys()].find(id => !world.initialAreaIds.includes(id));
            const prepare = world.cache.prepare.bind(world.cache);
            let complete;
            world.cache.prepare = () => new Promise(resolve => { complete = resolve; });
            const approach = { x: 2.45, z: 9 };
            const spawn = manifest.playerStart;
            check(!world.updateResidency(approach, 0, 0.4), 'Prefetch held movement');
            const obsolete = world.area(destination).streaming;
            check(obsolete, 'No prefetch started');
            world.updateResidency(spawn, 600, 0.4);
            world.cache.prepare = prepare;
            world.updateResidency(approach, 700, 0.4);
            await world.area(destination).streaming;
            const activeLevel = world.active.get(destination);
            complete();
            await obsolete;
            check(activeLevel && world.active.get(destination) === activeLevel &&
                world.passageState(destination) === 'ready', 'Stale load replaced the current request');
        } finally {
            world.dispose();
        }
    });

    if (typeof window !== 'undefined') {
        test('First Court unload leaves the same rendered scenery and lighting at sheltered viewpoints', async () => {
            const world = new World(schoolFromManifest(manifest), GAME_CONFIG, levelsUrl);
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer();
            const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, GAME_CONFIG.fogFar);
            const target = new THREE.WebGLRenderTarget(320, 180);
            const before = new Uint8Array(target.width * target.height * 4);
            const after = before.slice();
            const [a, b, c] = manifest.areas.map(area => area.id);
            function capture(buffer) {
                renderer.render(scene, camera);
                renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, buffer);
            }
            try {
                scene.background = new THREE.Color(manifest.skyColor);
                scene.fog = new THREE.Fog(manifest.skyColor, GAME_CONFIG.fogNear, GAME_CONFIG.fogFar);
                world.attach(scene, new LightingManager(scene, renderer));
                renderer.setRenderTarget(target);
                for (const [id, from, to] of [
                    [c, [-16, 1.6, -13], [-6, 1.8, 2]],
                    [c, [2.45, 1.6, 2], [-6, 1.8, 2]],
                    [c, [-19.88, 1.6, 6.35], [-19.6, 1.45, 16.1]],
                    [c, [-19.8, 1.6, 19.4], [-19.97, 1.43, 10.7]],
                    [c, [-19.95, 2.55, 19.72], [-16.7, 1.48, 22.65]],
                    [c, [-16.60, 1.6, 16.03], [-14.45, 1.46, 19.20]],
                    [c, [-15.44, 1.6, 32.15], [-18.95, 1.50, 32.13]],
                    [c, [2.55, 1.6, 7.45], [2.5, 4.65, 3.94]],
                    [c, [2.53, 2.55, 25.15], [2.5, 4.8, 30.1]],
                    [c, [2.81, 2.55, 3.70], [34, 7.73, 41.25]],
                    [c, [4.23, 1.6, 17.08], [17.7, 7.3, 28.5]],
                    [a, [4.23, 1.6, 29], [17.7, 9.5, 28.5]],
                    [a, [4.23, 1.6, 29], [0, 1.8, 23]],
                    [a, [34.63, 3.04, 41.85], [17.7, 9.5, 28.5]],
                    [b, [-13, 1.6, 30], [-13, 1.8, 42]]
                ]) {
                    await Promise.all([a, b, c].map(areaId => world.streamArea(areaId)));
                    camera.position.set(...from);
                    camera.lookAt(...to);
                    capture(before);
                    world.unloadArea(id);
                    capture(after);
                    check(before.every((value, index) => Math.abs(value - after[index]) <= 1),
                        'Visible geometry or lighting changed at ' + from);
                }
            } finally {
                world.dispose();
                renderer.setRenderTarget(null);
                target.dispose();
                renderer.dispose();
            }
        });
    }

    test('Furnished First Court classrooms share their models and keep the teaching aisles clear', () =>
        withSchool((world, scene) => {
            const object = name => {
                const instance = scene.getObjectByName(name);
                check(instance, 'Missing room fitting: ' + name);
                return instance;
            };
            const bounds = name => new THREE.Box3().setFromObject(object(name));
            for (const kind of ['teacher desk', 'standing chalkboard']) {
                const schoolroom = object('Schoolroom ' + kind);
                const mathematics = object('Mathematics ' + kind);
                check(schoolroom.getObjectByProperty('isMesh', true).geometry ===
                    mathematics.getObjectByProperty('isMesh', true).geometry, 'Teaching model is not shared: ' + kind);
            }
            for (const [caseName, rows] of [['west', ['books', 'lower books']], ['east', ['books', 'upper books']]]) {
                const shelf = bounds('Reading bookcase ' + caseName);
                for (const row of rows) {
                    check(shelf.containsBox(bounds('Reading bookcase ' + caseName + ' ' + row)),
                        'Reading books extend past their case');
                }
            }
            const rug = bounds('Reading_room_rug');
            check(rug.min.y > 0.005 && rug.max.y < 0.012, 'Reading rug is not separated from the floor');
            for (const name of ['Reading room print and rug', 'Schoolroom copywork on slate', 'Mathematics geometry on slate',
                'Porter counter and waiting area', 'Reception plaster and oak',
                'East Range plaster and oak', 'Cloakroom peg shelf and work aprons']) {
                object(name);
                check(!scene.getObjectByName(name + ' collision'), 'Unexpected decorative collision: ' + name);
            }
            for (const [approach, aisle, roomId] of [
                [[-19.35, 16], [[-18.3, 16], [-17, 16], [-16.65, 16], [-14.5, 16.4], [-14.5, 17.45]], 'GH-G-02'],
                [[26, 37], [[26, 38], [26, 40], [26, 41.2], [26, 43.5]], 'ER-G-01']
            ]) {
                const [x, z] = approach;
                check(world.openDoor({ x, y: 0, z }), 'Cannot open classroom ' + roomId);
                for (const [aisleX, aisleZ] of aisle) {
                    check(!world.isBlocked({ x: aisleX, y: 0, z: aisleZ }, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight),
                        'Obstructed classroom aisle in ' + roomId + ' at ' + [aisleX, aisleZ]);
                }
                const [insideX, insideZ] = aisle.at(-1);
                check(world.getEnteredRoomId({ x: insideX, y: 0, z: insideZ }) === roomId, 'Room identity changed');
            }
            check(world.isBlocked({ x: -18.23, y: 0, z: 32.6 }, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight),
                'Reading table has no fitted collision');
        }));

    test('First Court roof joints, plaster corner and lookout recess cover the former visible defects', () =>
        withSchool((world, scene) => {
            const meshes = [];
            scene.updateMatrixWorld(true);
            scene.traverseVisible(object => {
                if (object.isMesh && object.material.visible && object.material.opacity > 0.95) {
                    meshes.push(object);
                }
            });
            for (const [from, to, name] of [
                [[-19.5, 2, 20.506], [-18.2, 2, 20.506], 'Soft_limewash'],
                [[-19.5, 2, 20.510], [-18.2, 2, 20.510], 'Soft_limewash'],
                [[-14.45, 1.6, -8.65], [-14, 9.26, -15.82], 'GatehouseJoints_arrival_gable'],
                [[2.55, 1.6, 7.45], [2.5, 5.1, 4.035], 'CloisterJoints_stone_joints'],
                [[2.53, 2.55, 25.15], [2.5, 5.77, 28.97], 'CloisterJoints_stone_joints'],
                [[34.65, 3.04, 41.85], [30.65, -0.12, 40.85], 'EastRangeJoints_recess_paving']
            ]) {
                const eye = new THREE.Vector3(...from);
                const direction = new THREE.Vector3(...to).sub(eye).normalize();
                const hit = new THREE.Raycaster(eye, direction).intersectObjects(meshes)[0]?.object;
                check(hit?.name === name, 'Expected ' + name + ' from ' + from + ', found ' + hit?.name);
            }
            for (const level of world.active.values()) {
                check(!level.solids.some(solid => solid.id.includes('%20fitted%20joins')),
                    'Fitted joins added new collision in ' + level.areaId);
            }
        }));

    test('Scholars’ Passage finishes continue through both turns and leave thresholds clear', () =>
        withSchool((world, scene) => {
            const [gatehouse] = world.initialAreaIds;
            const level = world.active.get(gatehouse);
            const finishes = scene.getObjectByName('Scholars Passage finishes');
            const portrait = scene.getObjectByName('Scholars Passage portrait');
            const runner = scene.getObjectByName('Worn_Scholars_Passage_runner');
            const trim = scene.getObjectByName('Scholars_oak_moulding');
            const notice = scene.getObjectByName('Schoolroom notices');
            check(finishes && portrait && runner && trim && notice, 'Passage finishes are missing');
            check(!level.solids.some(solid => solid.id.startsWith(gatehouse + '/placement/Scholars')),
                'Passage finishes added a collider');
            const runnerBounds = new THREE.Box3().setFromObject(runner);
            check(runnerBounds.min.y > 0.005 && runnerBounds.max.y < 0.012,
                'Runner is coplanar with the floor or raised above the boards');
            const finishBounds = new THREE.Box3().setFromObject(finishes);
            check(finishBounds.min.z >= 4.17 && finishBounds.max.z <= 43.33 &&
                finishBounds.min.x >= -21.49 && finishBounds.max.x <= 9.83,
            'Finish mesh extends outside the passage');

            scene.updateMatrixWorld(true);
            const visible = [];
            scene.traverseVisible(object => {
                if (object.isMesh && object.material.opacity !== 0 && object.material.visible) {
                    visible.push(object);
                }
            });
            function materialAt(position, direction) {
                const ray = new THREE.Raycaster(new THREE.Vector3(...position), new THREE.Vector3(...direction));
                return ray.intersectObjects(visible)[0]?.object.material.name;
            }

            const runs = [
                [-19.8, 6.6, 1, 0], [-17.8, 22, 0, 1], [-13, 28.25, 1, 0],
                [-7.25, 42, 0, 1], [13.45, 42, 0, 1]
            ];
            for (const [x, z, dx, dz] of runs) {
                for (const direction of [-1, 1]) {
                    const towardWall = [dx * direction, 0, dz * direction];
                    check(materialAt([x, 1.85, z], towardWall) === 'Soft limewash',
                        'Limewash interrupted at ' + [x, z]);
                    check(/^Scholars (recessed oak|oak moulding)$/.test(materialAt([x, 0.55, z], towardWall)),
                        'Panel run interrupted at ' + [x, z]);
                    check(materialAt([x, 1.046, z], towardWall) === 'Scholars oak moulding',
                        'Cap height changed at ' + [x, z]);
                }
                check(materialAt([x, 0.4, z], [0, -1, 0]) === 'Faded russet wool',
                    'Missing runner at ' + [x, z]);
            }
            for (const [x, z] of [[-19.4, 12.55], [-13, 36.5], [-6, 42], [13.45, 42]]) {
                check(materialAt([x, 3, z], [0, 1, 0]) === 'Scholars oak moulding',
                    'Missing transverse tie at ' + [x, z]);
            }
            check(materialAt([9.92, 2.0, 42], [0, 0, -1]) === 'Existing weathered stone',
                'Scholars cross-passage reveal lost its masonry');
            check(materialAt([2.45, 1.6, 14.0], [-1, 0, 0]) === 'Existing weathered stone',
                'Cloister spine lost its continuous stone');
            for (const [label, x, z] of [['Room 13', -19.8, 11.48], ['Room 14', -19.8, 14.47],
                ['Room 15', -13, 33.52]]) {
                const plaque = scene.getObjectByName(label);
                const eye = new THREE.Vector3(x, 1.6, z);
                const ray = new THREE.Raycaster(eye, plaque.position.clone().sub(eye).normalize());
                check(ray.intersectObjects(visible)[0]?.object === plaque, label + ' is visually obstructed');
            }
            const runnerSupport = world.getVerticalCollision({ x: -19.8, y: 0.3, z: 12 }, -0.1, 0.3, 1.8);
            check(runnerSupport !== null && Math.abs(runnerSupport) < 1e-6, 'Runner changed floor contact');
            for (const z of [10, 16]) {
                check(world.isBlocked({ x: z === 10 ? -21.3 : -18.3, y: 0, z }, 0.3, 1.8), 'Closed door leaked');
            }
            check(world.openDoor({ x: -19.35, y: 0, z: 16 }) &&
                !world.isBlocked({ x: -18.3, y: 0, z: 16 }, 0.3, 1.8), 'Schoolroom threshold is obstructed');

            world.toggleDebugView();
            check(!finishes.visible && !portrait.visible && notice.visible &&
                scene.getObjectByName('East school wall chair rail 1 collision').visible,
            'Debug view lost the original outlines or shows decorative meshes over them');
        }));

    test('First Court seams support walking, jumping and immediate reversal across their clear width', () =>
        withSchool(world => {
            const { cameraHeight, playerHeight, playerRadius } = GAME_CONFIG;
            for (const { aperture } of manifest.connections.slice(0, 3)) {
                const { plane, min, max, ceiling } = aperture;
                const center = (min + max) / 2;
                check(world.isBlocked({ x: plane, y: ceiling - playerHeight + 0.04, z: center },
                    playerRadius, playerHeight), 'Missing portal lintel');
                for (const z of [min + playerRadius + 0.02, center, max - playerRadius - 0.02]) {
                    for (const jump of [false, true]) {
                        const player = new Player(GAME_CONFIG);
                        player.resetPosition({ x: plane - 0.55, y: 0, z }, { x: plane + 1, y: cameraHeight, z }, world);
                        const orientation = player.camera.quaternion.clone();
                        if (jump) {
                            player.pressAction('jump');
                        }
                        player.pressAction('moveForward');
                        player.update(0.2, world);
                        check(player.position.x > plane + 0.6, 'Blocked crossing at ' + [plane, z]);
                        check(jump ? player.position.y > 0.5 : Math.abs(player.position.y) < 0.001, 'Unexpected seam height');
                        player.releaseAction('moveForward');
                        player.pressAction('moveBack');
                        player.update(0.2, world);
                        check(Math.abs(player.position.x - (plane - 0.55)) < 0.001, 'Blocked reverse crossing');
                        check(orientation.angleTo(player.camera.quaternion) < 0.000001, 'Camera turned at a seam');
                    }
                }
            }
        }));

    test('All seven First Court pointed doorways share a fitted reveal and retain the original head collision', () =>
        withSchool((world, scene) => {
            scene.updateMatrixWorld(true);
            const visible = [];
            scene.traverseVisible(object => {
                if (object.isMesh && object.material.opacity !== 0 && object.material.visible) {
                    visible.push(object);
                }
            });
            let portalCount = 0;
            for (const [areaId, level] of world.active) {
                for (const { name, x, y, z, rotationY, archOpening } of level.definition.environmentObjects ?? []) {
                    if (archOpening !== 'pointedOak' || name === 'Library Court passage head') {
                        continue;
                    }
                    portalCount++;
                    const alongX = rotationY === 0;
                    const walls = level.solids.filter(wall =>
                        wall.id.startsWith(areaId + '/placement/' + encodeURIComponent(name) + '/'));
                    check(walls.length === 16, name + ' changed the number of collision bands');
                    for (const wall of walls) {
                        const depth = alongX ? wall.maxZ - wall.minZ : wall.maxX - wall.minX;
                        const width = alongX ? wall.maxX - wall.minX : wall.maxZ - wall.minZ;
                        check(Math.abs(depth - 0.802) < 0.00001 && Math.abs(width - 1.8 / 16) < 0.00001 &&
                            Math.abs(wall.maxY - (y + 1.65)) < 0.00001, name + ' changed the collision bounds');
                    }
                    const reveal = scene.getObjectByName(name).getObjectByName('Fitted_limestone_arch_and_jambs');
                    const eye = new THREE.Vector3(x + (alongX ? 0 : -0.13), 1.45, z + (alongX ? -0.13 : 0));
                    for (const direction of [new THREE.Vector3(0, 1, 0),
                        new THREE.Vector3(alongX ? 1 : 0, 0, alongX ? 0 : 1),
                        new THREE.Vector3(alongX ? -1 : 0, 0, alongX ? 0 : -1)]) {
                        const hit = new THREE.Raycaster(eye, direction).intersectObjects(visible)[0];
                        check(reveal && hit?.object === reveal, name + ' has a competing or missing reveal face');
                    }
                }
            }
            check(portalCount === 7, 'Unexpected number of pointed First Court doorways');
        }));

    test('First Court doors, arrival bounds, stair treads and courtyard parapet match the playable routes', () =>
        withSchool(world => {
            const { playerRadius, playerHeight } = GAME_CONFIG;
            for (const [x, z, approach] of [[-22, -3, { x: -21, y: 0, z: -3 }],
                [26, 38, { x: 26, y: 0, z: 37 }]]) {
                const threshold = { x, y: 0, z };
                check(world.isBlocked(threshold, playerRadius, playerHeight), 'Closed doorway permits passage');
                check(world.openDoor(approach), 'Unable to open reachable door');
                check(!world.isBlocked(threshold, playerRadius, playerHeight), 'Open door blocks the threshold');
                check(world.getEnteredRoomId(threshold) === null, 'Threshold counted as arrival');
            }
            check(world.getEnteredRoomId({ x: -25, y: 0, z: -3 }) === null, 'Lodge counted as classroom');
            check(world.getEnteredRoomId({ x: 26, y: 0, z: 40 }) === 'ER-G-01', 'Missing classroom arrival');
            const player = new Player(GAME_CONFIG);
            player.resetPosition({ x: 35.45, y: 0, z: 37.5 }, { x: 35.45, y: 1.6, z: 42 }, world);
            player.pressAction('moveForward');
            player.update(0.7, world);
            check(player.isGrounded && Math.abs(player.position.y - 1.44) < 0.001, 'Stair landing inaccessible');
            player.releaseAction('moveForward');
            player.pressAction('moveBack');
            player.update(0.7, world);
            check(player.isGrounded && Math.abs(player.position.y) < 0.001, 'Cannot descend to the corridor');
            player.resetPosition({ x: 4.15, y: 0, z: 17 }, { x: 6, y: 1.6, z: 17 }, world);
            player.pressAction('jump');
            player.pressAction('moveForward');
            player.update(1.1, world);
            check(player.position.x < 4.75 && player.isGrounded, 'Player jumped through the courtyard parapet');
        }));

    test('All fifteen school rooms have unique public labels and only the five classrooms are schedulable', () =>
        withSchool((world, scene) => {
            const numbers = [...world.roomNumbers.values()].sort().join(',');
            check(numbers === '12,13,14,15,24,25,26,31,32,33,41,42,43,44,45', 'Unexpected room schedule: ' + numbers);
            for (const [id, number] of world.roomNumbers) {
                check(scene.getObjectByName('Room ' + number), 'Missing public plaque for ' + id);
            }
            for (const [x, z, dx, dz, open] of [
                [-22, -3, 1, 0, true], [-21.3, 10, 1, 0, false], [-18.3, 16, -1, 0, true],
                [-14.5, 32, 1, 0, true], [0, 23, 1, 0, true], [26, 38, 0, -1, true], [39.5, 38, 0, -1, false],
                [46.5, 45, 1, 0, true], [46.5, 54.5, 1, 0, true], [46.5, 62, 1, 0, true],
                [50, 73.5, 0, -1, true], [61, 77, 1, 0, true], [65, 77, -1, 0, true],
                [79.3, 62.5, -1, 0, true], [79.3, 55, -1, 0, false]
            ]) {
                const threshold = { x, y: 0, z };
                const approach = { x: x + dx, y: 0, z: z + dz };
                const blocked = () => world.isBlocked(threshold, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight);
                check(blocked(), 'Door missing its collision at ' + [x, z]);
                check(world.canOpenDoor(approach) === open && world.openDoor(approach) === open, 'Wrong interaction');
                check(blocked() !== open, 'Incorrect passage after interaction at ' + [x, z]);
            }
            for (const roomId of world.roomNumbers.keys()) {
                const schedule = { ...manifest.challenge.schedule, roomId };
                let valid = true;
                try {
                    schoolFromManifest({ ...manifest, challenge: { ...manifest.challenge, schedule } });
                } catch (error) {
                    if (!error.message.includes('Unreachable scheduled room')) {
                        throw error;
                    }
                    valid = false;
                }
                check(valid === ['GH-G-02', 'ER-G-01', 'north-history', 'north-latin', 'north-greek'].includes(roomId),
                    'Wrong schedule eligibility for ' + roomId);
            }
            const invalid = JSON.parse(JSON.stringify(manifest));
            invalid.areas[0].definition.rooms[1].number = '12';
            let errorMessage = '';
            try {
                registerSchoolAreas(schoolFromManifest(invalid));
            } catch (error) {
                errorMessage = error.message;
            }
            check(errorMessage.includes('Duplicate room number'), 'Duplicate number accepted');
        }));

    test('Library Court streams ten loops, preserves shared assets and restores doors after retirement', async () => {
        const world = new World(schoolFromManifest(manifest), GAME_CONFIG, levelsUrl);
        const scene = new THREE.Scene();
        world.attach(scene, new LightingManager(scene, { shadowMap: {} }));
        const player = new Player(GAME_CONFIG);
        const district = ['library-gallery', 'north-teaching', 'book-passage'];
        const route = [[4, 42], [18, 42], [18, 35], [48, 35], [48, 50], [48, 72], [63, 72], [63, 77],
            [63, 72], [78, 72], [78, 50], [48, 50], [48, 35], [18, 35], [18, 42], [4, 42]];
        let now = 0;
        async function walk(x, z, elevation = 0) {
            const dx = x - player.position.x;
            const dz = z - player.position.z;
            player.turnCamera(Math.atan2(-dx, -dz) - player.yaw, 0);
            player.pressAction('moveForward');
            let remaining = Math.hypot(dx, dz) / GAME_CONFIG.moveSpeed;
            while (remaining > 1e-8) {
                const delta = Math.min(1 / 20, remaining);
                now += delta * 1000;
                const hold = world.updateResidency(player.position, now, GAME_CONFIG.moveSpeed * delta + GAME_CONFIG.playerRadius);
                check(!hold, 'Unexpected hold at ' + player.position.toArray());
                await Promise.all([...world.areas.values()].map(area => area.streaming));
                player.update(delta, world);
                remaining -= delta;
            }
            player.clearInput();
            check(Math.hypot(player.position.x - x, player.position.z - z) < 0.025 &&
                Math.abs(player.position.y - elevation) < 0.01, 'Could not walk to ' + [x, elevation, z] +
                ' from ' + player.position.toArray());
        }
        try {
            await Promise.all([...world.initialAreaIds, 'east-range'].map(id => world.streamArea(id)));
            player.resetPosition({ x: 4, y: 0, z: 42 }, null, world);
            check(district.every(id => !world.active.has(id)), 'District loaded at startup');
            check(world.roomNumbers.get('north-latin') === '42', 'Latin identity depends on loading');
            let retained;
            let swing;
            for (let loop = 0; loop < 10; loop++) {
                const path = loop % 2 ? route.slice().reverse() : route;
                for (const [x, z] of path.slice(1)) {
                    await walk(x, z);
                    if (x === 63 && z === 77) {
                        const door = world.active.get('north-teaching').doors.find(item => item.definition.roomId === 'north-latin');
                        if (loop === 0) {
                            await walk(62.05, 77);
                            check(world.openDoor(player.position), 'Latin door would not open');
                            await walk(59.35, 77);
                            check(world.getEnteredRoomId(player.position) === 'north-latin', 'Latin arrival not detected');
                            await walk(63, 77);
                            swing = door.panel.rotation.y;
                        }
                        check(door.isOpen && door.panel.rotation.y === swing, 'The streamed Latin door lost its swing');
                    }
                }
                check(district.every(id => world.area(id).status === 'unloaded'), 'District stayed resident after exit');
                const resources = [world.cache.templates.size, scene.children.length, world.lighting.fixtures.length,
                    [...world.active.values()].reduce((total, level) => total + level.solids.length, 0)].join(',');
                retained ??= resources;
                check(resources === retained, 'Loop retained additional resources');
            }

            await walk(18, 42);
            await walk(18, 35);
            await walk(48, 35);
            scene.updateMatrixWorld(true);
            const entry = new THREE.Raycaster(new THREE.Vector3(39, 1.6, 35), new THREE.Vector3(1, 0, 0));
            const entryHit = entry.intersectObjects(scene.children, true).find(hit => hit.object.isMesh && hit.object.visible);
            check(entryHit?.object.name === 'West walk east wall', 'An obsolete East Range surface spans the portal');
            await walk(48, 62);
            for (const [x, z] of [[63, 81.5], [79.3, 50.35], [64, 48.7], [76.7, 60]]) {
                check(world.isBlocked({ x, y: 0.9, z }, GAME_CONFIG.playerRadius, GAME_CONFIG.playerHeight),
                    'Unopened bay or court barrier can be crossed at ' + [x, z]);
            }
            check(world.openDoor(player.position), 'Old Library entrance would not open');
            await walk(39.5, 62);
            check(world.getEnteredRoomId(player.position) === 'old-library', 'Old Library cannot be entered');
            await walk(39.5, 67.35);
            await walk(45.3, 67.35, 2.4);
            await walk(45.3, 61.9, 2.4);
            scene.updateMatrixWorld(true);
            const view = new THREE.Raycaster(new THREE.Vector3(45.3, 4, 61.9), new THREE.Vector3(1, -0.14, 0).normalize());
            const viewHits = view.intersectObjects(scene.children, true).filter(hit => hit.object.isMesh);
            check(viewHits.findIndex(hit => hit.object.name === 'Library projecting window glazing') >= 0 &&
                viewHits.findIndex(hit => hit.object.name === 'West walk court gallery light glazing') >
                    viewHits.findIndex(hit => hit.object.name === 'Library projecting window glazing'),
            'Upper gallery cannot see through both court windows');
            await walk(45.3, 67.35, 2.4);
            await walk(39.5, 67.35);
            await walk(39.5, 62);
            await walk(48, 62);
        } finally {
            world.dispose();
        }
    });

    test('The entire First Court loop is walkable in both directions with all room doors closed', () =>
        withSchool(world => {
            const route = [[-19.8, 2], [-19.8, 22], [-13, 22], [-13, 42], [18, 42],
                [18, 34], [2.45, 34], [2.45, 2], [-19.8, 2]];
            const player = new Player(GAME_CONFIG);
            player.resetPosition({ x: route[0][0], y: 0, z: route[0][1] }, null, world);
            player.pressAction('moveForward');
            for (const [x, z] of [...route.slice(1), ...route.slice(0, -1).reverse()]) {
                const dx = x - player.position.x;
                const dz = z - player.position.z;
                player.turnCamera(Math.atan2(-dx, -dz) - player.yaw, 0);
                player.update(Math.hypot(dx, dz) / GAME_CONFIG.moveSpeed, world);
                check(Math.hypot(player.position.x - x, player.position.z - z) < 0.001 && player.isGrounded,
                    'Broken loop approaching ' + [x, z]);
            }
        }));

    test('The cloister and the East Range landing see the same physical courtyard tower', () =>
        withSchool((world, scene) => {
            scene.updateMatrixWorld(true);
            const target = new THREE.Vector3(17.7, 14.17, 28.5);
            const meshes = [];
            scene.traverseVisible(object => {
                if (object.isMesh && !object.material.transparent) {
                    meshes.push(object);
                }
            });
            const tower = scene.getObjectByName('Courtyard bell tower');
            check(world.area('west-cloister').level.objects.includes(tower), 'Tower owner changed');
            const towerMeshes = new Set();
            tower.traverse(node => {
                if (node.isMesh) {
                    towerMeshes.add(node);
                }
            });
            for (const eye of [new THREE.Vector3(4.23, 1.6, 17.08), new THREE.Vector3(34.63, 3.04, 41.85)]) {
                const ray = new THREE.Raycaster(eye, target.clone().sub(eye).normalize());
                const first = ray.intersectObjects(meshes)[0]?.object;
                check(towerMeshes.has(first), 'Tower sightline blocked by ' + first?.name);
            }
        }));

    test('First Court belfry openings are recessed on all four faces', () =>
        withSchool((world, scene) => {
            scene.updateMatrixWorld(true);
            const tower = scene.getObjectByName('Courtyard bell tower');
            const masonryDistance = 2.22;
            for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
                const center = new THREE.Vector3(17.7, 12.15, 28.5);
                const outward = new THREE.Vector3(dx, 0, dz);
                const jamb = new THREE.Raycaster(center.clone().addScaledVector(outward, 3), outward.clone().negate());
                const origin = jamb.ray.origin.clone().add(new THREE.Vector3(dz * 0.71, 0, -dx * 0.71));
                const opening = new THREE.Raycaster(origin, jamb.ray.direction);
                const face = jamb.intersectObject(tower, true)[0];
                const inset = opening.intersectObject(tower, true)[0];
                check(face && Math.abs(face.distance - (3 - masonryDistance)) < 0.001, 'Tower face is open or displaced');
                check(inset && inset.distance - face.distance > 0.24, 'Belfry mouth is filled in or missing its backing');
            }
        }));
}
