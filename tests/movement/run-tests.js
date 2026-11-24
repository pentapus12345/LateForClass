const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const GAME_PAGE = 'index.html';
const BROWSER_TEST_PAGE = 'tests/movement/index.html';
const THREE_LIBRARY = 'assets/vendor/three-r128/three.min.js';
const GLTF_LOADER = 'assets/vendor/three-r128/GLTFLoader.js';
const read = file => fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');

// Parse real mesh data offline. The browser suite decodes the embedded textures.
const modelThree = require(path.join(PROJECT_ROOT, THREE_LIBRARY));
class OfflineImageLoader extends modelThree.Loader {
    isImageBitmapLoader = true;

    load(url, onLoad) {
        onLoad({ width: 1, height: 1 });
    }
}
const loaderThree = { ...modelThree, ImageBitmapLoader: OfflineImageLoader };
vm.runInNewContext(read(GLTF_LOADER), {
    THREE: loaderThree,
    ArrayBuffer,
    Blob,
    TextDecoder,
    self: { URL },
    navigator: { userAgent: 'Node.js' },
    createImageBitmap: true
});
function localModelResponse(url) {
    const data = fs.readFileSync(path.join(PROJECT_ROOT, url));
    return { ok: true, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) };
}

function readScriptSources(page) {
    return Array.from(read(page).matchAll(/<script src="([^"]+)"/g), ([, source]) => source.split('?')[0]);
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

    getAttribute(name) {
        this.geometry ??= new modelThree.BoxGeometry(...Object.values(this.parameters));
        return this.geometry.getAttribute(name);
    }

    computeTangents() {
        this.geometry.computeTangents();
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
            fillRect() { canvas.backgroundColor = this.fillStyle; },
            fillText(text) {
                canvas.text = text;
                (canvas.lines ??= []).push(text);
            }
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
        this.children = [];
    }

    add(child) {
        this.children.push(child);
    }
}

class LineSegments extends Mesh {
    isLineSegments = true;
}

class Light {
    constructor(color, intensity) {
        this.color = color;
        this.intensity = intensity;
        this.position = new Vector3();
    }
}

class HemisphereLight extends Light {
    constructor(color, groundColor, intensity) {
        super(color, intensity);
        this.groundColor = groundColor;
    }
}

class PointLight extends Light {
    shadow = {
        camera: new Camera(),
        mapSize: new Vector3(),
        dispose() { this.map?.dispose(); }
    };
}

class TargetLight extends PointLight {
    target = { position: new Vector3() };
}

const { levels } = JSON.parse(read('assets/levels.json'));
const THREE = {
    Vector3,
    Box3: modelThree.Box3,
    Group: modelThree.Group,
    LoaderUtils: modelThree.LoaderUtils,
    GLTFLoader: loaderThree.GLTFLoader,
    PerspectiveCamera: Camera,
    Scene,
    BufferGeometry,
    CylinderGeometry,
    BoxGeometry,
    PlaneGeometry: Resource,
    CanvasTexture,
    MeshBasicMaterial: Material,
    MeshLambertMaterial: Material,
    MeshPhongMaterial: Material,
    LineBasicMaterial: Material,
    LineSegments,
    AmbientLight: Light,
    HemisphereLight,
    PointLight,
    DirectionalLight: TargetLight,
    SpotLight: TargetLight,
    PCFSoftShadowMap: 2,
    Mesh
};
const models = new Map();
const context = vm.createContext({
    THREE,
    document: { createElement: createCanvas },
    test,
    levels,
    models,
    fetch: async url => localModelResponse(url)
});

const browserTestScripts = readScriptSources(BROWSER_TEST_PAGE);
const browserTestFiles = browserTestScripts.slice(2).map(source =>
    path.posix.join(path.posix.dirname(BROWSER_TEST_PAGE), source)
);
for (const file of browserTestFiles) {
    vm.runInContext(read(file), context, { filename: file });
}
test.before(async () => {
    const loaded = await vm.runInContext(`
        const classroom = new Level(levels[2], GAME_CONFIG);
        classroom.loadEnvironmentModels('assets/levels.json').then(() => classroom.models);
    `, context);
    for (const [model, template] of loaded) {
        models.set(model, template);
    }
});
vm.runInContext('registerMovementTests(test, levels, models)', context);

const gameHtml = read(GAME_PAGE);
const gameScripts = readScriptSources(GAME_PAGE);

