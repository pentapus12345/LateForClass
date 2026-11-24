// A world owns one cache. Instances borrow template resources until world teardown.
class ModelCache {
    constructor(levelsUrl) {
        this.base = new URL(levelsUrl, document.baseURI);
        this.templates = new Map();
        this.pending = new Map();
        this.disposed = false;
    }

    paths(definition) {
        const { environmentObjects = [], surfaceFinishes = {}, modelCatalog = {} } = definition;
        const doors = definition.doors ?? (definition.door ? [definition.door] : []);
        const placements = definition.solidRendering
            ? [...environmentObjects, ...doors, ...Object.values(surfaceFinishes)] : environmentObjects;
        return new Set(placements.map(item => EnvironmentObjectFactory.resolveModel(item, modelCatalog).model).filter(Boolean));
    }

    async prepare(definition) {
        await Promise.all([...this.paths(definition)].map(path => this.load(new URL(path, this.base).href)));
    }

    modelsFor(definition) {
        const models = new Map();
        for (const path of this.paths(definition)) {
            const template = this.templates.get(new URL(path, this.base).href);
            if (!template) {
                throw new Error(`Model is not ready: ${path}`);
            }
            models.set(path, template);
        }
        return models;
    }

    load(url) {
        if (this.disposed) {
            throw new Error('Model cache is disposed');
        }
        if (this.templates.has(url)) {
            return this.templates.get(url);
        }
        if (!this.pending.has(url)) {
            const promise = this.readTemplate(url).then(template => {
                if (this.disposed) {
                    this.release([template]);
                    throw new Error('Model cache closed during load');
                }
                this.templates.set(url, template);
                return template;
            }).finally(() => this.pending.delete(url));
            this.pending.set(url, promise);
        }
        return this.pending.get(url);
    }

    async readTemplate(url) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
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
                this.release([scene]);
                throw new Error('The model has no geometry');
            }
            scene.position.y -= box.min.y;
            return new THREE.Group().add(scene);
        } catch (error) {
            throw new Error(`Failed to load furniture model ${url}`, { cause: error });
        }
    }

    release(templates) {
        const resources = new Set();
        const images = new Set();
        for (const template of templates) {
            template.traverse(node => {
                if (node.geometry) {
                    resources.add(node.geometry);
                }
                for (const material of [].concat(node.material ?? [])) {
                    resources.add(material);
                    for (const value of Object.values(material)) {
                        if (value?.isTexture) {
                            resources.add(value);
                            if (value.image?.close) {
                                images.add(value.image);
                            }
                        }
                    }
                }
            });
        }
        for (const resource of resources) {
            resource.dispose();
        }
        for (const image of images) {
            image.close();
        }
    }

    dispose() {
        this.disposed = true;
        this.release(this.templates.values());
        this.templates.clear();
    }
}
