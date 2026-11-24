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
            await Promise.all(world.initialAreaIds.map(id => world.loadArea(id)));
            for (const id of world.initialAreaIds) {
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
    });

    test('First Court seams support walking, jumping and immediate reversal across their clear width', () =>
        withSchool(world => {
            const { cameraHeight, playerHeight, playerRadius } = GAME_CONFIG;
            for (const { aperture } of manifest.connections) {
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

    test('Seven numbered rooms have physical doors, two scheduled destinations and unique public labels', () =>
        withSchool((world, scene) => {
            check(world.active.size === 3, 'All three blockout areas must remain active');
            const numbers = [...world.roomNumbers.values()].sort().join(',');
            check(numbers === '12,13,14,15,24,25,26', 'Unexpected room schedule: ' + numbers);
            for (const [id, number] of world.roomNumbers) {
                check(scene.getObjectByName('Room ' + number), 'Missing public plaque for ' + id);
            }
            for (const [x, z, dx, dz, open] of [
                [-22, -3, 1, 0, true], [-21.3, 10, 1, 0, false], [-18.3, 16, -1, 0, true],
                [-14.5, 32, 1, 0, true], [0, 23, 1, 0, true], [26, 38, 0, -1, true], [39.5, 38, 0, -1, false]
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
                check(valid === ['GH-G-02', 'ER-G-01'].includes(roomId), 'Wrong schedule eligibility for ' + roomId);
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
            const tower = scene.getObjectByName('Court tower shaft');
            check(world.area('west-cloister').level.objects.includes(tower), 'Tower owner changed');
            for (const eye of [new THREE.Vector3(4.23, 1.6, 17.08), new THREE.Vector3(34.63, 3.04, 41.85)]) {
                const ray = new THREE.Raycaster(eye, target.clone().sub(eye).normalize());
                const first = ray.intersectObjects(meshes)[0]?.object;
                check(first === tower, 'Tower sightline blocked by ' + first?.name);
            }
        }));
}