test('the game and test pages load dependencies in order with exact filename casing', () => {
    const [library, loader, ...gameFiles] = gameScripts;
    assert.equal(library, THREE_LIBRARY);
    assert.equal(loader, GLTF_LOADER);
    assertExactPath('assets/vendor/three-r128/LICENSE');
    const dependencies = ['assets/gameConfig.js', 'js/controls.js', 'js/Wall.js', 'js/EnvironmentObjectFactory.js',
        'js/LightingManager.js', 'js/Level.js', 'js/Player.js', 'js/SchoolClock.js', 'js/GameSession.js'];
    assert.deepEqual(gameFiles, [...dependencies, 'js/GameUI.js', 'js/Game.js', 'js/main.js']);
    assert.equal(path.posix.join(path.posix.dirname(BROWSER_TEST_PAGE), browserTestScripts[0]), library);
    assert.equal(path.posix.join(path.posix.dirname(BROWSER_TEST_PAGE), browserTestScripts[1]), loader);
    assert.deepEqual(browserTestFiles, [...dependencies, 'tests/movement/test-movement.js']);
    for (const file of [library, loader, ...gameFiles, ...browserTestFiles, 'assets/levels.json']) {
        assertExactPath(file);
    }
});

class Element extends EventTarget {
    children = [];
    focus() {}

    get valueAsNumber() {
        return Number(this.value);
    }

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

function createGameElements() {
    const elements = new Map();
    for (const [, tag, id] of gameHtml.matchAll(/(<[^>]*\bid="([^"]+)"[^>]*>)/g)) {
        const element = new Element();
        element.disabled = /\bdisabled\b/.test(tag);
        element.hidden = /\bhidden\b/.test(tag);
        elements.set(id, element);
    }
    const fields = new Map();
    for (const [, tag, name] of gameHtml.matchAll(/(<(?:input|select)\b[^>]*\bname="([^"]+)"[^>]*>)/g)) {
        const id = tag.match(/\bid="([^"]+)"/)?.[1];
        fields.set(name, elements.get(id) ?? new Element());
    }
    elements.get('control-form').elements = { namedItem: name => fields.get(name) };
    return elements;
}

async function loadGame(response, search = '', storage = new Map(), loadModel = localModelResponse) {
    const elements = createGameElements();
    let hasFocus = true;
    const document = Object.assign(new EventTarget(), {
        getElementById: id => elements.get(id) ?? null,
        createElement: createCanvas,
        hasFocus: () => hasFocus,
        hidden: false,
        pointerLockElement: null,
        exitPointerLock() {
            this.pointerLockElement = null;
            this.dispatchEvent(new Event('pointerlockchange'));
        }
    });
    const window = Object.assign(new EventTarget(), {
        innerWidth: 800,
        innerHeight: 600,
        location: { search },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
    });
    window.addEventListener('blur', () => { hasFocus = false; });
    window.addEventListener('focus', () => { hasFocus = true; });
    const frames = [];
    const renderers = [];
    const errors = [];
    const modelRequests = [];
    let now = 0;
    const advanceTime = milliseconds => { now += milliseconds; };

    class Renderer {
        domElement = new Element();
        shadowMap = {};
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
        AbortSignal,
        fetch: async (url, { cache, signal }) => {
            assert.ok(signal instanceof AbortSignal);
            if (url.startsWith('assets/models/')) {
                modelRequests.push(url);
                return loadModel(url);
            }
            assert.equal(url, 'assets/levels.json');
            assert.equal(cache, 'no-cache');
            if (response instanceof Error) {
                throw response;
            }
            return response;
        },
        performance: { now: () => now },
        requestAnimationFrame: callback => frames.push((milliseconds = 100) => {
            advanceTime(milliseconds);
            callback(now);
        }),
        console: { error: (...args) => errors.push(args) },
        THREE: {
            ...THREE,
            Clock: class { getDelta() { return 0.1; } },
            Color: class {},
            Fog: class {},
            WebGLRenderer: Renderer
        }
    });

    for (const file of gameScripts.slice(2)) {
        await vm.runInContext(read(file), page, { filename: file });
    }
    return { document, window, elements, frames, renderers, errors, advanceTime, modelRequests };
}

