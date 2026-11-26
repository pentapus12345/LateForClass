const GLOBAL_LIGHTING = Symbol('school lighting');
const AREA_KEEP_MS = 500;
const AREA_APPROACH_MARGIN = 2;

class World {
    constructor(school, config, levelsUrl) {
        this.school = school;
        this.initialAreaIds = school.initialActiveAreaIds ?? [school.initialAreaId];
        this.config = config;
        this.cache = new ModelCache(levelsUrl);
        const registry = registerSchoolAreas(school);
        this.areas = registry.areas;
        this.rooms = registry.rooms;
        this.roomNumbers = registry.roomNumbers;
        this.active = new Map();
        this.debugView = false;
        this.disposed = false;
    }

    area(id) {
        const area = this.areas.get(id);
        if (!area) {
            throw new Error(`Unknown area: ${id}`);
        }
        return area;
    }

    loadArea(id) {
        const area = this.area(id);
        if (this.disposed) {
            throw new Error('World is disposed');
        }
        if (area.status !== 'unloaded') {
            return area.pending ?? Promise.resolve(area.level);
        }
        area.status = 'loading';
        const pending = this.cache.prepare(area.definition).then(() => {
            if (area.pending !== pending) {
                throw new Error(`Area load cancelled: ${id}`);
            }
            return this.#buildArea(id);
        }).finally(() => {
            if (area.pending === pending) {
                area.pending = null;
                if (!area.level) {
                    area.status = 'unloaded';
                }
            }
        });
        area.pending = pending;
        return pending;
    }

