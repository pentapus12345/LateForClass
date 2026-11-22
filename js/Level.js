const PILLAR_RADIAL_SEGMENTS = 16;
const CONTACT_TOLERANCE = 1e-9;

class Level {
    constructor(definition, config) {
        this.definition = definition;
        this.config = config;
        this.playerStart = definition.playerStart;
        this.playerLookAt = definition.playerLookAt;
        this.solids = [];
        this.objects = [];
    }

    build(scene) {
        this.clear(scene);
        this.createHallway(scene);
        this.createColliders();

        if (this.definition.pillars) {
            this.addPillars(scene);
        }
    }

    addObject(scene, object) {
        scene.add(object);
        this.objects.push(object);
    }

    clear(scene) {
        const geometries = new Set();
        const materials = new Set();
        for (const object of this.objects) {
            scene.remove(object);
            geometries.add(object.geometry);
            materials.add(object.material);
        }
        for (const geometry of geometries) {
            geometry.dispose();
        }
        for (const material of materials) {
            material.dispose();
        }
        this.objects = [];
        this.solids = [];
    }

    createHallway(scene) {
        const { width, height, depth } = this.definition.hallway;
        const halfWidth = width / 2;
        const halfDepth = depth / 2;
        const corners = [
            [-halfWidth, 0, -halfDepth],
            [halfWidth, 0, -halfDepth],
            [halfWidth, 0, halfDepth],
            [-halfWidth, 0, halfDepth],
            [-halfWidth, height, -halfDepth],
            [halfWidth, height, -halfDepth],
            [halfWidth, height, halfDepth],
            [-halfWidth, height, halfDepth]
        ].map(point => new THREE.Vector3(...point));
        // Bottom edges, top edges, then the vertical edges.
        const edges = [
            0, 1, 1, 2, 2, 3, 3, 0,
            4, 5, 5, 6, 6, 7, 7, 4,
            0, 4, 1, 5, 2, 6, 3, 7
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(edges.map(index => corners[index]));
        const material = new THREE.LineBasicMaterial({ color: this.config.wireframeColor });
        const frame = new THREE.LineSegments(geometry, material);
        this.addObject(scene, frame);
    }

    createColliders() {
        const { width, height, depth, wallThickness } = this.definition.hallway;
        this.solids = [
            new Wall({ x: -width / 2, z: 0, width: wallThickness, height, depth }),
            new Wall({ x: width / 2, z: 0, width: wallThickness, height, depth }),
            new Wall({ x: 0, z: -depth / 2, width, height, depth: wallThickness }),
            new Wall({ x: 0, z: depth / 2, width, height, depth: wallThickness }),
            ...(this.definition.platforms ?? []).map(platform => new Wall(platform))
        ];
    }

    addPillars(scene) {
        const { startX, z, count, spacing, radius, height } = this.definition.pillars;
        const geometry = new THREE.CylinderGeometry(radius, radius, height, PILLAR_RADIAL_SEGMENTS);
        const material = new THREE.MeshLambertMaterial({ color: this.config.wireframeColor, wireframe: true });

        for (let index = 0; index < count; index++) {
            const pillar = new THREE.Mesh(geometry, material);
            pillar.position.set(startX + index * spacing, height / 2, z);
            this.addObject(scene, pillar);
        }
    }

    canEnterClassroom(position) {
        const classroom = this.definition.classroom;
        if (!classroom) {
            return false;
        }
        const distance = Math.hypot(position.x - classroom.x, position.z - classroom.z);
        return distance <= classroom.interactionRadius;
    }

    isBlocked(position, radius, height) {
        return this.solids.some(solid => solid.checkCollision(position, radius, height));
    }

    // Return the first contact as a feet height. A stationary query checks support.
    getVerticalCollision(position, targetY, radius, height) {
        const rising = targetY > position.y;
        const boundary = rising ? this.definition.hallway.height - height : 0;
        const crossesFace = face => rising
            ? position.y <= face + CONTACT_TOLERANCE && targetY >= face
            : position.y >= face - CONTACT_TOLERANCE && targetY <= face + CONTACT_TOLERANCE;
        const nearestFace = rising ? Math.min : Math.max;
        let contactY = crossesFace(boundary) ? boundary : null;

        for (const solid of this.solids) {
            const face = rising ? solid.minY - height : solid.maxY;
            if (crossesFace(face) && solid.overlapsFootprint(position, radius)) {
                contactY = contactY === null ? face : nearestFace(contactY, face);
            }
        }
        return contactY;
    }
}