test('GameUI presents supplied session state and sends menu actions through callbacks', () => {
    const elements = createGameElements();
    const page = vm.createContext({ document: { getElementById: id => elements.get(id) } });
    for (const file of ['js/controls.js', 'js/GameUI.js']) {
        vm.runInContext(read(file), page, { filename: file });
    }
    const ui = vm.runInContext('new GameUI(document)', page);
    const schedule = { className: 'Art', roomId: '102', startTime: '08:30' };
    ui.configure({ title: 'School', message: 'Find your room.', schedule, hasClock: true, supportsViewToggle: true });
    ui.renderSession({ phase: 'ready', schedule, schoolTime: '08:00' });
    assert.equal(elements.get('screen-title').textContent, 'School');
    assert.equal(elements.get('schedule-panel').hidden, true);
    assert.equal(elements.get('schedule-room').textContent, 'Room 102');

    ui.renderSession({ phase: 'running', schedule, schoolTime: '08:30' });
    ui.renderObjective('Find Room 102');
    ui.renderView(true, true);
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(elements.get('schedule-panel').hidden, false);
    assert.equal(elements.get('school-time').dateTime, '08:30');
    assert.equal(elements.get('objective').textContent, 'Find Room 102');
    assert.equal(elements.get('view-status').textContent, 'V · Return to solid view');

    ui.renderSession({ phase: 'paused', schedule, schoolTime: '08:30' }, true);
    assert.match(elements.get('screen-message').textContent, /Could not capture the cursor/);
    ui.renderSession({ phase: 'late', schedule, schoolTime: '08:30' });
    assert.equal(elements.get('start-button').textContent, 'Retry');
    assert.equal(elements.get('objective').hidden, true);
    assert.equal(elements.get('screen-message').textContent, 'Art started at 08:30 in Room 102.');

    const actions = [];
    ui.bindActions({
        start: () => actions.push('start'),
        toggleView: () => actions.push('view'),
        setOptionsOpen: open => actions.push(open),
        applyControls: settings => actions.push(settings.keyboardLayout)
    });
    elements.get('control-form').elements.namedItem('keyboardLayout').value = 'swapped';
    for (const id of ['start-button', 'view-toggle', 'options-button', 'options-back', 'restore-controls']) {
        elements.get(id).dispatchEvent(new Event('click'));
    }
    elements.get('control-form').dispatchEvent(new Event('input'));
    assert.deepEqual(actions, ['start', 'view', true, false, 'standard', 'swapped']);
    ui.setEnabled(true);
    ui.showLoadError('Could not load the game. Reload the page to try again.');
    assert.equal(elements.get('start-button').disabled, true);
    assert.equal(elements.get('options-button').disabled, true);
    assert.match(elements.get('screen-message').textContent, /Could not load the game/);
});

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
    assert.equal(elements.get('schedule-panel').hidden, true);
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
    assert.equal(camera.position.y, firstJumpY);

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

test('the school clock uses active time across pause, focus, visibility, and pointer lock changes', async () => {
    const { document, window, elements, frames, renderers, advanceTime } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const time = elements.get('school-time');
    const start = elements.get('start-button');
    const press = code => document.dispatchEvent(Object.assign(new Event('keydown'), { code }));
    const frame = milliseconds => frames.shift()(milliseconds);
    const setHidden = hidden => {
        document.hidden = hidden;
        document.dispatchEvent(new Event('visibilitychange'));
    };
    frame(60000);
    assert.equal(time.textContent, '08:00');
    const { domElement } = renderers[0];
    const requestLock = domElement.requestPointerLock;
    domElement.requestPointerLock = () => {};
    start.dispatchEvent(new Event('click'));
    frame(60000);
    assert.equal(time.textContent, '08:00');
    domElement.requestPointerLock = requestLock;
    requestLock();
    frame(10000);
    assert.equal(time.textContent, '08:10');
    advanceTime(750);
    press('Escape');
    frame(100000);
    assert.equal(time.textContent, '08:10');
    elements.get('options-button').dispatchEvent(new Event('click'));
    frame(100000);
    elements.get('options-back').dispatchEvent(new Event('click'));
    start.dispatchEvent(new Event('click'));
    frame(250);
    assert.equal(time.textContent, '08:11');

    window.dispatchEvent(new Event('blur'));
    frame(100000);
    assert.equal(time.textContent, '08:11');
    setHidden(true);
    window.dispatchEvent(new Event('focus'));
    frame(100000);
    assert.equal(time.textContent, '08:11');
    setHidden(false);
    frame(2000);
    assert.equal(time.textContent, '08:13');
    assert.equal(time.dateTime, '08:13');
    press('KeyR');
    assert.equal(time.textContent, '08:00');
    frame(1000);
    assert.equal(time.textContent, '08:01');
});

test('losing pointer lock at the deadline still records a timeout before the next frame', async () => {
    const { document, elements, advanceTime } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const start = elements.get('start-button');
    start.dispatchEvent(new Event('click'));
    advanceTime(60000);
    document.exitPointerLock();
    assert.equal(elements.get('screen-title').textContent, 'You’re Late!');
    assert.equal(elements.get('school-time').textContent, '09:00');
    assert.equal(start.textContent, 'Retry');
});

