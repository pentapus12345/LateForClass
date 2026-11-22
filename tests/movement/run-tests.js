const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const GAME_PAGE = 'index.html';
const BROWSER_TEST_PAGE = 'tests/movement/index.html';
const read = file => fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');

function readScriptSources(page) {
    return Array.from(read(page).matchAll(/<script src="([^"]+)"/g), ([, source]) => source);
}

function assertExactPath(file) {
    let directory = PROJECT_ROOT;
    for (const part of file.split('/')) {
        assert.ok(fs.readdirSync(directory).includes(part), file);
        directory = path.join(directory, part);
    }
}

// Supply the small Three.js surface needed by the production classes.
// The browser test page runs these same cases with the actual renderer library.
class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.set(x, y, z);
    }

    set(x, y, z) {
        Object.assign(this, { x, y, z });
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    sub(vector) {
        return this.set(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }
}

class Euler {
    constructor() {
        this.set(0, 0, 0, 'XYZ');
    }

    set(x, y, z, order = this.order) {
        Object.assign(this, { x, y, z, order });
    }
}

class Camera {
    position = new Vector3();
    rotation = new Euler();

    updateProjectionMatrix() {}
    updateMatrixWorld() {}

    localToWorld(vector) {
        let { x, y, z } = vector;

        // Intrinsic Euler rotations act on a local vector in reverse order.
        for (const axis of [...this.rotation.order].reverse()) {
            const angle = this.rotation[axis.toLowerCase()];
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            if (axis === 'X') {
                [y, z] = [y * cos - z * sin, y * sin + z * cos];
            } else if (axis === 'Y') {
                [x, z] = [x * cos + z * sin, z * cos - x * sin];
            } else {
                [x, y] = [x * cos - y * sin, x * sin + y * cos];
            }
        }
        return vector.set(x + this.position.x, y + this.position.y, z + this.position.z);
    }

    getWorldDirection(target) {
        return this.localToWorld(target.set(0, 0, -1)).sub(this.position);
    }
}

class Scene {
    children = [];

    add(object) {
        this.children.push(object);
    }

    remove(object) {
        this.children = this.children.filter(child => child !== object);
    }
}

class Resource extends EventTarget {
    dispose() {
        this.dispatchEvent(new Event('dispose'));
    }
}

class BufferGeometry extends Resource {
    setFromPoints(points) {
        const coordinates = Float32Array.from(points.flatMap(({ x, y, z }) => [x, y, z]));
        this.position = {
            count: coordinates.length / 3,
            getX: i => coordinates[i * 3],
            getY: i => coordinates[i * 3 + 1],
            getZ: i => coordinates[i * 3 + 2]
        };
        return this;
    }

    getAttribute(name) {
        return this[name];
    }
}

class CylinderGeometry extends Resource {
    type = 'CylinderGeometry';

    constructor(radiusTop, radiusBottom, height) {
        super();
        this.parameters = { radiusTop, radiusBottom, height };
    }
}

class BoxGeometry extends Resource {
    constructor(width, height, depth) {
        super();
        this.parameters = { width, height, depth };
    }
}

class Material extends Resource {
    constructor(options) {
        super();
        Object.assign(this, options);
    }
}

class CanvasTexture extends Resource {
    constructor(image) {
        super();
        this.image = image;
    }
}

function createCanvas() {
    const canvas = {
        getContext: () => ({
            fillRect() {},
            fillText(text) { canvas.text = text; }
        })
    };
    return canvas;
}

class Mesh {
    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.position = new Vector3();
        this.rotation = new Vector3();
    }
}

class LineSegments extends Mesh {
    isLineSegments = true;
}

const { levels } = JSON.parse(read('assets/levels.json'));
const THREE = {
    Vector3,
    PerspectiveCamera: Camera,
    Scene,
    BufferGeometry,
    CylinderGeometry,
    BoxGeometry,
    PlaneGeometry: Resource,
    CanvasTexture,
    MeshBasicMaterial: Material,
    MeshLambertMaterial: Material,
    LineBasicMaterial: Material,
    LineSegments,
    Mesh
};
const context = vm.createContext({
    THREE,
    document: { createElement: createCanvas },
    test,
    levels
});

const browserTestScripts = readScriptSources(BROWSER_TEST_PAGE);
const browserTestFiles = browserTestScripts.slice(1).map(source =>
    path.posix.join(path.posix.dirname(BROWSER_TEST_PAGE), source)
);
for (const file of browserTestFiles) {
    vm.runInContext(read(file), context, { filename: file });
}
vm.runInContext('registerMovementTests(test, levels)', context);

