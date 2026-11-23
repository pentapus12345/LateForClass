class GameSession {
    #phase = 'ready';
    #arrivedRoomId = null;
    #schoolClock;

    constructor({ schedule, clock, destinationRoomId }) {
        this.schedule = schedule;
        this.destinationRoomId = schedule?.roomId ?? destinationRoomId ?? null;
        this.#schoolClock = clock ? new SchoolClock(clock, schedule?.startTime) : null;
    }

    get phase() {
        return this.#phase;
    }

    get isRunning() {
        return this.#phase === 'running';
    }

    get isFinished() {
        return this.#phase === 'arrived' || this.#phase === 'late';
    }

    get hasClock() {
        return this.#schoolClock !== null;
    }

    start() {
        if (this.#phase === 'ready') {
            this.#phase = 'paused';
        }
    }

    reset() {
        if (this.#phase !== 'ready') {
            this.#phase = 'paused';
        }
        this.#arrivedRoomId = null;
        this.#schoolClock?.reset();
    }

    setPlayAccess(allowed, now) {
        if (this.#phase === 'ready' || this.isFinished) {
            return false;
        }
        // A lock or focus loss at the deadline still counts as a timeout.
        if (!allowed && this.checkDeadline(now)) {
            return true;
        }
        this.#phase = allowed ? 'running' : 'paused';
        this.#schoolClock?.setRunning(allowed, now);
        return this.checkDeadline(now);
    }

    checkDeadline(now) {
        if (!this.isRunning || !this.#schoolClock?.hasReachedDeadline(now)) {
            return false;
        }
        this.#finish('late', null, now);
        return true;
    }

    enterRoom(roomId, now) {
        if (this.checkDeadline(now)) {
            return true;
        }
        if (!this.isRunning || roomId === null || roomId !== this.destinationRoomId) {
            return false;
        }
        this.#finish('arrived', roomId, now);
        return true;
    }

    confirmLegacyArrival(now) {
        if (this.checkDeadline(now)) {
            return true;
        }
        if (!this.isRunning) {
            return false;
        }
        this.#finish('arrived', null, now);
        return true;
    }

    #finish(phase, roomId, now) {
        this.#phase = phase;
        this.#arrivedRoomId = roomId;
        this.#schoolClock?.setRunning(false, now);
    }

    getSchoolTime(now) {
        return this.#schoolClock?.formatTime(now) ?? null;
    }

    snapshot(now) {
        return {
            phase: this.#phase,
            schedule: this.schedule,
            arrivedRoomId: this.#arrivedRoomId,
            schoolTime: this.getSchoolTime(now)
        };
    }
}
