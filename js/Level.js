const PILLAR_RADIAL_SEGMENTS = 16;
const CONTACT_TOLERANCE = 1e-9;
const DEFAULT_SURFACE_COLOR = 0xb6c0c9;
const SIGN_STYLES = {
    brass: { edge: '#48321c', border: '#f0cf82', face: '#c79b53', ink: '#24180e', font: 'Georgia' },
    oak: { edge: '#241811', face: '#38261b', ink: '#f3dec0', font: 'Georgia' }
};

class Level {
    constructor(definition, config, models = new Map(), areaId = `level-${definition.id}`, roomNumbers = new Map()) {
        this.definition = definition;
        this.areaId = areaId;
        this.config = config;
        this.models = models;
        this.finishMaterials = new Map();
        this.playerStart = definition.playerStart;
        this.playerLookAt = definition.playerLookAt;
        const { door } = definition;
        this.roomNumbers = roomNumbers;
        this.rooms = areaRooms(definition).map(room => ({
            ...room,
            bounds: room.bounds ? new Wall(room.bounds) : null
        }));
        this.doorDefinitions = definition.doors ?? (door ? [door] : []);
        this.solids = [];
        this.objects = [];
        this.renderPairs = [];
        this.scenery = [];
        this.debugView = false;
        this.doors = [];
    }

    build(scene) {
        this.clear(scene);
        const factory = new EnvironmentObjectFactory(this.models, this.definition.modelCatalog);
        if (this.definition.hallway) {
            this.createHallway(scene);
            this.createHallwayColliders();
        }
        for (const platform of this.definition.platforms ?? []) {
            const bounds = new Wall(platform);
            const sections = platform.windowOpening ? this.windowOpeningWalls(platform.windowOpening, bounds) : [bounds];
            for (const [index, section] of sections.entries()) {
                section.id = this.objectId('platform', platform, index);
                this.solids.push(section);
                const name = index ? `${platform.name} section ${index + 1}` : platform.name;
                this.addPlatformVisuals(scene, section, { ...platform, name });
            }
        }

        if (this.definition.pillars) {
            this.addPillars(scene);
        }
        for (const door of this.doorDefinitions) {
            this.addDoor(scene, door, factory);
        }
        if (this.definition.environmentObjects?.length) {
            this.addEnvironmentObjects(scene, factory);
        }
        for (const room of this.rooms) {
            if (room.sign) {
                const label = `Room ${room.number ?? room.id}`;
                this.addSign(scene, { ...room.sign, name: label, lines: [label] });
            }
        }
        for (const sign of this.definition.signs ?? []) {
            if (sign.roomRange) {
                const numbers = sign.roomRange.map(id => {
                    if (!this.roomNumbers.has(id)) {
                        throw new Error(`Unknown room on ${sign.name}: ${id}`);
                    }
                    return this.roomNumbers.get(id);
                });
                this.addSign(scene, { ...sign, lines: [...sign.lines, `Rooms ${numbers.join('–')}`] });
            } else {
                this.addSign(scene, sign);
            }
        }
    }

    objectId(kind, definition, part) {
        const key = areaObjectKey(kind, definition);
        return `${this.areaId}/${kind}/${encodeURIComponent(key)}/${part}`;
    }

    addObject(scene, object) {
        scene?.add(object);
        this.objects.push(object);
    }

    addEnvironmentObjects(scene, factory) {
        for (const placement of this.definition.environmentObjects) {
            for (const [part, { surface, bounds }] of factory.create(placement).entries()) {
                this.addObject(scene, surface);
                if (placement.hideInDebug) {
                    this.scenery.push(surface);
                    surface.visible = !this.debugView;
                }
                if (bounds) {
                    let walls = [bounds];
                    if (placement.archOpening) {
                        walls = this.archOpeningWalls(placement, bounds);
                    } else if (placement.windowOpening) {
                        walls = this.windowOpeningWalls(placement.windowOpening, bounds);
                    }
                    for (const [index, wall] of walls.entries()) {
                        wall.id = this.objectId('placement', placement, `${part}/${index}`);
                        this.solids.push(wall);
                        const name = walls.length === 1 ? surface.name : `${surface.name} section ${index + 1}`;
                        const outline = this.addWireframeBox(scene, wall, undefined, `${name} collision`);
                        if (this.definition.solidRendering) {
                            this.addRenderPair(surface, outline, walls.length > 1);
                        } else {
                            surface.visible = false;
                        }
                    }
                }
            }
        }
    }