const gameHtml = read(GAME_PAGE);
const gameScripts = readScriptSources(GAME_PAGE);

test('the game and test pages load dependencies in order with exact filename casing', () => {
    const [library, ...gameFiles] = gameScripts;
    assert.match(library, /^https:\/\/.*\/three\.min\.js$/);
    const dependencies = ['assets/gameConfig.js', 'js/Wall.js', 'js/Level.js', 'js/Player.js'];
    assert.deepEqual(gameFiles, [...dependencies, 'js/Game.js', 'js/main.js']);
    assert.equal(browserTestScripts[0], library);
    assert.deepEqual(browserTestFiles, [...dependencies, 'tests/movement/test-movement.js']);
    for (const file of [...gameFiles, ...browserTestFiles, 'assets/levels.json']) {
        assertExactPath(file);
    }
});

class Element extends EventTarget {
    children = [];

    appendChild(child) {
        this.children.push(child);
    }
}

async function loadLevelPicker(response) {
    const list = new Element();
    list.parentElement = { hidden: true };
    const status = { hidden: false };
    const elements = new Map([['level-list', list], ['level-status', status]]);
    const errors = [];
    const page = vm.createContext({
        document: {
            getElementById: id => elements.get(id),
            createElement: tagName => Object.assign(new Element(), { tagName, setAttribute() {} })
        },
        fetch: async url => {
            assert.equal(url, '../assets/levels.json');
            return response;
        },
        console: { error: (...args) => errors.push(args) }
    });
    const [script] = readScriptSources('levels/index.html');
    const source = path.posix.join('levels', script);
    assertExactPath(source);
    await vm.runInContext(read(source), page, { filename: source });
    return { list, status, errors };
}

test('the level picker lists all named levels, including future additions', async () => {
    const definitions = [...levels, { id: 12, name: 'Future Test Level' }];
    const { list, status, errors } = await loadLevelPicker({
        ok: true, json: async () => ({ levels: definitions })
    });
    const links = list.children.map(item => item.children[0]);
    assert.deepEqual(links.map(link => [link.tagName, link.textContent, link.href]),
        definitions.map(({ id, name }) => ['a', name, `../?level=${id}`]));
    assert.equal(list.parentElement.hidden, false);
    assert.equal(status.hidden, true);
    assert.deepEqual(errors, []);
});

test('the level picker reports empty and unavailable level data', async () => {
    const empty = await loadLevelPicker({ ok: true, json: async () => ({ levels: [] }) });
    assert.equal(empty.status.textContent, 'No levels are available.');
    assert.equal(empty.list.parentElement.hidden, true);

    const failure = await loadLevelPicker({ ok: false, status: 404 });
    assert.match(failure.status.textContent, /Could not load levels/);
    assert.equal(failure.list.parentElement.hidden, true);
    assert.match(failure.errors[0][1].message, /404/);
});

async function loadGame(response, search = '') {
    const elements = new Map();
    for (const [, tag, id] of gameHtml.matchAll(/(<[^>]*\bid="([^"]+)"[^>]*>)/g)) {
        const element = new Element();
        element.disabled = /\bdisabled\b/.test(tag);
        elements.set(id, element);
    }

    let hasFocus = true;
    const document = Object.assign(new EventTarget(), {
        getElementById: id => elements.get(id) ?? null,
        createElement: createCanvas,
        hasFocus: () => hasFocus,
        pointerLockElement: null,
        exitPointerLock() {
            this.pointerLockElement = null;
            this.dispatchEvent(new Event('pointerlockchange'));
        }
    });
    const window = Object.assign(new EventTarget(), { innerWidth: 800, innerHeight: 600, location: { search } });
    window.addEventListener('blur', () => { hasFocus = false; });
    window.addEventListener('focus', () => { hasFocus = true; });
    const frames = [];
    const renderers = [];
    const errors = [];

    class Renderer {
        domElement = new Element();
        renderCount = 0;

        constructor() {
            renderers.push(this);
            this.domElement.requestPointerLock = () => {
                document.pointerLockElement = this.domElement;
                document.dispatchEvent(new Event('pointerlockchange'));
            };
        }

        setSize(width, height) {
            this.size = [width, height];
        }

        render(scene, camera) {
            this.renderCount++;
            this.scene = scene;
            this.camera = camera;
        }
    }

    const page = vm.createContext({
        document,
        window,
        URLSearchParams,
        fetch: async url => {
            assert.equal(url, 'assets/levels.json');
            return response;
        },
        requestAnimationFrame: callback => frames.push(callback),
        console: { error: (...args) => errors.push(args) },
        THREE: {
            ...THREE,
            Clock: class { getDelta() { return 0.1; } },
            Color: class {},
            Fog: class {},
            AmbientLight: class {},
            DirectionalLight: class { position = new Vector3(); },
            WebGLRenderer: Renderer
        }
    });

    for (const file of gameScripts.slice(1)) {
        await vm.runInContext(read(file), page, { filename: file });
    }
    return { document, window, elements, frames, renderers, errors };
}