test('crossing the classroom before the exact deadline wins and crossing at it times out', async () => {
    const definitions = levels.map(level => level.id !== 3 ? level : {
        ...level, schedule: { ...level.schedule, roomId: '003' }
    });
    for (const arrivalMs of [59999, 60000]) {
        const { document, elements, frames, renderers } =
            await loadGame({ ok: true, json: async () => ({ levels: definitions }) }, '?level=3');
        const [{ scene, camera }] = renderers;
        const clickStart = () => elements.get('start-button').dispatchEvent(new Event('click'));
        const press = code => document.dispatchEvent(Object.assign(new Event('keydown'), { code }));
        const panel = () => scene.children.find(object => object.name === 'Classroom door');
        clickStart();
        press('KeyW');
        for (let frame = 0; frame < 12; frame++) {
            frames.shift()();
        }
        press('KeyE');
        frames.shift()();
        assert.equal(panel().rotation.y, -Math.PI / 2);
        assert.equal(elements.get('start-screen').hidden, true);

        frames.shift()(arrivalMs - 1300);
        const onTime = arrivalMs < 60000;
        assert.equal(elements.get('screen-title').textContent, onTime ? 'You made it to class!' : 'You’re Late!');
        assert.equal(elements.get('start-button').textContent, onTime ? 'Play Again' : 'Retry');
        assert.equal(elements.get('school-time').textContent, onTime ? '08:59' : '09:00');
        assert.equal(document.pointerLockElement, null);
        assert.equal(camera.position.z >= 0.425, onTime);
        press('KeyE');
        frames.shift()(120000);
        assert.equal(elements.get('screen-title').textContent, onTime ? 'You made it to class!' : 'You’re Late!');

        clickStart();
        assert.equal(elements.get('start-screen').hidden, true);
        assert.equal(camera.position.z, -6);
        assert.equal(panel().rotation.y, 0);
        assert.equal(elements.get('school-time').textContent, '08:00');
        assert.equal(elements.get('objective').textContent, 'Find Room 003');
    }
});

