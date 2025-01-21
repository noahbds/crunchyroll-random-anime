(function() {
    'use strict';

    const iconUrl = 'https://github.com/noahbds/crunchyroll-random-anime/blob/main/icons/randomimg.png?raw=true';

    function createRandomAnimeButton() {
        const headerActions = document.querySelector('ul.erc-user-actions');
        if (!headerActions) return;

        const randomButtonLi = document.createElement('li');
        randomButtonLi.className = 'user-actions-item';

        const randomButton = document.createElement('a');
        randomButton.href = 'https://www.crunchyroll.com/fr/random/anime?random_ref=topbar';
        randomButton.className = 'erc-header-tile state-icon-only erc-random-header-button';
        randomButton.tabIndex = 0;
        randomButton.dataset.t = 'header-tile';

        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'erc-header-svg';

        const buttonIcon = document.createElement('img');
        buttonIcon.src = iconUrl;
        buttonIcon.alt = 'Random Anime Icon';
        buttonIcon.style.cssText = 'width: 24px; height: 24px; display: inline-block; vertical-align: middle; margin-right: 8px;';

        const buttonText = document.createElement('span');
        buttonText.className = 'text--gq6o- text--is-l--iccTo';
        buttonText.textContent = 'Random Anime';

        buttonDiv.appendChild(buttonIcon);
        randomButton.appendChild(buttonDiv);
        randomButton.appendChild(buttonText);
        randomButtonLi.appendChild(randomButton);

        const searchButton = document.querySelector('.erc-search-header-button-old');
        if (searchButton) {
            headerActions.insertBefore(randomButtonLi, searchButton.parentNode);
        } else {
            headerActions.appendChild(randomButtonLi);
        }
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector('ul.erc-user-actions')) {
            createRandomAnimeButton();
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
