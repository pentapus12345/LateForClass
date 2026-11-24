const FURNITURE_WOOD = '#9d744f';
const FURNITURE_METAL = '#48535e';

function furniturePart(name, x, y, z, width, height, depth, color) {
    return { name, x, y, z, width, height, depth, color };
}

function furnitureLegs(x, z, height) {
    return [
        ['front left leg', -x, -z], ['front right leg', x, -z],
        ['back left leg', -x, z], ['back right leg', x, z]
    ].map(([name, legX, legZ]) => furniturePart(name, legX, height / 2, legZ, 0.07, height, 0.07, FURNITURE_METAL));
}

const ENVIRONMENT_OBJECT_TYPES = {
    studentDesk: {
        parts: [furniturePart('top', 0, 0.72, 0, 1.05, 0.08, 0.55, FURNITURE_WOOD), ...furnitureLegs(0.44, 0.21, 0.68)]
    },
    studentChair: {
        parts: [
            furniturePart('seat', 0, 0.44, 0, 0.43, 0.06, 0.42, '#496b8c'),
            furniturePart('back', 0, 0.67, 0.19, 0.43, 0.43, 0.06, '#496b8c'),
            ...furnitureLegs(0.17, 0.16, 0.41)
        ]
    },
    teacherDesk: {
        parts: [
            furniturePart('top', 0, 0.77, 0, 1.55, 0.09, 0.73, FURNITURE_WOOD),
            furniturePart('pedestal', 0.48, 0.36, 0, 0.46, 0.72, 0.64, '#76563f'),
            ...furnitureLegs(0.68, 0.28, 0.725)
        ]
    },
    whiteboard: {
        decorative: true,
        parts: [
            furniturePart('frame', 0, 0.55, 0, 1.85, 1.1, 0.08, FURNITURE_METAL),
            furniturePart('writing surface', 0, 0.55, -0.046, 1.75, 1.0, 0.012, '#e4e8e4'),
            furniturePart('tray', 0, 0.075, -0.065, 1.6, 0.05, 0.11, FURNITURE_METAL)
        ]
    },
    locker: {
        parts: [
            furniturePart('cabinet', 0, 0.9, 0, 0.55, 1.8, 0.43, '#68818a'),
            furniturePart('handle', 0.16, 0.96, -0.234, 0.055, 0.15, 0.038, FURNITURE_METAL)
        ]
    },
    bench: {
        parts: [furniturePart('seat', 0, 0.45, 0, 1.4, 0.08, 0.44, FURNITURE_WOOD), ...furnitureLegs(0.58, 0.15, 0.41)]
    }
};

class EnvironmentObjectFactory {
    constructor(models = new Map(), catalog = {}) {
        this.models = models;
        this.catalog = catalog;
        this.geometries = new Map();
        this.materials = new Map();
    }

    static resolveModel({ asset, model, modelVariant, scale, rotationOffset, collidable }, catalog) {
        if (asset && !Object.hasOwn(catalog, asset)) {
            throw new Error(`Unknown model catalog entry: ${asset}`);
        }
        const defaults = asset ? catalog[asset] : {};
        return {
            model: model ?? defaults.model,
            modelVariant: modelVariant ?? defaults.modelVariant,
            scale: scale ?? defaults.scale ?? 1,
            rotationOffset: rotationOffset ?? defaults.rotationOffset ?? 0,
            collidable: collidable ?? defaults.collidable
        };
    }

    static async loadModels(placements, levelsUrl, signal, catalog = {}) {
        const modelPaths = new Set(placements.map(placement => this.resolveModel(placement, catalog).model).filter(Boolean));
        const assetsDirectory = THREE.LoaderUtils.extractUrlBase(levelsUrl);
        const entries = await Promise.all([...modelPaths].map(async model => {
            const url = assetsDirectory + model;
            try {
                const response = await fetch(url, { signal });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.arrayBuffer();
                const loader = new THREE.GLTFLoader();
                const { scene } = await new Promise((resolve, reject) => {
                    loader.parse(data, THREE.LoaderUtils.extractUrlBase(url), resolve, reject);
                });
                const box = new THREE.Box3().setFromObject(scene);
                if (box.isEmpty()) {
                    throw new Error('The model has no geometry');
                }
                // Keep the authored horizontal origin and put the lowest point on the floor.
                scene.position.y -= box.min.y;
                const template = new THREE.Group();
                template.add(scene);
                return [model, template];
            } catch (error) {
                throw new Error(`Failed to load furniture model ${url}`, { cause: error });
            }
        }));
        return new Map(entries);
    }

