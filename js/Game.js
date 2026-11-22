class Game {
    constructor(config) {
        this.config = config;
        this.clock = new THREE.Clock();
        this.started = false;
        this.completed = false;
        this.pointerLockFailed = false;
    }

    async init() {
        this.screen = document.getElementById('startScreen');
        this.screenTitle = document.getElementById('screenTitle');
        this.screenMessage = document.getElementById('screenMessage');
        this.startButton = document.getElementById('startButton');
        this.objective = document.getElementById('objective');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);
        this.scene.fog = new THREE.Fog(this.config.backgroundColor, this.config.fogNear, this.config.fogFar);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.rotation.order = 'YXZ';

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const light = new THREE.DirectionalLight(0xffffff, 0.6);
        light.position.set(1, 2, -1);
        this.scene.add(light);

        const response = await fetch('assets/levels.json');
        if (!response.ok) {
            throw new Error(`Failed to load levels.json: ${response.status}`);
        }
        const { levels } = await response.json();
        const levelData = levels.find(level => level.id === 1);
        if (!levelData) {
            throw new Error('Level 1 is missing');
        }

        this.level = new Level(levelData, this.config);
        this.player = new Player(this.camera, this.config);
        this.restart();
        this.onResize();

        this.startButton.addEventListener('click', () => this.start());
        document.addEventListener('keydown', event => this.onKeyDown(event));
        document.addEventListener('keyup', event => this.player.onKeyUp(event));
        document.addEventListener('mousemove', event => {
            if (this.isPlaying()) {
                this.player.onMouseMove(event);
            }
        });
        document.addEventListener('pointerlockchange', () => {
            this.player.clearInput();
            this.updateInterface();
        });
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        window.addEventListener('blur', () => this.player.clearInput());
        window.addEventListener('resize', () => this.onResize());

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
        this.player.resetPosition(this.level.playerStart, this.level.playerLookAt);
        this.completed = false;
        this.pointerLockFailed = false;
        this.updateInterface();
        this.render();
    }

    onKeyDown(event) {
        if (event.repeat) return;

        if (event.code === 'KeyR' && this.started) {
            this.restart();
            return;
        }
        if (!this.isPlaying()) return;

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

        this.player.onKeyDown(event);
    }

    updateInterface() {
        const playing = this.isPlaying();
        this.screen.hidden = playing;
        this.objective.hidden = !playing;

        if (playing) {
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
            this.screenMessage.textContent = 'Find the classroom at the end of the hallway.';
            this.startButton.textContent = 'Start Game';
        }
    }

    updateObjective() {
        const instruction = this.level.canEnterClassroom(this.player.position)
            ? 'Press E to enter the classroom'
            : 'Find the classroom at the end of the hallway';
        if (this.objective.textContent !== instruction) {
            this.objective.textContent = instruction;
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.25);

        if (this.isPlaying()) {
            this.player.update(delta, this.level);
            this.updateObjective();
            this.render();
        }
    }
}