    clear(scene) {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        const sharedMaterials = new Set(this.finishMaterials.values());
        for (const object of this.objects) {
            scene?.remove(object);
            // Model groups borrow their meshes from the world's model cache across builds.
            if (object.isGroup) {
                continue;
            }
            geometries.add(object.geometry);
            if (!sharedMaterials.has(object.material)) {
                materials.add(object.material);
                if (object.material.map) {
                    textures.add(object.material.map);
                }
            }
        }
        for (const geometry of geometries) {
            geometry.dispose();
        }
        for (const material of materials) {
            material.dispose();
        }
        for (const texture of textures) {
            texture.dispose();
        }
        this.objects = [];
        this.solids = [];
        this.renderPairs = [];
        this.scenery = [];
        this.finishMaterials.clear();
        this.doors = [];
    }

    createHallway(scene) {
        const { width, height, depth } = this.definition.hallway;
        this.addWireframeBox(scene, {
            minX: -width / 2, maxX: width / 2, minY: 0, maxY: height, minZ: -depth / 2, maxZ: depth / 2
        });
    }

    addWireframeBox(scene, bounds, color = this.config.wireframeColor, name = '') {
        const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
        const corners = [
            [minX, minY, minZ], [maxX, minY, minZ], [maxX, minY, maxZ], [minX, minY, maxZ],
            [minX, maxY, minZ], [maxX, maxY, minZ], [maxX, maxY, maxZ], [minX, maxY, maxZ]
        ].map(point => new THREE.Vector3(...point));
        // Bottom edges, top edges, then the vertical edges.
        const edges = [
            0, 1, 1, 2, 2, 3, 3, 0,
            4, 5, 5, 6, 6, 7, 7, 4,
            0, 4, 1, 5, 2, 6, 3, 7
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(edges.map(index => corners[index]));
        const material = new THREE.LineBasicMaterial({ color });
        const frame = new THREE.LineSegments(geometry, material);
        frame.name = name;
        this.addObject(scene, frame);
        return frame;
    }

    addPlatformVisuals(scene, bounds, { color, name, surfaceColor = DEFAULT_SURFACE_COLOR, surfaceFinish, opacity,
        castShadow = false, receiveShadow = false }) {
        if (!this.definition.solidRendering) {
            this.addWireframeBox(scene, bounds, color, name);
            return;
        }

        const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
        const geometry = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);
        const position = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
        let material;
        if (surfaceFinish) {
            try {
                material = this.applySurfaceFinish(geometry, position, surfaceFinish);
            } catch (error) {
                geometry.dispose();
                throw error;
            }
        } else if (opacity !== undefined) {
            material = new THREE.MeshBasicMaterial({ color: surfaceColor, transparent: true, opacity, depthWrite: false });
        } else {
            material = receiveShadow
                ? new THREE.MeshPhongMaterial({ color: surfaceColor, specular: 0x000000 })
                : new THREE.MeshLambertMaterial({ color: surfaceColor });
        }
        const surface = new THREE.Mesh(geometry, material);
        surface.name = name;
        surface.castShadow = castShadow;
        surface.receiveShadow = receiveShadow;
        surface.position.set(position.x, position.y, position.z);
        this.addObject(scene, surface);
        const wireframe = this.addWireframeBox(scene, bounds, color, `${name} collision`);
        this.addRenderPair(surface, wireframe);
    }

