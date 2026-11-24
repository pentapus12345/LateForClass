const DEFAULT_LEVEL_LIGHTS = [
    { type: 'ambient', intensity: 0.65 },
    { type: 'directional', intensity: 0.6, position: { x: 1, y: 2, z: -1 } }
];

class LightingManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.registrations = new Map();
        this.debugView = false;
    }

    get lights() {
        return Array.from(this.registrations.values()).flatMap(group => group.lights);
    }

    get fixtures() {
        return Array.from(this.registrations.values()).flatMap(group => group.fixtures);
    }

    register(id, { lights = [], fixtures = [] } = {}) {
        if (this.registrations.has(id)) {
            throw new Error(`Lighting already registered: ${String(id)}`);
        }
        const group = { lights: [], fixtures: [] };
        this.registrations.set(id, group);
        try {
            for (const definition of lights) {
                const light = this.createLight(definition);
                group.lights.push(light);
                this.scene.add(light);
                if (light.target) {
                    this.scene.add(light.target);
                }
            }
            for (const definition of fixtures) {
                const fixture = this.createFixture(definition);
                group.fixtures.push(fixture);
                this.scene.add(fixture);
            }
            this.setDebugView(this.debugView);
        } catch (error) {
            this.release(id);
            throw error;
        }
    }

    createLight({ type, name = type, color = 0xffffff, intensity = 1, groundColor = 0x555555,
        position, target, distance = 0, angle = 55, penumbra = 0.5, decay = 1, shadow }) {
        let light;
        switch (type) {
            case 'ambient':
                light = new THREE.AmbientLight(color, intensity);
                break;
            case 'hemisphere':
                light = new THREE.HemisphereLight(color, groundColor, intensity);
                break;
            case 'directional':
                light = new THREE.DirectionalLight(color, intensity);
                break;
            case 'point':
                light = new THREE.PointLight(color, intensity, distance, decay);
                break;
            case 'spot':
                light = new THREE.SpotLight(color, intensity, distance, angle * Math.PI / 180, penumbra, decay);
                break;
            default:
                throw new Error(`Unknown light type: ${type}`);
        }
        light.name = name;
        if (position) {
            light.position.set(position.x, position.y, position.z);
        }
        if (target && light.target) {
            light.target.position.set(target.x, target.y, target.z);
        }
        if (shadow) {
            this.configureShadow(light, shadow);
        }
        return light;
    }

    configureShadow(light, { mapSize = 512, near = 0.15, far = 12, bias = -0.0002, normalBias = 0.02, extent = 6 }) {
        if (!light.shadow) {
            throw new Error(`Light ${light.name} does not support shadows`);
        }
        light.castShadow = true;
        const { shadow } = light;
        shadow.mapSize.set(mapSize, mapSize);
        shadow.bias = bias;
        shadow.normalBias = normalBias;
        Object.assign(shadow.camera, { near, far });
        if (shadow.camera.isOrthographicCamera) {
            Object.assign(shadow.camera, { left: -extent, right: extent, bottom: -extent, top: extent });
        }
        shadow.camera.updateProjectionMatrix();
    }

    createFixture({ name, x, y, z, width = 1.2, depth = 0.45, height = 0.06, color = '#fff1ce' }) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ color });
        const fixture = new THREE.Mesh(geometry, material);
        fixture.name = name;
        fixture.position.set(x, y, z);
        return fixture;
    }

    setDebugView(debugView) {
        this.debugView = debugView;
        this.renderer.shadowMap.enabled = !debugView && this.lights.some(light => light.castShadow);
        for (const fixture of this.fixtures) {
            fixture.visible = !debugView;
        }
    }

    release(id) {
        const group = this.registrations.get(id);
        if (!group) {
            return;
        }
        this.registrations.delete(id);
        for (const light of group.lights) {
            this.scene.remove(light);
            if (light.target) {
                this.scene.remove(light.target);
            }
            light.shadow?.dispose();
        }
        for (const fixture of group.fixtures) {
            this.scene.remove(fixture);
            fixture.geometry.dispose();
            fixture.material.dispose();
        }
        this.setDebugView(this.debugView);
    }
}
