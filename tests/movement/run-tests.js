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
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
}

class Camera {
    position = new Vector3();
    rotation = new Vector3();

    updateProjectionMatrix() {}

    lookAt(x, y, z) {
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        const dz = z - this.position.z;
        this.rotation.set(Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(-dx, -dz), 0);
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

class Material extends Resource {
    constructor(options) {
        super();
        Object.assign(this, options);
    }
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
    MeshLambertMaterial: Material,
    LineBasicMaterial: Material,
    LineSegments,
    Mesh
};
const context = vm.createContext({
    THREE,
    test,
    levelData: levels[0]
});

const browserTestScripts = readScriptSources(BROWSER_TEST_PAGE);
const browserTestFiles = browserTestScripts.slice(1).map(source =>
    path.posix.join(path.posix.dirname(BROWSER_TEST_PAGE), source)
);
for (const file of browserTestFiles) {
    vm.runInContext(read(file), context, { filename: file });
}
vm.runInContext('registerMovementTests(test, levelData)', context);

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

async function loadGame(response) {
    const elements = new Map();
    for (const [, tag, id] of gameHtml.matchAll(/(<[^>]*\bid="([^"]+)"[^>]*>)/g)) {
        const element = new Element();
        element.disabled = /\bdisabled\b/.test(tag);
        elements.set(id, element);
    }

    const document = Object.assign(new EventTarget(), {
        getElementById: id => elements.get(id) ?? null,
        pointerLockElement: null,
        exitPointerLock() {
            this.pointerLockElement = null;
            this.dispatchEvent(new Event('pointerlockchange'));
        }
    });
    const window = Object.assign(new EventTarget(), { innerWidth: 800, innerHeight: 600 });
    const frames = [];
    const renderers = [];
    const errors = [];

    class Renderer {
        domElement = new Element();

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
            this.scene = scene;
            this.camera = camera;
        }
    }

    const page = vm.createContext({
        document,
        window,
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