    applySurfaceFinish(geometry, position, name) {
        const finish = this.definition.surfaceFinishes?.[name];
        if (!finish) {
            throw new Error(`Unknown surface finish: ${name}`);
        }
        if (!this.finishMaterials.has(name)) {
            const { model } = EnvironmentObjectFactory.resolveModel(finish, this.definition.modelCatalog);
            const template = this.models.get(model);
            let material;
            if (finish.materialName) {
                template?.traverse(object => {
                    if (object.material?.name === finish.materialName) {
                        material = object.material;
                    }
                });
            } else {
                material = template?.getObjectByProperty('isMesh', true)?.material;
            }
            if (!material?.map) {
                throw new Error(`Missing textured material for surface finish: ${name}`);
            }
            this.finishMaterials.set(name, material);
        }

        // Project the same material scale across neighboring boxes, including stair risers and treads.
        const points = geometry.getAttribute('position');
        const normals = geometry.getAttribute('normal');
        const uv = geometry.getAttribute('uv');
        for (let index = 0; index < points.count; index++) {
            const x = position.x + points.getX(index);
            const y = position.y + points.getY(index);
            const z = position.z + points.getZ(index);
            const nx = normals.getX(index);
            const ny = normals.getY(index);
            const u = nx ? -nx * z : x;
            const v = ny ? -ny * z : y;
            const direction = normals.getZ(index) < 0 ? -1 : 1;
            uv.setXY(index, direction * u / finish.tileWidth, v / finish.tileHeight);
        }
        const material = this.finishMaterials.get(name);
        if (material.vertexTangents) {
            geometry.computeTangents();
        }
        return material;
    }

    addRenderPair(surface, wireframe, partial = false) {
        surface.visible = !this.debugView;
        wireframe.visible = this.debugView;
        this.renderPairs.push({ surface, wireframe, partial });
    }

    toggleDebugView() {
        if (!this.definition.solidRendering) {
            return false;
        }

        this.debugView = !this.debugView;
        for (const { surface, wireframe } of this.renderPairs) {
            surface.visible = !this.debugView;
            wireframe.visible = this.debugView;
        }
        for (const surface of this.scenery) {
            surface.visible = !this.debugView;
        }
        return true;
    }

    createHallwayColliders() {
        const { width, height, depth, wallThickness } = this.definition.hallway;
        this.hallwayFootprint = new Wall({ x: 0, z: 0, width, height, depth });
        this.solids = [
            new Wall({ x: -width / 2, z: 0, width: wallThickness, height, depth }),
            new Wall({ x: width / 2, z: 0, width: wallThickness, height, depth }),
            new Wall({ x: 0, z: -depth / 2, width, height, depth: wallThickness }),
            new Wall({ x: 0, z: depth / 2, width, height, depth: wallThickness })
        ];
        for (const [index, wall] of this.solids.entries()) {
            wall.id = `${this.areaId}/hallway/${index}`;
        }
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

    getEnteredRoomId(position) {
        // The player's full footprint must clear the doorway, and their body
        // must fit between this room's floor and ceiling.
        const { x, y, z } = position;
        const { playerRadius, playerHeight } = this.config;
        for (const { id, bounds } of this.rooms) {
            if (!id || !bounds) {
                continue;
            }
            const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
            const inside = x - playerRadius >= minX - CONTACT_TOLERANCE &&
                x + playerRadius <= maxX + CONTACT_TOLERANCE &&
                y >= minY - CONTACT_TOLERANCE && y + playerHeight <= maxY + CONTACT_TOLERANCE &&
                z - playerRadius >= minZ - CONTACT_TOLERANCE &&
                z + playerRadius <= maxZ + CONTACT_TOLERANCE;
            if (inside) {
                const entrances = this.doors.filter(door => door.definition.roomId === id);
                if (!entrances.length || entrances.some(door => door.isOpen)) {
                    return id;
                }
            }
        }
        return null;
    }

    canConfirmArrival(position) {
        const classroom = this.definition.classroom;
        if (classroom?.bounds || classroom?.interactionRadius === undefined) {
            return false;
        }
        const distance = Math.hypot(position.x - classroom.x, position.z - classroom.z);
        return distance <= classroom.interactionRadius;
    }

    addSign(scene, { name, lines, notices, x, y, z, rotationY = 180, width = 0.88, height = 0.33,
        backgroundColor = '#82d8ac', style }) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = Math.round(canvas.width * height / width);
        const context = canvas.getContext('2d');
        if (notices) {
            this.drawNoticeboard(context, canvas, name, notices);
        } else {
            this.drawSign(context, canvas, lines, backgroundColor, style);
        }

        const geometry = new THREE.PlaneGeometry(width, height);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const plaque = new THREE.Mesh(geometry, material);
        plaque.name = name;
        plaque.position.set(x, y, z);
        plaque.rotation.y = rotationY * Math.PI / 180;
        this.addObject(scene, plaque);
    }

