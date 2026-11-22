const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

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
    constructor(width, height, depth) {
        super();
        this.parameters = { width, height, depth };
        this.color = { getHex: () => width.color };
    }

    dispose() {
        this.dispatchEvent(new Event('dispose'));
    }

    setFromPoints() {
        return this;
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

const { levels } = JSON.parse(read('assets/levels.json'));
const context = vm.createContext({
    THREE: {
        Vector3,
        PerspectiveCamera: Camera,
        Scene,
        BoxGeometry: Resource,
        PlaneGeometry: Resource,
        EdgesGeometry: Resource,
        BufferGeometry: Resource,
        MeshLambertMaterial: Resource,
        LineBasicMaterial: Resource,
        LineSegments: Mesh,
        Mesh
    },
    window: {},
    test,
    levelData: levels[0]
});

for (const file of [
    'assets/gameConfig.js',
    'js/wall.js',
    'js/Level.js',
    'js/player.js',
    'test/movement/test-movement.js'
]) {
    vm.runInContext(read(file), context, { filename: file });
}
vm.runInContext('registerMovementTests(test, levelData)', context);

test('local scripts in the game page match the exact filename casing', () => {
    for (const [, src] of read('index.html').matchAll(/<script src="([^":]+)"/g)) {
        const directory = path.join(root, path.dirname(src));
        assert.ok(fs.readdirSync(directory).includes(path.basename(src)), src);
    }
});