test('the page boots one game and routes start, movement, resize, pause, and restart', async () => {
    const { document, window, elements, frames, renderers, errors } =
        await loadGame({ ok: true, json: async () => ({ levels }) });
    assert.deepEqual(errors, []);
    assert.equal(renderers.length, 1);
    const [{ camera, domElement }] = renderers;
    assert.deepEqual(elements.get('game-container').children, [domElement]);
    const startButton = elements.get('start-button');
    const screen = elements.get('start-screen');
    assert.equal(startButton.disabled, false);
    assert.equal(screen.hidden, false);
    assert.equal(elements.get('view-toggle').hidden, true);
    assert.equal(frames.length, 1);
    assert.equal(camera.aspect, 800 / 600);
    assert.equal(camera.position.z, levels[0].playerStart.z);

    startButton.dispatchEvent(new Event('click'));
    assert.equal(document.pointerLockElement, domElement);
    assert.equal(screen.hidden, true);
    const input = (type, code) => document.dispatchEvent(Object.assign(new Event(type), { code }));
    input('keydown', 'KeyW');
    frames.shift()();
    assert.ok(camera.position.z > levels[0].playerStart.z);
    assert.equal(frames.length, 1);

    input('keydown', 'Escape');
    const pausedZ = camera.position.z;
    frames.shift()();
    assert.equal(camera.position.z, pausedZ);
    assert.equal(document.pointerLockElement, null);
    assert.equal(screen.hidden, false);
    assert.equal(startButton.textContent, 'Resume');
    input('keydown', 'KeyR');
    assert.equal(camera.position.z, levels[0].playerStart.z);
    startButton.dispatchEvent(new Event('click'));
    assert.equal(document.pointerLockElement, domElement);
    assert.equal(frames.length, 1);

    window.innerWidth = 960;
    window.dispatchEvent(new Event('resize'));
    assert.deepEqual(renderers[0].size, [960, 600]);
    assert.equal(camera.aspect, 960 / 600);
});

test('the game routes Space and clears movement on blur and pointer unlock', async () => {
    const { document, window, elements, frames, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels }) });
    const [{ camera }] = renderers;
    const startButton = elements.get('start-button');
    const press = code => {
        const event = Object.assign(new Event('keydown', { cancelable: true }), { code });
        document.dispatchEvent(event);
        return event;
    };
    const eyeHeight = camera.position.y;
    press('Space');
    frames.shift()();
    assert.equal(camera.position.y, eyeHeight);

    startButton.dispatchEvent(new Event('click'));
    assert.equal(press('Space').defaultPrevented, true);
    press('KeyW');
    frames.shift()();
    const firstJumpY = camera.position.y;
    const forwardZ = camera.position.z;
    assert.ok(firstJumpY > eyeHeight);

    window.dispatchEvent(new Event('blur'));
    press('KeyW');
    frames.shift()();
    assert.equal(camera.position.z, forwardZ);
    assert.ok(camera.position.y > firstJumpY);

    window.dispatchEvent(new Event('focus'));
    press('KeyW');
    press('Escape');
    const pausedY = camera.position.y;
    frames.shift()();
    assert.equal(camera.position.y, pausedY);
    assert.equal(camera.position.z, forwardZ);

    startButton.dispatchEvent(new Event('click'));
    frames.shift()();
    assert.ok(camera.position.y > pausedY);
    assert.equal(camera.position.z, forwardZ);
});

test('R restores the configured non-level camera orientation after mouse look', async () => {
    const level = { ...levels[0], playerLookAt: { x: 3, y: 4, z: 6 } };
    const { document, elements, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels: [level] }) });
    const [{ camera }] = renderers;
    const direction = () => camera.getWorldDirection(new Vector3());
    const startingDirection = direction();
    assert.ok(startingDirection.x > 0 && startingDirection.y > 0);

    elements.get('start-button').dispatchEvent(new Event('click'));
    document.dispatchEvent(Object.assign(new Event('mousemove'), { movementX: 830, movementY: 240 }));
    assert.notDeepEqual(direction(), startingDirection);

    document.dispatchEvent(Object.assign(new Event('keydown'), { code: 'KeyR' }));
    assert.deepEqual(direction(), startingDirection);
    assert.equal(camera.rotation.z, 0);
    document.dispatchEvent(Object.assign(new Event('mousemove'), { movementX: 300, movementY: 0 }));
    assert.ok(Math.abs(direction().y - startingDirection.y) < 1e-9);
});