    create(placement) {
        const { type, name = type, x, y = 0, z, rotationY = 0, color, castShadow = false, receiveShadow = false } = placement;
        const { model, modelVariant, scale, rotationOffset, collidable } = EnvironmentObjectFactory.resolveModel(placement, this.catalog);
        const definition = Object.hasOwn(ENVIRONMENT_OBJECT_TYPES, type) ? ENVIRONMENT_OBJECT_TYPES[type] : null;
        if (!definition && !model) {
            throw new Error(`Unknown environment object type: ${type}`);
        }
        const angle = rotationY * Math.PI / 180;
        const solid = collidable ?? !definition?.decorative;
        if (model) {
            const surface = this.instantiateModel(model, modelVariant, scale, castShadow, receiveShadow);
            surface.name = name;
            surface.position.set(x, y, z);
            surface.rotation.y = angle + rotationOffset * Math.PI / 180;
            return [{ surface, bounds: solid ? this.fitModelBounds(surface) : null }];
        }
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        return definition.parts.map(part => {
            const { width, height, depth } = part;
            const geometryKey = `${width},${height},${depth}`;
            if (!this.geometries.has(geometryKey)) {
                this.geometries.set(geometryKey, new THREE.BoxGeometry(width, height, depth));
            }
            const surfaceColor = color ?? part.color;
            const materialKey = `${surfaceColor}:${receiveShadow}`;
            if (!this.materials.has(materialKey)) {
                const material = receiveShadow
                    ? new THREE.MeshPhongMaterial({ color: surfaceColor, specular: 0x000000 })
                    : new THREE.MeshLambertMaterial({ color: surfaceColor });
                this.materials.set(materialKey, material);
            }
            const surface = new THREE.Mesh(this.geometries.get(geometryKey), this.materials.get(materialKey));
            surface.name = `${name} ${part.name}`;
            surface.castShadow = castShadow;
            surface.receiveShadow = receiveShadow;
            surface.position.set(x + part.x * cos + part.z * sin, y + part.y, z + part.z * cos - part.x * sin);
            surface.rotation.y = angle;

            // Fit a world-aligned collider around each rotated part.
            const bounds = solid ? new Wall({
                x: surface.position.x, y: surface.position.y - height / 2, z: surface.position.z,
                width: Math.abs(cos) * width + Math.abs(sin) * depth, height,
                depth: Math.abs(sin) * width + Math.abs(cos) * depth
            }) : null;
            return { surface, bounds };
        });
    }

    instantiateModel(model, modelVariant, scale, castShadow, receiveShadow) {
        const template = this.models.get(model);
        if (!template) {
            throw new Error(`Furniture model was not loaded: ${model}`);
        }
        const source = modelVariant ? template.getObjectByName(modelVariant) : template;
        if (!source) {
            throw new Error(`Unknown model variant ${modelVariant} in ${model}`);
        }
        const surface = modelVariant ? new THREE.Group().add(source.clone()) : template.clone();
        surface.scale.setScalar(scale);
        surface.traverse(node => {
            if (node.isMesh) {
                node.castShadow = castShadow;
                node.receiveShadow = receiveShadow;
            }
        });
        return surface;
    }

    fitModelBounds(surface) {
        const { min, max } = new THREE.Box3().setFromObject(surface);
        return new Wall({
            x: (min.x + max.x) / 2, y: min.y, z: (min.z + max.z) / 2,
            width: max.x - min.x, height: max.y - min.y, depth: max.z - min.z
        });
    }
}
