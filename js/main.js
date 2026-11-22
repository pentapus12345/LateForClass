// Initialize the game after its scripts and page have loaded.
(async () => {
    try {
        const game = new Game(window.gameConfig);
        await game.init();
    } catch (error) {
        console.error('Unable to start Late For Class', error);
        document.getElementById('screenMessage').textContent =
            'Could not load the game. Check your connection and reload the page.';
    }
})();