    drawSign(context, canvas, lines, backgroundColor, style) {
        const appearance = SIGN_STYLES[style];
        context.fillStyle = appearance?.edge ?? backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (appearance) {
            context.fillStyle = appearance.border ?? backgroundColor;
            context.fillRect(5, 5, canvas.width - 10, canvas.height - 10);
            context.fillStyle = appearance.face;
            context.fillRect(11, 11, canvas.width - 22, canvas.height - 22);
        }
        context.fillStyle = appearance?.ink ?? '#15202b';
        const lineHeight = canvas.height / (lines.length + 1);
        const fontSize = style === 'brass' ? Math.min(104, lineHeight) : Math.min(76, Math.floor(lineHeight * 0.82));
        context.font = `bold ${fontSize}px ${appearance?.font ?? 'Arial'}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        for (const [index, line] of lines.entries()) {
            context.fillText(line, canvas.width / 2, (index + 1) * lineHeight, canvas.width - 32);
        }
    }

    drawNoticeboard(context, { width, height }, title, notices) {
        context.fillStyle = '#38241a';
        context.fillRect(0, 0, width, height);
        context.fillStyle = '#8b6341';
        context.fillRect(8, 8, width - 16, height - 16);
        context.fillStyle = '#3c4939';
        context.fillRect(20, 67, width - 40, height - 87);
        context.fillStyle = '#f3dfb7';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = 'bold 29px Georgia';
        context.fillText(title, width / 2, 40, width - 72);

        const cell = (width - 66) / notices.length;
        const paperWidth = cell - 17;
        const paperHeight = Math.min(height - 145, 146);
        for (const [index, [heading, caption]] of notices.entries()) {
            const x = 41 + index * cell;
            const y = 96 + (index % 2) * 16;
            context.fillStyle = '#253129';
            context.fillRect(x + 3, y + 5, paperWidth, paperHeight);
            context.fillStyle = index % 2 ? '#dcc9a2' : '#ebddc0';
            context.fillRect(x, y, paperWidth, paperHeight);
            context.fillStyle = '#423322';
            context.fillRect(x + paperWidth / 2 - 2, y + 8, 4, 4);
            context.font = 'bold 17px Georgia';
            context.fillText(heading, x + paperWidth / 2, y + 35, paperWidth - 13);
            context.font = '15px Georgia';
            context.fillText(caption, x + paperWidth / 2, y + 59, paperWidth - 13);
            context.fillStyle = '#a79574';
            context.fillRect(x + 18, y + 84, paperWidth - 36, 1);
            context.fillRect(x + 26, y + 96, paperWidth - 52, 1);
        }
    }

    addDoor(scene, definition, factory) {
        const { x, z, width, height, depth, color, surfaceColor = color, name,
            castShadow = false, receiveShadow = false } = definition;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        let material;
        if (!this.definition.solidRendering) {
            material = new THREE.MeshBasicMaterial({ color, opacity: 0.65, transparent: true });
        } else if (receiveShadow) {
            material = new THREE.MeshPhongMaterial({ color: surfaceColor, specular: 0x000000 });
        } else {
            material = new THREE.MeshLambertMaterial({ color: surfaceColor });
        }
        const panel = new THREE.Mesh(geometry, material);
        panel.name = name;
        panel.castShadow = castShadow;
        panel.receiveShadow = receiveShadow;
        this.addObject(scene, panel);
        const arch = definition.arch ? this.definition.doorProfiles[definition.arch] : null;
        const parts = [{ x: 0, y: 0, width, height, depth }];
        if (arch) {
            for (const band of this.archBands(arch, width)) {
                parts.push({ x: band.x, y: height, width: band.width, height: band.high, depth });
            }
        }
        if (this.definition.solidRendering) {
            if (definition.asset || definition.model) {
                const [{ surface }] = factory.create({
                    ...definition, y: -height / 2, x: 0, z: 0, collidable: false
                });
                panel.add(surface);
                // Keep the original hinge, shadow registration, and collision dimensions.
                panel.material.visible = false;
                panel.castShadow = false;
            }
            for (const [index, part] of parts.entries()) {
                const label = index === 0 ? name : `${name} arch section ${index}`;
                const box = new Wall({ ...part, y: part.y - height / 2, z: 0 });
                part.wireframe = this.addWireframeBox(scene, box, color, `${label} collision`);
                this.addRenderPair(panel, part.wireframe, index !== 0);
            }
        }
        const id = this.objectId('door', definition, 'panel');
        const door = { id, definition, panel, parts, wireframe: parts[0].wireframe, solidIndex: this.solids.length, isOpen: false };
        this.doors.push(door);
        this.setDoorPose(door, x, z, definition.axis === 'x' ? Math.PI / 2 : 0);
    }

    getNearbyDoor(position) {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const door of this.doors) {
            if (door.isOpen) {
                continue;
            }
            const { x, y, z, interactionRadius } = door.definition;
            const distance = Math.hypot(position.x - x, position.y - y, position.z - z);
            if (distance <= interactionRadius && (distance < nearestDistance || (distance === nearestDistance && door.id < nearest.id))) {
                nearest = door;
                nearestDistance = distance;
            }
        }
        return nearest;
    }

    canOpenDoor(position) {
        return this.getNearbyDoor(position) !== null;
    }

    openDoor(position) {
        const door = this.getNearbyDoor(position);
        if (!door) {
            return false;
        }
        this.swingDoor(door, this.swingDirection(door, position));
        return true;
    }

    swingDirection(door, position) {
        const { x, z, axis } = door.definition;
        const normalIsX = axis === 'x';
        const normalDistance = normalIsX ? position.x - x : position.z - z;
        return normalDistance <= 0 ? 1 : -1;
    }

    swingDoor(door, swing) {
        const { x, z, width, axis } = door.definition;
        const normalIsX = axis === 'x';
        const halfWidth = width / 2;
        // Turn around the jamb at the negative end of the door's local width.
        const openX = normalIsX ? x + swing * halfWidth : x - halfWidth;
        const openZ = normalIsX ? z + halfWidth : z + swing * halfWidth;
        this.setDoorPose(door, openX, openZ, ((normalIsX ? 1 : 0) - swing) * Math.PI / 2);
        door.isOpen = true;
    }

    setDoorPose(door, x, z, angle) {
        const { y, height } = door.definition;
        door.panel.position.set(x, y + height / 2, z);
        door.panel.rotation.y = angle;
        for (const [index, part] of door.parts.entries()) {
            if (part.wireframe) {
                part.wireframe.position.set(x, y + height / 2, z);
                part.wireframe.rotation.y = angle;
            }
            const wall = this.orientDoorwayWall(part, x, y, z, angle);
            wall.id = this.objectId('door', door.definition, index);
            this.solids[door.solidIndex + index] = wall;
        }
    }

    orientDoorwayWall(part, x, y, z, angle) {
        const widthAlongX = angle % Math.PI === 0;
        return new Wall({
            x: x + part.x * Math.cos(angle), y: y + part.y, z: z - part.x * Math.sin(angle),
            width: widthAlongX ? part.width : part.depth, height: part.height,
            depth: widthAlongX ? part.depth : part.width
        });
    }

    archBands({ rise }, width) {
        const bandWidth = width / (rise.length - 1);
        return rise.slice(1).map((next, index) => ({
            x: -width / 2 + (index + 0.5) * bandWidth,
            width: bandWidth,
            low: Math.min(rise[index], next),
            high: Math.max(rise[index], next)
        }));
    }

    archOpeningWalls({ x, y = 0, z, rotationY = 0, archOpening }, bounds) {
        const profile = this.definition.doorProfiles[archOpening];
        const angle = rotationY * Math.PI / 180;
        const widthAlongX = angle % Math.PI === 0;
        // A fitted casing may have different render bounds from the structural head.
        const openingBounds = profile.openingBounds;
        const fullWidth = openingBounds?.width ?? (widthAlongX ? bounds.maxX - bounds.minX : bounds.maxZ - bounds.minZ);
        const depth = openingBounds?.depth ?? (widthAlongX ? bounds.maxZ - bounds.minZ : bounds.maxX - bounds.minX);
        const headHeight = openingBounds?.height ?? (bounds.maxY - y);
        const bands = this.archBands(profile, profile.width);
        const shoulder = (fullWidth - profile.width) / 2;
        if (shoulder > CONTACT_TOLERANCE) {
            const offset = (fullWidth + profile.width) / 4;
            bands.push({ x: -offset, width: shoulder, low: 0 }, { x: offset, width: shoulder, low: 0 });
        }
        return bands.map(({ x: offset, width, low }) => this.orientDoorwayWall({
            x: offset, y: low, width, depth, height: headHeight - low
        }, x, y, z, angle));
    }

    windowOpeningWalls({ axis, center, width, bottom, height }, bounds) {
        const alongX = axis === 'z';
        const minimum = alongX ? bounds.minX : bounds.minZ;
        const maximum = alongX ? bounds.maxX : bounds.maxZ;
        const left = center - width / 2;
        const right = center + width / 2;
        const top = bottom + height;
        return [
            [minimum, left, bounds.minY, bounds.maxY],
            [right, maximum, bounds.minY, bounds.maxY],
            [left, right, bounds.minY, bottom],
            [left, right, top, bounds.maxY]
        ].filter(([start, end, low, high]) => end - start > CONTACT_TOLERANCE && high - low > CONTACT_TOLERANCE)
            .map(([start, end, low, high]) => new Wall({
                x: alongX ? (start + end) / 2 : (bounds.minX + bounds.maxX) / 2,
                y: low,
                z: alongX ? (bounds.minZ + bounds.maxZ) / 2 : (start + end) / 2,
                width: alongX ? end - start : bounds.maxX - bounds.minX,
                height: high - low,
                depth: alongX ? bounds.maxZ - bounds.minZ : end - start
            }));
    }

    isBlocked(position, radius, height) {
        return this.solids.some(solid => solid.checkCollision(position, radius, height));
    }

    getStepHeight(position, radius, height, maxStepHeight) {
        let stepY = position.y;
        for (const solid of this.solids) {
            if (solid.checkCollision(position, radius, height)) {
                stepY = Math.max(stepY, solid.maxY);
            }
        }
        return stepY > position.y && stepY - position.y <= maxStepHeight + CONTACT_TOLERANCE ? stepY : null;
    }

    // Return the first contact as a feet height. A stationary query checks support.
    getVerticalCollision(position, targetY, radius, height) {
        const rising = targetY > position.y;
        const hallway = this.definition.hallway;
        const withinHall = hallway && this.hallwayFootprint.overlapsFootprint(position, radius);
        const boundary = withinHall ? (rising ? hallway.height - height : 0) : null;
        const crossesFace = face => rising
            ? position.y <= face + CONTACT_TOLERANCE && targetY >= face
            : position.y >= face - CONTACT_TOLERANCE && targetY <= face + CONTACT_TOLERANCE;
        const nearestFace = rising ? Math.min : Math.max;
        let contactY = boundary !== null && crossesFace(boundary) ? boundary : null;

        for (const solid of this.solids) {
            const face = rising ? solid.minY - height : solid.maxY;
            if (crossesFace(face) && solid.overlapsFootprint(position, radius)) {
                contactY = contactY === null ? face : nearestFace(contactY, face);
            }
        }
        return contactY;
    }
}