    #buildArea(id) {
        const area = this.area(id);
        const level = new Level(area.definition, this.config, this.cache.modelsFor(area.definition), id, this.roomNumbers);
        try {
            level.build();
            for (const door of level.doors) {
                if (area.doors.has(door.id)) {
                    level.swingDoor(door, area.doors.get(door.id));
                }
            }
        } catch (error) {
            level.clear();
            throw error;
        }
        area.level = level;
        area.status = 'loaded';
        return level;
    }

    attach(scene, lighting) {
        if (this.disposed || this.scene) {
            throw new Error('World cannot be attached twice or after disposal');
        }
        this.scene = scene;
        this.lighting = lighting;
        lighting.register(GLOBAL_LIGHTING, this.school.globalLighting);
    }

    activateArea(id) {
        const area = this.area(id);
        if (area.status === 'active') {
            return;
        }
        if (area.status !== 'loaded' || !this.lighting) {
            throw new Error(`Area is not ready for activation: ${id}`);
        }
        const { level } = area;
        if (level.debugView !== this.debugView) {
            level.toggleDebugView();
        }
        this.lighting.register(id, area.definition.lighting);
        try {
            for (const object of level.objects) {
                this.scene.add(object);
            }
        } catch (error) {
            for (const object of level.objects) {
                this.scene.remove(object);
            }
            this.lighting.release(id);
            throw error;
        }
        this.active.set(id, level);
        area.status = 'active';
    }

    deactivateArea(id) {
        const area = this.area(id);
        if (!this.active.delete(id)) {
            return;
        }
        for (const object of area.level.objects) {
            this.scene.remove(object);
        }
        this.lighting.release(id);
        area.status = 'loaded';
    }

    unloadArea(id) {
        const area = this.area(id);
        this.deactivateArea(id);
        area.pending = null;
        area.streaming = null;
        area.loadError = null;
        area.keepUntil = 0;
        area.level?.clear();
        area.level = null;
        area.status = 'unloaded';
    }

    updateResidency(position, now, movementReach) {
        let blockedArea = null;
        for (const [id, area] of this.areas) {
            if (!area.required) {
                continue;
            }
            // Include all positions the player could reach during the upcoming physics step.
            const required = area.required.some(region => withinRegion(position, region, movementReach));
            if (required || area.approaches.some(region => withinRegion(position, region)) ||
                area.required.some(region => withinRegion(position, region, AREA_APPROACH_MARGIN))) {
                area.keepUntil = now + AREA_KEEP_MS;
                this.streamArea(id);
            } else if (now >= (area.keepUntil ?? 0) && (area.status !== 'unloaded' || area.loadError)) {
                this.unloadArea(id);
            }
            if (required && area.status !== 'active') {
                blockedArea ??= id;
            }
        }
        return blockedArea;
    }

    streamArea(id) {
        const area = this.area(id);
        if (area.status === 'active' || area.loadError || area.streaming) {
            return area.streaming;
        }
        const pending = this.loadArea(id).then(() => {
            if (area.streaming === pending) {
                this.activateArea(id);
            }
        }).catch(error => {
            if (area.streaming === pending) {
                area.loadError = error;
                console.error(`Could not load passage to ${id}`, error);
            }
        }).finally(() => {
            if (area.streaming === pending) {
                area.streaming = null;
            }
        });
        area.streaming = pending;
        return pending;
    }

    passageState(id) {
        const area = this.area(id);
        return area.status === 'active' ? 'ready' : area.loadError ? 'failed' : 'loading';
    }

    retryPassage(id) {
        this.area(id).loadError = null;
        return this.streamArea(id);
    }

    reset() {
        if (this.disposed) {
            throw new Error('World is disposed');
        }
        for (const [id, area] of this.areas) {
            this.unloadArea(id);
            area.doors.clear();
        }
        for (const id of this.initialAreaIds) {
            this.#buildArea(id);
            this.activateArea(id);
        }
    }

    dispose() {
        this.disposed = true;
        for (const id of this.areas.keys()) {
            this.unloadArea(id);
        }
        this.lighting?.dispose();
        this.cache.dispose();
    }

    toggleDebugView() {
        if (!this.school.areas.some(area => area.definition.solidRendering)) {
            return false;
        }
        this.debugView = !this.debugView;
        for (const level of this.active.values()) {
            level.toggleDebugView();
        }
        this.lighting.setDebugView(this.debugView);
        return true;
    }

    isBlocked(position, radius, height) {
        for (const level of this.active.values()) {
            if (level.isBlocked(position, radius, height)) {
                return true;
            }
        }
        return false;
    }

    getStepHeight(position, radius, height, maxStepHeight) {
        let highest = position.y;
        for (const level of this.active.values()) {
            highest = Math.max(highest, level.getStepHeight(position, radius, height, Infinity) ?? highest);
        }
        return highest > position.y && highest - position.y <= maxStepHeight + CONTACT_TOLERANCE ? highest : null;
    }

    getVerticalCollision(position, targetY, radius, height) {
        let contact = null;
        const nearest = targetY > position.y ? Math.min : Math.max;
        for (const level of this.active.values()) {
            const face = level.getVerticalCollision(position, targetY, radius, height);
            if (face !== null) {
                contact = contact === null ? face : nearest(face, contact);
            }
        }
        return contact;
    }

    getEnteredRoomId(position) {
        for (const level of this.active.values()) {
            const id = level.getEnteredRoomId(position);
            if (id !== null) {
                return id;
            }
        }
        return null;
    }

    canConfirmArrival(position) {
        return Array.from(this.active.values()).some(level => level.canConfirmArrival(position));
    }

    nearbyDoor(position) {
        let nearest = null;
        for (const level of this.active.values()) {
            const door = level.getNearbyDoor(position);
            if (door) {
                const { x, y, z } = door.definition;
                const distance = Math.hypot(position.x - x, position.y - y, position.z - z);
                if (!nearest || distance < nearest.distance || (distance === nearest.distance && door.id < nearest.door.id)) {
                    nearest = { level, door, distance };
                }
            }
        }
        return nearest;
    }

    canOpenDoor(position) {
        return this.nearbyDoor(position) !== null;
    }

    openDoor(position) {
        const candidate = this.nearbyDoor(position);
        if (!candidate) {
            return false;
        }
        const { level, door } = candidate;
        const swing = level.swingDirection(door, position);
        level.swingDoor(door, swing);
        this.area(level.areaId).doors.set(door.id, swing);
        return true;
    }
}