test('a configured school start and speed enforce the class time supplied by the schedule', async () => {
    const schedule = { className: 'Art', roomId: 'A1', startTime: '14:01' };
    const definitions = levels.map(level => level.id !== 3 ? level : {
        ...level, clock: { startTime: '14:00', timeScale: 30 }, schedule
    });
    const { elements, frames } =
        await loadGame({ ok: true, json: async () => ({ levels: definitions }) }, '?level=3');
    elements.get('start-button').dispatchEvent(new Event('click'));
    frames.shift()(1999);
    assert.equal(elements.get('school-time').textContent, '14:00');
    assert.equal(elements.get('start-screen').hidden, true);
    frames.shift()(1);
    assert.equal(elements.get('school-time').textContent, '14:01');
    assert.equal(elements.get('screen-message').textContent, 'Art started at 14:01 in Room A1.');
    assert.equal(elements.get('start-button').textContent, 'Retry');
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

test('Options saves the selected controls, reloads them, and restores all defaults', async () => {
    const response = { ok: true, json: async () => ({ levels }) };
    const storage = new Map();
    const first = await loadGame(response, '?level=3', storage);
    const { document, elements } = first;
    const click = id => elements.get(id).dispatchEvent(new Event('click'));
    const form = elements.get('control-form');
    const readField = (fields, name, sample) => {
        const field = fields.namedItem(name);
        if (typeof sample === 'boolean') {
            return field.checked;
        }
        return typeof sample === 'number' ? field.valueAsNumber : field.value;
    };
    const changed = {
        keyboardLayout: 'swapped', keyboardLook: false, keyboardLookSpeed: 165,
        mouseLook: false, mouseSensitivity: 2.5, invertMouseY: true, clickToJump: true
    };
    const defaults = {
        keyboardLayout: 'standard', keyboardLook: true, keyboardLookSpeed: 120,
        mouseLook: true, mouseSensitivity: 1, invertMouseY: false, clickToJump: false
    };
    assert.equal(elements.get('options-screen').hidden, true);
    click('options-button');
    assert.equal(elements.get('options-screen').hidden, false);
    assert.equal(elements.get('start-screen').hidden, true);
    for (const [name, value] of Object.entries(changed)) {
        const field = form.elements.namedItem(name);
        if (typeof value === 'boolean') {
            field.checked = value;
        } else {
            field.value = String(value);
        }
        form.dispatchEvent(new Event('input'));
    }
    assert.equal(elements.get('keyboard-speed-value').textContent, '165°/s');
    assert.equal(elements.get('mouse-sensitivity-value').textContent, '2.5×');
    click('options-back');
    assert.equal(elements.get('options-screen').hidden, true);
    assert.equal(elements.get('start-screen').hidden, false);
    assert.equal(elements.get('start-button').textContent, 'Start Game');
    assert.equal(document.pointerLockElement, null);
    assert.match(elements.get('instructions').textContent, /Arrow keys to move · Space or left click to jump/);

    const reloaded = await loadGame(response, '?level=3', storage);
    for (const [name, value] of Object.entries(changed)) {
        assert.equal(readField(reloaded.elements.get('control-form').elements, name, value), value);
    }
    reloaded.elements.get('options-button').dispatchEvent(new Event('click'));
    reloaded.elements.get('restore-controls').dispatchEvent(new Event('click'));
    assert.equal(reloaded.elements.get('options-status').hidden, true);
    const restored = await loadGame(response, '?level=3', storage);
    for (const [name, value] of Object.entries(defaults)) {
        assert.equal(readField(restored.elements.get('control-form').elements, name, value), value);
    }
});

test('jump inputs respect the saved click setting, pointer lock, and held Space', async () => {
    const response = { ok: true, json: async () => ({ levels }) };
    const { document, elements, frames, renderers } = await loadGame(response);
    const { camera, domElement } = renderers[0];
    const eyeHeight = camera.position.y;
    const click = id => elements.get(id).dispatchEvent(new Event('click'));
    const press = (code, repeat = false) => document.dispatchEvent(Object.assign(new Event('keydown'), { code, repeat }));
    const mouseDown = button => domElement.dispatchEvent(Object.assign(new Event('mousedown'), { button }));
    const frame = () => frames.shift()();
    click('start-button');
    mouseDown(0);
    frame();
    assert.equal(camera.position.y, eyeHeight);
    press('Space');
    frame();
    assert.ok(camera.position.y > eyeHeight);
    for (let step = 0; step < 12; step++) {
        frame();
    }
    assert.equal(camera.position.y, eyeHeight);
    press('Space', true);
    frame();
    assert.equal(camera.position.y, eyeHeight);
    press('Escape');
    click('options-button');
    const form = elements.get('control-form');
    form.elements.namedItem('clickToJump').checked = true;
    form.dispatchEvent(new Event('input'));
    mouseDown(0);
    press('Space');
    frame();
    click('options-back');
    click('start-button');
    frame();
    assert.equal(camera.position.y, eyeHeight);
    mouseDown(2);
    frame();
    assert.equal(camera.position.y, eyeHeight);
    mouseDown(0);
    frame();
    assert.ok(camera.position.y > eyeHeight);
    press('KeyR');
    press('Space');
    frame();
    assert.ok(camera.position.y > eyeHeight);
});

test('invalid or blocked local storage leaves Options usable', async () => {
    const response = { ok: true, json: async () => ({ levels }) };
    const corrupted = new Map([['lateForClass.controls', JSON.stringify({
        keyboardLayout: 'unknown', keyboardLook: false, keyboardLookSpeed: -500,
        mouseLook: 'false', mouseSensitivity: 70
    })]]);
    const { elements } = await loadGame(response, '', corrupted);
    const fields = elements.get('control-form').elements;
    assert.equal(fields.namedItem('keyboardLayout').value, 'standard');
    assert.equal(fields.namedItem('keyboardLook').checked, false);
    assert.equal(fields.namedItem('keyboardLookSpeed').valueAsNumber, 30);
    assert.equal(fields.namedItem('mouseLook').checked, true);
    assert.equal(fields.namedItem('mouseSensitivity').valueAsNumber, 4);

    const blocked = {
        get() { throw new Error('Storage unavailable'); },
        set() { throw new Error('Storage unavailable'); }
    };
    const session = await loadGame(response, '', blocked);
    assert.deepEqual(session.errors, []);
    const form = session.elements.get('control-form');
    assert.equal(form.elements.namedItem('keyboardLayout').value, 'standard');
    session.elements.get('options-button').dispatchEvent(new Event('click'));
    form.elements.namedItem('keyboardLayout').value = 'swapped';
    form.dispatchEvent(new Event('input'));
    assert.equal(session.elements.get('options-status').hidden, false);
    assert.match(session.elements.get('instructions').textContent, /Arrow keys to move/);
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

test('startup loads each furniture asset once and reports a failed asset request', async () => {
    const response = { ok: true, json: async () => ({ levels }) };
    const game = await loadGame(response, '?level=3');
    assert.equal(game.elements.get('start-button').disabled, false);
    const expectedModels = Object.values(levels[2].modelCatalog).map(({ model }) => `assets/${model}`).sort();
    assert.deepEqual([...game.modelRequests].sort(), expectedModels);
    const desk = () => game.renderers[0].scene.children.find(object => object.name === 'Room 003 back east outer desk');
    const original = desk();
    game.elements.get('start-button').dispatchEvent(new Event('click'));
    game.document.dispatchEvent(Object.assign(new Event('keydown'), { code: 'KeyR' }));
    assert.ok(desk());
    assert.notEqual(desk(), original);
    assert.equal(game.modelRequests.length, expectedModels.length);

    const failure = await loadGame(response, '?level=3', new Map(), () => ({ ok: false, status: 404 }));
    assert.equal(failure.elements.get('start-button').disabled, true);
    assert.equal(failure.renderers.length, 0);
    assert.match(failure.elements.get('screen-message').textContent, /Could not load/);
    assert.match(failure.errors[0][1].message, /Failed to load furniture model assets\/models\//);
    assert.match(failure.errors[0][1].cause.message, /404/);
});

test('the classroom prompts for E in range and R restores its closed door, spawn, and view', async () => {
    const { document, elements, frames, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const [{ camera, scene }] = renderers;
    const { playerStart, platforms, doors, schedule: { roomId } } = levels.find(level => level.id === 3);
    const [door] = doors;
    const startingPosition = camera.position.clone();
    const startingDirection = camera.getWorldDirection(new Vector3());
    const dispatch = (type, properties) => document.dispatchEvent(Object.assign(new Event(type), properties));
    assert.equal(elements.get('screen-title').textContent, 'Corridor and Classroom');
    assert.equal(camera.position.z, playerStart.z);
    const geometryNames = new Set([...platforms, ...doors].map(object => `${object.name} collision`));
    const countStructuralOutlines = () => scene.children.filter(object => geometryNames.has(object.name)).length;
    assert.equal(countStructuralOutlines(), platforms.length + doors.length);
    const initialPanel = scene.children.find(object => object.name === door.name);
    assert.equal(initialPanel.rotation.y, 0);
    assert.equal(initialPanel.material.color, door.surfaceColor);
    assert.equal(scene.children.find(object => object.name === `${door.name} collision`).material.color, door.color);
    const sign = scene.children.find(object => object.name === `Room ${roomId}`);
    assert.equal(sign.material.map.image.text, `Room ${roomId}`);
    const origin = scene.children.find(object => object.name === 'Corridor origin');
    const farEnd = scene.children.find(object => object.name === 'Corridor far end');
    assert.equal(origin.material.map.image.backgroundColor, '#a6d4ca');
    assert.equal(sign.material.map.image.backgroundColor, '#c79b53');
    const landingSign = scene.children.find(object => object.name === 'First-floor landing');
    assert.equal(landingSign.material.map.image.backgroundColor, '#38261b');
    assert.deepEqual(landingSign.material.map.image.lines, levels[2].signs.find(sign => sign.name === landingSign.name).lines);
    assert.deepEqual(origin.material.map.image.lines, [
        'Ground floor · Corridor origin', 'Face into the corridor', '001 left · 002 right', '003 straight ahead',
        'Stairs near 003'
    ]);
    assert.deepEqual(farEnd.material.map.image.lines, [
        'Ground floor · Far end', 'Room 003 here', 'Turn toward the origin', '002 left · 001 right'
    ]);
    let textureDisposed = false;
    let originDisposed = false;
    sign.material.map.addEventListener('dispose', () => { textureDisposed = true; });
    origin.material.map.addEventListener('dispose', () => { originDisposed = true; });

    elements.get('start-button').dispatchEvent(new Event('click'));
    const objective = elements.get('objective');
    assert.equal(objective.hidden, false);
    assert.equal(objective.textContent, `Find Room ${roomId}`);
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
    assert.equal(objective.textContent, `Find Room ${roomId}`);
    assert.equal(initialPanel.rotation.y, -Math.PI / 2);
    dispatch('mousemove', { movementX: 400, movementY: 200 });
    assert.notDeepEqual(camera.getWorldDirection(new Vector3()), startingDirection);
    dispatch('keydown', { code: 'KeyR' });
    frames.shift()();
    assert.deepEqual(camera.position, startingPosition);
    assert.deepEqual(camera.getWorldDirection(new Vector3()), startingDirection);
    assert.equal(countStructuralOutlines(), platforms.length + doors.length);
    const resetPanel = scene.children.find(object => object.name === door.name);
    assert.notEqual(resetPanel, initialPanel);
    assert.equal(scene.children.includes(initialPanel), false);
    assert.equal(resetPanel.rotation.y, 0);
    assert.equal(textureDisposed, true);
    assert.equal(originDisposed, true);
    assert.equal(scene.children.filter(object => object.name === `Room ${roomId}`).length, 1);
});

test('a configured schedule supplies the displayed class, room, start time, and objective', async () => {
    const schedule = { className: 'Art & Design', roomId: 'A1', startTime: '13:45' };
    const definitions = levels.map(level => level.id !== 3 ? level : {
        ...level,
        schedule,
        doors: level.doors.map(door => door.roomId === level.schedule.roomId ? { ...door, roomId: schedule.roomId } : door),
        classrooms: level.classrooms.map(room => room.id === level.schedule.roomId ? { ...room, id: schedule.roomId } : room)
    });
    const { document, elements, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels: definitions }) }, '?level=3');
    const panel = elements.get('schedule-panel');
    const startButton = elements.get('start-button');
    const time = elements.get('schedule-start-time');
    assert.equal(panel.hidden, true);
    startButton.dispatchEvent(new Event('click'));
    assert.equal(panel.hidden, false);
    assert.equal(elements.get('schedule-class-name').textContent, schedule.className);
    assert.equal(elements.get('schedule-room').textContent, 'Room A1');
    assert.equal(time.textContent, schedule.startTime);
    assert.equal(time.dateTime, schedule.startTime);
    assert.equal(elements.get('objective').textContent, 'Find Room A1');
    const sign = renderers[0].scene.children.find(object => object.name === 'Room A1');
    assert.equal(sign.material.map.image.text, 'Room A1');
    document.exitPointerLock();
    assert.equal(panel.hidden, true);
    startButton.dispatchEvent(new Event('click'));
    assert.equal(panel.hidden, false);
    assert.equal(time.textContent, schedule.startTime);
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

test('walking fully into the scheduled room completes the level and R resets the run', async () => {
    const definitions = levels.map(level => level.id !== 3 ? level : {
        ...level, schedule: { ...level.schedule, roomId: '003' }
    });
    const { document, elements, frames, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels: definitions }) }, '?level=3');
    const [{ camera, scene }] = renderers;
    const { schedule: { roomId }, doors: [door], playerStart } = definitions.find(level => level.id === 3);
    const startButton = elements.get('start-button');
    const objective = elements.get('objective');
    const schedule = elements.get('schedule-panel');
    const input = (type, code) => document.dispatchEvent(Object.assign(new Event(type), { code }));
    const advanceFrames = count => {
        for (let frame = 0; frame < count; frame++) {
            frames.shift()();
        }
    };
    startButton.dispatchEvent(new Event('click'));
    input('keydown', 'KeyW');
    advanceFrames(12);
    assert.ok(camera.position.z < door.z);
    assert.equal(elements.get('start-screen').hidden, true);
    input('keydown', 'KeyE');
    advanceFrames(1);
    assert.ok(camera.position.z > door.z && camera.position.z < 0.425);
    input('keydown', 'KeyE');
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(objective.textContent, `Find Room ${roomId}`);
    assert.equal(schedule.hidden, false);

    advanceFrames(1);
    input('keyup', 'KeyW');
    assert.ok(camera.position.z >= 0.425);
    assert.equal(elements.get('screen-message').textContent, `You arrived at Room ${roomId}.`);
    assert.equal(schedule.hidden, true);
    assert.equal(startButton.textContent, 'Play Again');
    assert.equal(document.pointerLockElement, null);

    input('keydown', 'KeyR');
    assert.equal(camera.position.z, playerStart.z);
    assert.equal(scene.children.find(object => object.name === door.name).rotation.y, 0);
    startButton.dispatchEvent(new Event('click'));
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(objective.textContent, `Find Room ${roomId}`);
    assert.equal(schedule.hidden, false);
});

test('wrong classrooms leave the clock running and the schedule selects which room wins', async () => {
    for (const [roomId, towardTarget, towardWrongRoom] of [['001', 'KeyA', 'KeyD'], ['002', 'KeyD', 'KeyA']]) {
        const definitions = levels.map(level => level.id !== 3 ? level : {
            ...level, schedule: { ...level.schedule, roomId }
        });
        const { document, elements, frames, renderers } =
            await loadGame({ ok: true, json: async () => ({ levels: definitions }) }, '?level=3');
        const [{ camera, scene }] = renderers;
        const start = elements.get('start-button');
        const clock = elements.get('school-time');
        const press = (code, type = 'keydown') => document.dispatchEvent(Object.assign(new Event(type), { code }));
        const advance = steps => {
            for (let frame = 0; frame < steps; frame++) {
                frames.shift()();
            }
        };

        start.dispatchEvent(new Event('click'));
        press('KeyW');
        advance(1);
        press('KeyW', 'keyup');
        advance(4);
        press(towardWrongRoom);
        advance(6);
        press('KeyE');
        advance(4);
        press(towardWrongRoom, 'keyup');
        assert.ok(Math.abs(camera.position.x) > 2.55);
        assert.equal(elements.get('start-screen').hidden, true);
        assert.equal(elements.get('objective').textContent, `Find Room ${roomId}`);
        const beforeWait = clock.textContent;
        frames.shift()(1000);
        assert.notEqual(clock.textContent, beforeWait);

        press(towardTarget);
        advance(20);
        assert.equal(elements.get('objective').textContent, 'Press E to open the door');
        press('KeyE');
        advance(6);
        assert.equal(elements.get('screen-message').textContent, `You arrived at Room ${roomId}.`);
        assert.equal(document.pointerLockElement, null);

        start.dispatchEvent(new Event('click'));
        assert.equal(camera.position.x, 0);
        assert.equal(camera.position.z, -6);
        assert.equal(clock.textContent, '08:00');
        for (const door of definitions[2].doors) {
            const panel = scene.children.find(object => object.name === door.name);
            assert.equal(panel.rotation.y, door.axis === 'x' ? Math.PI / 2 : 0);
        }
    }
});

test('the default challenge allows a visit to Rooms 003 and 101 before winning in Room 102', async () => {
    const { document, elements, frames, renderers } =
        await loadGame({ ok: true, json: async () => ({ levels }) }, '?level=3');
    const [{ camera }] = renderers;
    const press = (code, type = 'keydown') => document.dispatchEvent(Object.assign(new Event(type), { code }));
    function walkUntil(code, reached) {
        press(code);
        for (let step = 0; step < 45 && !reached(); step++) {
            frames.shift()();
        }
        press(code, 'keyup');
        assert.ok(reached(), `Could not complete route segment using ${code}`);
    }

    elements.get('start-button').dispatchEvent(new Event('click'));
    walkUntil('KeyW', () => camera.position.z > -1);
    press('KeyE');
    walkUntil('KeyW', () => camera.position.z > 1);
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(elements.get('objective').textContent, 'Find Room 102');
    const time = elements.get('school-time').textContent;
    frames.shift()(1000);
    assert.notEqual(elements.get('school-time').textContent, time);

    walkUntil('KeyS', () => camera.position.z <= -0.85);
    walkUntil('KeyD', () => camera.position.x < -6.1);
    walkUntil('KeyW', () => camera.position.z > 9.1);
    walkUntil('KeyA', () => camera.position.x >= 0);
    walkUntil('KeyW', () => camera.position.z > 26.5);
    assert.equal(camera.position.y, 4.6);
    walkUntil('KeyA', () => camera.position.x > 1.65);
    press('KeyE');
    walkUntil('KeyA', () => camera.position.x > 3);
    assert.equal(elements.get('start-screen').hidden, true);
    assert.equal(elements.get('objective').textContent, 'Find Room 102');
    const roomVisitTime = elements.get('school-time').textContent;
    frames.shift()(1000);
    assert.notEqual(elements.get('school-time').textContent, roomVisitTime);
    walkUntil('KeyD', () => camera.position.x < -1.65);
    press('KeyE');
    walkUntil('KeyD', () => !elements.get('start-screen').hidden);
    assert.equal(elements.get('screen-message').textContent, 'You arrived at Room 102.');

    press('KeyR');
    assert.equal(camera.position.y, 1.6);
    assert.equal(camera.position.z, -6);
    assert.equal(elements.get('school-time').textContent, '08:00');
});

test('failed or missing level data leaves the game disabled and shows an error', async () => {
    for (const [response, message] of [
        [{ ok: false, status: 404 }, /Failed to load levels.json: 404/],
        [{ ok: true, json: async () => ({ levels: [] }) }, /Level 1 is missing/],
        [new DOMException('Level request timed out', 'TimeoutError'), /request timed out/]
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

test('the bootstrap shows a load error when GameUI is unavailable', async () => {
    const elements = createGameElements();
    const errors = [];
    const page = vm.createContext({
        document: { getElementById: id => elements.get(id) },
        console: { error: (...args) => errors.push(args) }
    });
    await vm.runInContext(read('js/main.js'), page);
    assert.equal(elements.get('start-button').disabled, true);
    assert.equal(elements.get('options-button').disabled, true);
    assert.match(elements.get('screen-message').textContent, /Could not load the game/);
    assert.match(errors[0][1].message, /GameUI is not defined/);
});