test('the level query selects the playground and restart keeps that level', async () => {
    const response = { ok: true, json: async () => ({ levels }) };
    const { document, elements, frames, renderers } = await loadGame(response, '?level=2');
    const [{ camera, scene }] = renderers;
    assert.equal(elements.get('screen-title').textContent, 'Physics Playground');
    assert.equal(camera.position.z, levels[1].playerStart.z);
    assert.equal(scene.children.filter(object => object.isLineSegments).length, levels[1].platforms.length);

    elements.get('start-button').dispatchEvent(new Event('click'));
    assert.equal(elements.get('objective').hidden, true);
    document.dispatchEvent(Object.assign(new Event('keydown'), { code: 'KeyW' }));
    frames.shift()();
    assert.ok(camera.position.z > levels[1].playerStart.z);
    document.dispatchEvent(Object.assign(new Event('keydown'), { code: 'KeyR' }));
    assert.equal(camera.position.z, levels[1].playerStart.z);
    assert.equal(scene.children.filter(object => object.isLineSegments).length, levels[1].platforms.length);

    const fallback = await loadGame(response, '?level=unknown');
    assert.equal(fallback.elements.get('screen-title').textContent, 'Late For Class');
    assert.equal(fallback.renderers[0].camera.position.z, levels[0].playerStart.z);
});

