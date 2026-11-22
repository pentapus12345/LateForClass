const STARTING_LEVEL_ID = 1;
const LEVELS_URL = 'assets/levels.json';
const HALLWAY_OBJECTIVE = 'Reach the far end of the hallway';
const MAX_FRAME_DELTA = 0.25;

class Game {
    constructor(config) {
        this.config = config;
        this.clock = new THREE.Clock();
        this.started = false;
        this.completed = false;
        this.pointerLockFailed = false;
    }

    async init() {
        this.startScreen = document.getElementById('start-screen');
        this.screenTitle = document.getElementById('screen-title');
        this.screenMessage = document.getElementById('screen-message');
        this.startButton = document.getElementById('start-button');
        this.objective = document.getElementById('objective');
        const container = document.getElementById('game-container');

        const response = await fetch(LEVELS_URL);
        if (!response.ok) {
            throw new Error(`Failed to load levels.json: ${response.status}`);
        }
        const { levels } = await response.json();
        const levelDefinition = levels.find(level => level.id === STARTING_LEVEL_ID);
        if (!levelDefinition) {
            throw new Error(`Level ${STARTING_LEVEL_ID} is missing`);
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);
        this.scene.fog = new THREE.Fog(this.config.backgroundColor, this.config.fogNear, this.config.fogFar);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(1, 2, -1);
        this.scene.add(directionalLight);

        this.level = new Level(levelDefinition, this.config);
        this.player = new Player(this.config);
        this.resizeRenderer();
        this.restart();
        container.appendChild(this.renderer.domElement);

        this.startButton.addEventListener('click', () => this.start());
        document.addEventListener('keydown', event => this.onKeyDown(event));
        document.addEventListener('keyup', event => this.player.onKeyUp(event));
        document.addEventListener('mousemove', event => {
            if (this.isPlaying() && document.hasFocus()) {
                this.player.onMouseMove(event);
            }
        });
        document.addEventListener('pointerlockchange', () => {
            this.player.clearInput();
            this.updateInterface();
        });
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        window.addEventListener('blur', () => this.player.clearInput());
        window.addEventListener('resize', () => {
            this.resizeRenderer();
            this.render();
        });

        this.startButton.disabled = false;
        this.animate();
    }

    start() {
        if (this.completed) {
            this.restart();
        }
        this.started = true;
        this.pointerLockFailed = false;
        this.updateInterface();

        try {
            const request = this.renderer.domElement.requestPointerLock();
            request?.catch(() => this.onPointerLockError());
        } catch {
            this.onPointerLockError();
        }
    }

    isPlaying() {
        return this.started && !this.completed && document.pointerLockElement === this.renderer.domElement;
    }

    onPointerLockError() {
        this.pointerLockFailed = true;
        this.updateInterface();
    }

    restart() {
        this.level.build(this.scene);
        this.player.resetPosition(this.level.playerStart, this.level.playerLookAt, this.level);
        this.completed = false;
        this.pointerLockFailed = false;
        this.updateInterface();
        this.render();
    }

    onKeyDown(event) {
        if (event.repeat || !document.hasFocus()) {
            return;
        }

        if (event.code === 'KeyR' && this.started) {
            this.restart();
            return;
        }
        if (!this.isPlaying()) {
            return;
        }

        if (event.code === 'Escape') {
            document.exitPointerLock();
            return;
        }
        if (event.code === 'KeyE') {
            if (this.level.canEnterClassroom(this.player.position)) {
                this.completed = true;
                this.player.clearInput();
                this.updateInterface();
                document.exitPointerLock();
            }
            return;
        }

        if (event.code === 'Space') {
            event.preventDefault();
        }
        this.player.onKeyDown(event);
    }

    updateInterface() {
        const isPlaying = this.isPlaying();
        this.startScreen.hidden = isPlaying;
        this.objective.hidden = !isPlaying;

        if (isPlaying) {
            this.updateObjective();
            return;
        }

        if (this.completed) {
            this.screenTitle.textContent = 'You made it to class!';
            this.screenMessage.textContent = 'Level complete.';
            this.startButton.textContent = 'Play Again';
        } else if (this.started) {
            this.screenTitle.textContent = 'Paused';
            this.screenMessage.textContent = this.pointerLockFailed
                ? 'Mouse look could not start. Click Resume to try again.'
                : 'Click Resume to regain mouse control.';
            this.startButton.textContent = 'Resume';
        } else {
            this.screenTitle.textContent = 'Late For Class';
            this.screenMessage.textContent = `${HALLWAY_OBJECTIVE}.`;
            this.startButton.textContent = 'Start Game';
        }
    }

    updateObjective() {
        const instruction = this.level.canEnterClassroom(this.player.position)
            ? 'Press E to enter the classroom'
            : HALLWAY_OBJECTIVE;
        if (this.objective.textContent !== instruction) {
            this.objective.textContent = instruction;
        }
    }

    resizeRenderer() {
        const { innerWidth: width, innerHeight: height } = window;
        this.player.resizeCamera(width, height);
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.player.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = Math.min(this.clock.getDelta(), MAX_FRAME_DELTA);

        if (this.isPlaying()) {
            this.player.update(deltaTime, this.level);
            this.updateObjective();
            this.render();
        }
    }
}
