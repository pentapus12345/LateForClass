class GameUI {
    constructor(document) {
        this.document = document;
        this.container = document.getElementById('game-container');
        this.startScreen = document.getElementById('start-screen');
        this.screenTitle = document.getElementById('screen-title');
        this.screenMessage = document.getElementById('screen-message');
        this.startButton = document.getElementById('start-button');
        this.objective = document.getElementById('objective');
        this.schedulePanel = document.getElementById('schedule-panel');
        this.schoolTime = document.getElementById('school-time');
        this.viewStatus = document.getElementById('view-status');
        this.viewToggle = document.getElementById('view-toggle');
        this.optionsButton = document.getElementById('options-button');
        this.optionsScreen = document.getElementById('options-screen');
        this.controlForm = document.getElementById('control-form');
        this.optionsOpen = false;
    }

    configure({ title, message, schedule, destinationNumber = schedule?.roomId, hasClock, hasInteraction, supportsViewToggle }) {
        this.destinationNumber = destinationNumber;
        this.introTitle = title;
        this.introMessage = message;
        this.hasInteraction = hasInteraction;
        this.supportsViewToggle = supportsViewToggle;
        this.document.getElementById('school-clock').hidden = !hasClock;
        if (schedule) {
            this.document.getElementById('schedule-class-name').textContent = schedule.className;
            this.document.getElementById('schedule-room').textContent = `Room ${this.destinationNumber}`;
            const startTime = this.document.getElementById('schedule-start-time');
            startTime.textContent = schedule.startTime;
            startTime.dateTime = schedule.startTime;
        }
    }

    bindActions({ start, toggleView, setOptionsOpen, applyControls }) {
        this.startButton.addEventListener('click', start);
        this.viewToggle.addEventListener('click', toggleView);
        this.optionsButton.addEventListener('click', () => setOptionsOpen(true));
        this.document.getElementById('options-back').addEventListener('click', () => setOptionsOpen(false));
        this.document.getElementById('restore-controls').addEventListener('click', () => {
            applyControls({ ...DEFAULT_CONTROL_SETTINGS });
        });
        this.controlForm.addEventListener('input', () => applyControls(this.readControls()));
    }

    mountCanvas(canvas) {
        this.container.appendChild(canvas);
    }

    setEnabled(enabled) {
        this.startButton.disabled = !enabled;
        this.optionsButton.disabled = !enabled;
    }

    showLoadError(message) {
        this.setEnabled(false);
        this.screenMessage.textContent = message;
    }

    renderSession({ phase, schedule, arrivedRoomId, schoolTime }, pointerLockFailed) {
        const running = phase === 'running';
        this.startScreen.hidden = running || this.optionsOpen;
        this.optionsScreen.hidden = !this.optionsOpen;
        this.schedulePanel.hidden = !running || !schedule;
        this.renderSchoolTime(schoolTime);

        if (running) {
            return;
        }
        this.renderObjective('');
        if (phase === 'late') {
            this.screenTitle.textContent = 'You’re Late!';
            this.screenMessage.textContent = `${schedule.className} started at ${schedule.startTime} in Room ${this.destinationNumber}.`;
            this.startButton.textContent = 'Retry';
        } else if (phase === 'arrived') {
            this.screenTitle.textContent = 'You made it to class!';
            this.screenMessage.textContent = arrivedRoomId ? `You arrived at Room ${this.destinationNumber ?? arrivedRoomId}.` : 'Level complete.';
            this.startButton.textContent = 'Play Again';
        } else if (phase === 'paused') {
            this.screenTitle.textContent = 'Paused';
            this.screenMessage.textContent = pointerLockFailed
                ? 'Could not capture the cursor. Click Resume to try again.'
                : 'Click Resume to continue.';
            this.startButton.textContent = 'Resume';
        } else {
            this.screenTitle.textContent = this.introTitle;
            this.screenMessage.textContent = this.introMessage;
            this.startButton.textContent = 'Start Game';
        }
    }

    focusMenu() {
        if (this.optionsOpen) {
            this.controlForm.elements.namedItem('keyboardLayout').focus();
        } else {
            this.optionsButton.focus();
        }
    }

    readControls() {
        const settings = {};
        for (const [name, fallback] of Object.entries(DEFAULT_CONTROL_SETTINGS)) {
            const field = this.controlForm.elements.namedItem(name);
            if (typeof fallback === 'boolean') {
                settings[name] = field.checked;
            } else {
                settings[name] = typeof fallback === 'number' ? field.valueAsNumber : field.value;
            }
        }
        return normalizeControlSettings(settings);
    }

    renderControls(settings) {
        for (const [name, value] of Object.entries(settings)) {
            const field = this.controlForm.elements.namedItem(name);
            if (typeof value === 'boolean') {
                field.checked = value;
            } else {
                field.value = String(value);
            }
        }
        this.document.getElementById('keyboard-speed-value').textContent = `${settings.keyboardLookSpeed}°/s`;
        this.document.getElementById('mouse-sensitivity-value').textContent = `${settings.mouseSensitivity}×`;
        this.renderInstructions(settings);
    }

    renderControlsStatus(saved) {
        this.document.getElementById('options-status').hidden = saved;
    }

    renderInstructions({ keyboardLayout, keyboardLook, mouseLook, clickToJump }) {
        const { moveLabel, lookLabel } = KEYBOARD_LAYOUTS[keyboardLayout];
        const instructions = [`${moveLabel} to move`];
        const lookInputs = [mouseLook && 'Mouse', keyboardLook && lookLabel].filter(Boolean);
        if (lookInputs.length) {
            instructions.push(`${lookInputs.join(' or ')} to look`);
        }
        instructions.push(clickToJump ? 'Space or left click to jump' : 'Space to jump');
        if (this.hasInteraction) {
            instructions.push('E to interact');
        }
        if (this.supportsViewToggle) {
            instructions.push('V to switch views');
        }
        instructions.push('Escape to pause', 'R to restart');
        this.document.getElementById('instructions').textContent = instructions.join(' · ');
    }

    renderSchoolTime(time) {
        if (time !== null && this.schoolTime.textContent !== time) {
            this.schoolTime.textContent = time;
            this.schoolTime.dateTime = time;
        }
    }

    renderView(debugView, running) {
        this.viewStatus.hidden = !this.supportsViewToggle || !running;
        this.viewToggle.hidden = !this.supportsViewToggle;
        if (this.supportsViewToggle) {
            const label = debugView ? 'Return to solid view' : 'Show collision outlines';
            this.viewStatus.textContent = `V · ${label}`;
            this.viewToggle.textContent = label;
        }
    }

    renderObjective(instruction) {
        this.objective.hidden = !instruction;
        if (this.objective.textContent !== instruction) {
            this.objective.textContent = instruction;
        }
    }
}
