const SCHOOL_MINUTE_MS = 60000;
const DEFAULT_SCHOOL_TIME_SCALE = 60;

class SchoolClock {
    constructor({ startTime, timeScale = DEFAULT_SCHOOL_TIME_SCALE }, deadline) {
        this.startMs = SchoolClock.parseTime(startTime);
        this.deadlineMs = SchoolClock.parseTime(deadline);
        if (this.startMs > this.deadlineMs || !Number.isFinite(timeScale) || timeScale <= 0) {
            throw new Error('School clock requires a start time at or before the deadline and a positive time scale');
        }
        this.timeScale = timeScale;
        this.durationMs = (this.deadlineMs - this.startMs) / timeScale;
        this.reset();
    }

    static parseTime(time) {
        const parts = typeof time === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
        if (!parts) {
            throw new Error(`Invalid school time ${time}; expected HH:MM`);
        }
        return (Number(parts[1]) * 60 + Number(parts[2])) * SCHOOL_MINUTE_MS;
    }

    reset() {
        this.elapsedMs = 0;
        this.runningSince = null;
    }

    get isRunning() {
        return this.runningSince !== null;
    }

    setRunning(running, now) {
        if (running === this.isRunning) {
            return;
        }
        this.elapsedMs = this.getElapsedMs(now);
        this.runningSince = running ? now : null;
    }

    getElapsedMs(now) {
        return this.elapsedMs + (this.isRunning ? now - this.runningSince : 0);
    }

    hasReachedDeadline(now) {
        return this.getElapsedMs(now) >= this.durationMs;
    }

    formatTime(now) {
        const schoolMs = this.hasReachedDeadline(now)
            ? this.deadlineMs
            : this.startMs + this.getElapsedMs(now) * this.timeScale;
        const minutes = Math.floor(schoolMs / SCHOOL_MINUTE_MS);
        const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
        return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
    }
}
