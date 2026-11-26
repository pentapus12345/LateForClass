// Both runners use the pinned GLTFLoader and the actual optimized chair.
function registerWorldTests(test, levels, levelsUrl) {
    function equal(actual, expected, label) {
        if (actual !== expected) {
            throw new Error(`${label}: expected ${expected}, got ${actual}`);
        }
    }

    async function fails(action, pattern) {
        try {
            await action();
        } catch (error) {
            if (pattern.test(error.message)) {
                return;
            }
            throw error;
        }
        throw new Error(`Expected failure matching ${pattern}`);
    }

    function fixture() {
        const chair = levels[2].modelCatalog.studentChair;
        const areas = ['A', 'B'].map((id, index) => {
            const x = index ? 2 : -2;
            const roomId = index ? '002' : '001';
            return { id, neighbors: [index ? 'A' : 'B'], definition: {
                solidRendering: true,
                modelCatalog: { seating: { ...chair, model: index ? './' + chair.model : chair.model } },
                environmentObjects: [{ asset: 'seating', name: 'Student chair', x, z: 1 }],
                platforms: [{ name: 'Floor', x, y: -0.2, z: 0, width: 4, depth: 6, height: 0.2 }],
                classrooms: [{ id: roomId, bounds: { x, z: -1.5, width: 2, depth: 2, height: 3 } }],
                doors: [{ roomId, name: 'Door', axis: 'z', x, y: 0, z: -1, width: 1, height: 2,
                    depth: 0.1, interactionRadius: 2, color: 0x888888 }],
                lighting: {
                    lights: [{ type: 'spot', name: id + ' light', position: { x, y: 3, z: 0 }, shadow: {} }],
                    fixtures: [{ name: id + ' fixture', x, y: 3, z: 0 }]
                }
            } };
        });
        return { initialAreaId: 'A', globalLighting: { lights: [{ type: 'ambient' }] }, areas };
    }

    function setup(school = fixture(), renderer = { shadowMap: {} }) {
        const world = new World(school, GAME_CONFIG, levelsUrl);
        const scene = new THREE.Scene();
        const lighting = new LightingManager(scene, renderer);
        world.attach(scene, lighting);
        return { world, scene, lighting, renderer };
    }

    function disposals(resource) {
        let count = 0;
        resource.addEventListener('dispose', () => count++);
        return () => count;
    }

    test('area and room registry exists independently of loading and rejects ambiguous identities', async () => {
        const { world } = setup();
        equal(world.rooms.get('001'), 'A', 'unloaded room owner');
        equal(world.area('B').neighbors[0], 'A', 'neighbor');
        for (const [change, error] of [
            [school => { school.areas[1].id = 'A'; }, /Duplicate area/i],
            [school => { school.areas[1].definition.classrooms[0].id = '001'; }, /Duplicate room/],
            [school => { school.areas[1].definition.classrooms[0].bounds.x = -2; }, /Overlapping room/],
            [school => { school.areas[0].definition.doors.push(school.areas[0].definition.doors[0]); }, /duplicate door/i],
            [school => { school.areas[1].neighbors.push('C'); }, /Unknown area/]
        ]) {
            const school = fixture();
            change(school);
            await fails(() => setup(school), error);
        }
        world.dispose();
    });

    test('two areas share one GLB, retain independent lighting and collisions, and release resources once', async () => {
        const renderer = typeof window === 'undefined' ? { shadowMap: {} } : new THREE.WebGLRenderer();
        const { world, scene, lighting } = setup(fixture(), renderer);
        const read = world.cache.readTemplate.bind(world.cache);
        let reads = 0;
        world.cache.readTemplate = url => { reads++; return read(url); };
        try {
            const first = world.loadArea('A');
            equal(world.area('A').status, 'loading', 'pending state');
            equal(world.loadArea('A'), first, 'same pending area load');
            const [a, b] = await Promise.all([first, world.loadArea('B')]);
            equal(reads, 1, 'one fetch and parse for both aliases');
            equal(world.area('A').status, 'loaded', 'staged state');
            equal(scene.getObjectByName('Student chair'), undefined, 'staged instances detached');
            equal(world.isBlocked({ x: 2, y: 0, z: 1 }, 0.3, 1.8), false, 'staged colliders detached');
            world.activateArea('B');
            world.activateArea('A');
            const chair = level => level.objects.find(object => object.name === 'Student chair');
            const mesh = level => chair(level).getObjectByProperty('isMesh', true);
            equal(chair(a) === chair(b), false, 'distinct instances');
            equal(mesh(a).material, mesh(b).material, 'borrowed material');
            equal(mesh(a).geometry, mesh(b).geometry, 'borrowed geometry');
            const shared = [mesh(b).geometry, mesh(b).material, mesh(b).material.map].map(disposals);
            const fixtureB = scene.getObjectByName('B fixture');
            const lightA = scene.getObjectByName('A light');
            const lightB = scene.getObjectByName('B light');
            const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 30);
            camera.position.set(2, 1.6, 2.8);
            for (let count = 0; count < 2; count++) {
                const local = world.area('A').level;
                const solid = local.solids.find(wall => wall.id.startsWith('A/placement/'));
                equal(Boolean(solid), true, 'stable placement identity');
                const target = scene.getObjectByName('A light').target;
                const disposed = disposals(scene.getObjectByName('A fixture').geometry);
                world.unloadArea('A');
                world.unloadArea('A');
                equal(disposed(), 1, 'local fixture disposal');
                equal(scene.children.includes(target), false, 'target removed');
                equal(scene.getObjectByName('A light'), undefined, 'light removed');
                equal(scene.getObjectByName('B light'), lightB, 'B light survives');
                equal(scene.getObjectByName('B fixture'), fixtureB, 'B fixture survives');
                equal(world.isBlocked({ x: -2, y: 0, z: 1 }, 0.3, 1.8), false, 'A collider removed');
                equal(world.isBlocked({ x: 2, y: 0, z: 1 }, 0.3, 1.8), true, 'B collider survives');
                equal(shared.every(count => count() === 0), true, 'borrowed resources survive');
                equal(scene.getObjectByName('Student chair'), chair(b), 'B mesh remains mounted');
                renderer.render?.(scene, camera);
                if (renderer.info) {
                    equal(renderer.info.render.calls > 0 && !!lightB.shadow.map, true, 'B draws and casts shadows');
                }
                world.toggleDebugView();
                await world.loadArea('A');
                world.activateArea('A');
                world.activateArea('A');
                equal(scene.getObjectByName('A light'), lightA, 'renderer reuses the original light ID');
                equal(world.area('A').level.debugView, world.debugView, 'new area inherits view');
                equal(lighting.fixtures.length, 2, 'no duplicate fixtures');
                equal(scene.children.filter(o => o.name === 'Student chair').length, 2, 'no duplicate chairs');
                equal(world.area('A').level.solids.some(wall => wall.id === solid.id), true, 'stable reloaded collider');
                world.toggleDebugView();
            }
            equal(reads, 1, 'cached across cycles');
            world.dispose();
            world.dispose();
            equal(shared.every(count => count() === 1), true, 'shared resources disposed exactly once');
            equal(scene.children.length, 0, 'complete scene teardown');
            equal(lighting.lightInstances.size, 0, 'detached light instances released at teardown');
        } finally {
            world.dispose();
            renderer.dispose?.();
        }
    });

    test('door swing, arrival and school time survive unload from either side until retry', async () => {
        const { world } = setup();
        const session = new GameSession(levels[2]);
        session.start();
        session.setPlayAccess(true, 0);
        await Promise.all([world.loadArea('A'), world.loadArea('B')]);
        world.activateArea('A');
        world.activateArea('B');
        const position = { x: -2, y: 0, z: -1.6 };
        for (const z of [-1.6, -0.4]) {
            equal(world.getEnteredRoomId(position), null, 'closed entrance');
            equal(world.openDoor({ ...position, z }), true, 'open door');
            const door = world.area('A').level.doors[0];
            const angle = door.panel.rotation.y;
            const collider = world.area('A').level.solids[door.solidIndex];
            equal(Math.sign(angle), z < -1 ? -1 : 1, 'side of swing');
            world.unloadArea('A');
            equal(world.rooms.get('001'), 'A', 'stable room identity');
            await world.loadArea('A');
            world.activateArea('A');
            const restored = world.area('A').level.doors[0];
            const wall = world.area('A').level.solids[restored.solidIndex];
            equal(restored.id, door.id, 'door identity');
            equal(wall.minZ, collider.minZ, 'restored collider');
            equal(restored.wireframe.rotation.y, angle, 'restored outline');
            equal(restored.panel.rotation.y, angle, 'restored swing');
            equal(world.getEnteredRoomId(position), '001', 'restored arrival region');
            equal(session.getSchoolTime(2000), '08:02', 'clock continued');
            equal(session.isRunning, true, 'session kept running');
            world.reset();
            equal(world.active.size, 1, 'original active set on retry');
        }
        world.dispose();
    });

    test('active areas share a walkable seam and choose the first vertical contact and tallest obstruction', async () => {
        const school = fixture();
        const platform = (name, x, y, height) => ({ name, x, y, height, z: 2, width: 0.25, depth: 0.6 });
        school.areas[0].definition.platforms.push(platform('Low', -0.125, 0, 0.2), platform('High ceiling', -0.125, 3, 0.2));
        school.areas[1].definition.platforms.push(platform('Tall', 0.125, 0, 0.5), platform('Low ceiling', 0.125, 2.5, 0.2));
        const { world } = setup(school);
        await Promise.all(school.areas.map(area => world.loadArea(area.id)));
        world.activateArea('B');
        world.activateArea('A');
        for (const x of [-0.05, 0.05]) {
            const p = { x, y: 0, z: 2 };
            equal(world.getStepHeight(p, 0.3, 1.8, 0.35), null, 'tall obstruction at seam');
            equal(world.getVerticalCollision({ ...p, y: 0.6 }, 1.8, 0.3, 1.8), 2.5 - 1.8, 'first ceiling');
            equal(world.getVerticalCollision({ ...p, y: 0.6 }, 0, 0.3, 1.8), 0.5, 'first floor');
        }
        const player = new Player(GAME_CONFIG);
        player.resetPosition({ x: -0.8, y: 0, z: 0 }, { x: 2, y: 1.6, z: 0 }, world);
        player.pressAction('moveForward');
        player.update(0.3, world);
        equal(player.position.x > 0 && player.isGrounded, true, 'walked across adjoining floors');
        equal(world.nearbyDoor({ x: 0, y: 0, z: -1 }).level.areaId, 'A', 'stable equal-distance door');
        equal(world.nearbyDoor({ x: 0.1, y: 0, z: -1 }).level.areaId, 'B', 'nearest candidate');
        world.dispose();
    });

    test('failure during asset preparation, local construction or lighting activation leaves B playable', async () => {
        const school = fixture();
        const a = school.areas[0].definition;
        const extra = { model: levels[2].modelCatalog.studentDesk.model, name: 'Desk', x: -2, z: 0 };
        a.environmentObjects.push(extra);
        const { world, scene } = setup(school);
        await world.loadArea('B');
        world.activateArea('B');
        const read = world.cache.readTemplate.bind(world.cache);
        world.cache.readTemplate = async () => { throw new Error('simulated failed request'); };
        await fails(() => world.loadArea('A'), /failed request/);
        equal(world.area('A').status, 'unloaded', 'failed load can retry');
        world.cache.readTemplate = read;
        extra.modelVariant = 'missing part';
        await fails(() => world.loadArea('A'), /Unknown model variant/);
        equal(scene.children.filter(o => o.name === 'Student chair').length, 1, 'partial build stayed detached');
        delete extra.modelVariant;
        await world.loadArea('A');
        a.lighting.lights.push({ type: 'invalid' });
        await fails(() => world.activateArea('A'), /Unknown light/);
        equal(world.area('A').status, 'loaded', 'activation can retry');
        equal(scene.getObjectByName('A light'), undefined, 'partial lighting removed');
        equal(world.active.size, 1, 'B alone active');
        equal(world.isBlocked({ x: 2, y: 0, z: 1 }, 0.3, 1.8), true, 'B still solid');
        a.lighting.lights.pop();
        world.activateArea('A');
        world.dispose();
    });

    test('late GLB completion releases textures in every material slot after world teardown', async () => {
        const { world } = setup();
        const read = world.cache.readTemplate.bind(world.cache);
        let report;
        world.cache.readTemplate = async url => {
            const template = await read(url);
            const mesh = template.getObjectByProperty('isMesh', true);
            const additionalTexture = new THREE.Texture();
            mesh.material.normalMap = additionalTexture;
            mesh.material.emissiveMap = additionalTexture;
            report = [mesh.geometry, mesh.material, mesh.material.map, additionalTexture].map(disposals);
            return template;
        };
        const pending = world.loadArea('A');
        world.dispose();
        await fails(() => pending, /closed/);
        equal(report.every(count => count() === 1), true, 'late template released by identity');
        equal(world.cache.templates.size, 0, 'no templates published after teardown');
    });

    test('unload, retry and teardown invalidate pending work without cancelling shared requests', async () => {
        for (const action of ['unload', 'retry', 'dispose']) {
            const { world } = setup();
            if (action === 'retry') {
                await world.loadArea('A');
                world.activateArea('A');
            }
            const prepare = world.cache.prepare.bind(world.cache);
            let resume;
            const gate = new Promise(resolve => { resume = resolve; });
            world.cache.prepare = async definition => { await prepare(definition); await gate; };
            const pending = world.loadArea('B');
            if (action === 'retry') {
                world.reset();
            } else if (action === 'unload') {
                world.unloadArea('B');
            } else {
                world.dispose();
            }
            const replacement = action === 'unload' ? world.loadArea('B') : null;
            resume();
            await fails(() => pending, /cancelled|closed/);
            if (replacement) {
                await replacement;
                world.activateArea('B');
            }
            equal(world.area('B').status, replacement ? 'active' : 'unloaded', 'correct generation published');
            world.dispose();
        }
    });
}