test('the classroom prompts for E in range and R restores its closed door, spawn, and view', async () => {
    const { document, elements, frames, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const [{ camera, scene }] = renderers;
    const { playerStart, platforms, door, destinationRoomId } = levels.find(level => level.id === 3);
    const startingPosition = camera.position.clone();
    const startingDirection = camera.getWorldDirection(new Vector3());
    const dispatch = (type, properties) => document.dispatchEvent(Object.assign(new Event(type), properties));
    assert.equal(elements.get('screen-title').textContent, 'Corridor and Classroom');
    assert.equal(camera.position.z, playerStart.z);
    assert.equal(scene.children.filter(object => object.isLineSegments).length, platforms.length + 2);
    const initialPanel = scene.children.find(object => object.name === door.name);
    assert.equal(initialPanel.rotation.y, 0);
    const sign = scene.children.find(object => object.name === `Room ${destinationRoomId}`);
    assert.equal(sign.material.map.image.text, `Room ${destinationRoomId}`);
    let textureDisposed = false;
    sign.material.map.addEventListener('dispose', () => { textureDisposed = true; });

    elements.get('start-button').dispatchEvent(new Event('click'));
    const objective = elements.get('objective');
    assert.equal(objective.hidden, false);
    assert.equal(objective.textContent, `Find Room ${destinationRoomId}`);
    dispatch('keydown', { code: 'KeyE' });
    assert.equal(initialPanel.rotation.y, 0);
    dispatch('keydown', { code: 'KeyW' });
    for (let frame = 0; frame < 15; frame++) {
        frames.shift()();
    }
    assert.ok(camera.position.z < 0);
    assert.equal(objective.hidden, false);
    assert.equal(objective.textContent, 'Press E to open the door');
    dispatch('keydown', { code: 'KeyE' });
    assert.equal(objective.textContent, `Find Room ${destinationRoomId}`);
    assert.equal(initialPanel.rotation.y, -Math.PI / 2);
    for (let frame = 0; frame < 5; frame++) {
        frames.shift()();
    }
    assert.ok(camera.position.z > 2);
    dispatch('mousemove', { movementX: 400, movementY: 200 });
    assert.notDeepEqual(camera.getWorldDirection(new Vector3()), startingDirection);
    dispatch('keydown', { code: 'KeyR' });
    frames.shift()();
    assert.deepEqual(camera.position, startingPosition);
    assert.deepEqual(camera.getWorldDirection(new Vector3()), startingDirection);
    assert.equal(scene.children.filter(object => object.isLineSegments).length, platforms.length + 2);
    const resetPanel = scene.children.find(object => object.name === door.name);
    assert.notEqual(resetPanel, initialPanel);
    assert.equal(scene.children.includes(initialPanel), false);
    assert.equal(resetPanel.rotation.y, 0);
    assert.equal(textureDisposed, true);
    assert.equal(scene.children.filter(object => object.name === `Room ${destinationRoomId}`).length, 1);
});

test('classroom views switch before start, during play, and while paused', async () => {
    const { document, elements, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const [renderer] = renderers;
    const { camera, scene } = renderer;
    const floor = scene.children.find(object => object.name === 'Corridor floor');
    const outline = scene.children.find(object => object.name === 'Corridor floor collision');
    const initialPosition = camera.position.clone();
    const initialDirection = camera.getWorldDirection(new Vector3());
    const viewStatus = elements.get('view-status');
    const viewToggle = elements.get('view-toggle');
    const press = code => document.dispatchEvent(Object.assign(new Event('keydown'), { code }));
    const renderCount = renderer.renderCount;
    assert.equal(viewStatus.hidden, true);
    assert.equal(viewToggle.hidden, false);
    assert.equal(viewToggle.textContent, 'Show collision outlines');
    assert.equal(floor.visible, true);
    assert.equal(outline.visible, false);
    press('KeyV');
    assert.equal(floor.visible, false);
    assert.equal(outline.visible, true);
    assert.equal(viewToggle.textContent, 'Return to solid view');
    assert.equal(renderer.renderCount, renderCount + 1);
    viewToggle.dispatchEvent(new Event('click'));
    assert.equal(floor.visible, true);
    assert.equal(outline.visible, false);
    assert.equal(renderer.renderCount, renderCount + 2);

    elements.get('start-button').dispatchEvent(new Event('click'));
    assert.equal(viewStatus.hidden, false);
    assert.match(viewStatus.textContent, /Show collision outlines/);
    press('KeyV');
    assert.equal(floor.visible, false);
    assert.equal(outline.visible, true);
    assert.match(viewStatus.textContent, /Return to solid view/);

    press('Escape');
    assert.equal(viewStatus.hidden, true);
    assert.equal(viewToggle.textContent, 'Return to solid view');
    const pausedRenderCount = renderer.renderCount;
    viewToggle.dispatchEvent(new Event('click'));
    assert.equal(floor.visible, true);
    assert.equal(outline.visible, false);
    press('KeyV');
    assert.equal(floor.visible, false);
    assert.equal(outline.visible, true);
    assert.equal(renderer.renderCount, pausedRenderCount + 2);
    assert.deepEqual(camera.position, initialPosition);
    assert.deepEqual(camera.getWorldDirection(new Vector3()), initialDirection);
    assert.equal(scene.children.find(object => object.name === 'Classroom door').rotation.y, 0);
});

test('E completes the connected scene only inside the marker and R resets the run', async () => {
    const { document, elements, frames, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const [{ camera, scene }] = renderers;
    const { destinationRoomId, door, playerStart } = levels.find(level => level.id === 3);
    const startButton = elements.get('start-button');
    const objective = elements.get('objective');
    const input = (type, code) => document.dispatchEvent(Object.assign(new Event(type), { code }));
    const advanceFrames = count => {
        for (let frame = 0; frame < count; frame++) {
            frames.shift()();
        }
    };
    startButton.dispatchEvent(new Event('click'));
    input('keydown', 'KeyW');
    advanceFrames(12);
    input('keydown', 'KeyE');
    advanceFrames(4);
    input('keydown', 'KeyE');
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(objective.textContent, `Find Room ${destinationRoomId}`);

    advanceFrames(5);
    input('keyup', 'KeyW');
    assert.equal(objective.textContent, `Press E to confirm arrival at Room ${destinationRoomId}`);
    input('keydown', 'KeyE');
    assert.equal(elements.get('screen-message').textContent, `You arrived at Room ${destinationRoomId}.`);
    assert.equal(startButton.textContent, 'Play Again');
    assert.equal(document.pointerLockElement, null);

    input('keydown', 'KeyR');
    assert.equal(camera.position.z, playerStart.z);
    assert.equal(scene.children.find(object => object.name === door.name).rotation.y, 0);
    startButton.dispatchEvent(new Event('click'));
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(objective.textContent, `Find Room ${destinationRoomId}`);
});

test('failed or missing level data leaves the game disabled and shows an error', async () => {
    for (const [response, message] of [
        [{ ok: false, status: 404 }, /Failed to load levels.json: 404/],
        [{ ok: true, json: async () => ({ levels: [] }) }, /Level 1 is missing/]
    ]) {
        const { elements, frames, renderers, errors } = await loadGame(response);
        assert.equal(elements.get('start-button').disabled, true);
        assert.match(elements.get('screen-message').textContent, /Could not load the game/);
        assert.equal(frames.length, 0);
        assert.equal(renderers.length, 0);
        assert.equal(errors.length, 1);
        assert.match(errors[0][1].message, message);
    }
});
