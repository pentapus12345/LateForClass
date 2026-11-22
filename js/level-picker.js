(async () => {
    const status = document.getElementById('level-status');
    const list = document.getElementById('level-list');

    try {
        const response = await fetch('../assets/levels.json');
        if (!response.ok) {
            throw new Error(`Failed to load levels.json: ${response.status}`);
        }
        const { levels } = await response.json();
        if (levels.length === 0) {
            status.textContent = 'No levels are available.';
            return;
        }

        for (const { id, name } of levels) {
            const item = document.createElement('li');
            const link = document.createElement('a');
            const arrow = document.createElement('span');
            link.className = 'level-link';
            link.href = `../?level=${encodeURIComponent(id)}`;
            link.textContent = name;
            arrow.className = 'level-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '→';
            link.appendChild(arrow);
            item.appendChild(link);
            list.appendChild(item);
        }
        list.parentElement.hidden = false;
        status.hidden = true;
    } catch (error) {
        console.error('Unable to load the level list', error);
        status.textContent = 'Could not load levels. Reload the page to try again.';
    }
})();
