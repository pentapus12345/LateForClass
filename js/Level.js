class Level {
    constructor(data, config) {
        this.data = data;
        this.config = config;
        this.playerStart = data.playerStart;
        this.playerLookAt = data.playerLookAt;
        this.walls = [];
        this.objects = [];
    }

    build(scene) {
        this.clear(scene);
        this.createHallway(scene);

        if (this.data.pillars) {
            this.addPillars(scene);
        }
        for (const wallData of this.data.walls ?? []) {
            const wall = new Wall(wallData);
            this.walls.push(wall);
            this.objects.push(wall.render(scene));
        }
        if (this.data.classroom) {
            this.addClassroomDoor(scene);
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
        for (const geometry of geometries) geometry.dispose();
        for (const material of materials) material.dispose();
        this.objects = [];
        this.walls = [];
    }

    createHallway(scene) {
        const { hallwayWidth: width, hallwayDepth: depth, wallHeight: height, wireframeColor } = this.config;
        const outline = new THREE.BoxGeometry(width, height, depth);
        const edges = new THREE.EdgesGeometry(outline);
        outline.dispose();

        const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: wireframeColor }));
        frame.position.y = height / 2;
        this.addObject(scene, frame);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(width, depth),
            new THREE.MeshLambertMaterial({ color: 0x343e48 })
        );
        floor.rotation.x = -Math.PI / 2;
        this.addObject(scene, floor);

        // Floor lines make movement visible along the otherwise plain hallway.
        const points = [];
        for (let z = -depth / 2 + 1; z < depth / 2; z++) {
            points.push(new THREE.Vector3(-width / 2, 0.01, z), new THREE.Vector3(width / 2, 0.01, z));
        }
        for (let x = -width / 2 + 1; x < width / 2; x++) {
            points.push(new THREE.Vector3(x, 0.01, -depth / 2), new THREE.Vector3(x, 0.01, depth / 2));
        }
        const grid = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0x4c5966 })
        );
        this.addObject(scene, grid);
    }

    addPillars(scene) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
        const material = new THREE.MeshLambertMaterial({ color: this.config.wireframeColor, wireframe: true });

        for (let i = 0; i < this.config.pillarCount; i++) {
            const pillar = new THREE.Mesh(geometry, material);
            pillar.position.set(-4 + i * this.config.pillarSpacing, 2, -15);
            this.addObject(scene, pillar);
        }
    }

    addClassroomDoor(scene) {
        const { x, z } = this.data.classroom;
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.6, 0.16),
            new THREE.MeshLambertMaterial({ color: 0xd99843 })
        );
        door.position.set(x, 1.3, z);
        this.addObject(scene, door);

        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.08),
            new THREE.MeshLambertMaterial({ color: 0x33220e })
        );
        handle.position.set(x + 0.55, 1.1, z - 0.12);
        this.addObject(scene, handle);
    }

    canEnterClassroom(position) {
        const classroom = this.data.classroom;
        return Boolean(classroom &&
            Math.hypot(position.x - classroom.x, position.z - classroom.z) <= classroom.interactionRadius);
    }

    isBlocked(position, radius, height) {
        return this.walls.some(wall => wall.checkCollision(position, radius, height));
    }

    getGroundHeight() {
        return 0;
    }
}
