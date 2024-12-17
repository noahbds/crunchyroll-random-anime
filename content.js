(function () {
    'use strict';

    function addRandomAnimeButton() {
        const headerActions = document.querySelector('.header-actions ul.erc-user-actions');

        if (headerActions) {
            const randomButtonLi = document.createElement('li');
            randomButtonLi.className = 'user-actions-item';

            const randomButton = document.createElement('a');
            randomButton.href = 'https://www.crunchyroll.com/fr/random/anime?random_ref=topbar'; // this still works so it's nice
            randomButton.className = 'erc-header-tile state-icon-only erc-random-header-button';
            randomButton.setAttribute('tabindex', '0');
            randomButton.setAttribute('data-t', 'header-tile');

            // Create the button content (Icon + Text)
            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'erc-header-svg';

            // Create the icon image
            const buttonIcon = document.createElement('img');
            buttonIcon.src = chrome.runtime.getURL("icons/randomimg.png"); // borrowed from crunchyroll (original button)
            buttonIcon.alt = 'Random Anime Icon';
            buttonIcon.style.width = '24px';
            buttonIcon.style.height = '24px';

            buttonDiv.appendChild(buttonIcon);

            const buttonText = document.createElement('span');
            buttonText.className = 'text--gq6o- text--is-l--iccTo';

            randomButton.appendChild(buttonDiv);
            randomButton.appendChild(buttonText);
            randomButtonLi.appendChild(randomButton);

            const searchButton = document.querySelector('.erc-search-header-button');
            if (searchButton) {
                headerActions.insertBefore(randomButtonLi, searchButton.parentNode);
            }
        }
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (document.querySelector('.header-actions ul.erc-user-actions')) {
                addRandomAnimeButton();
                observer.disconnect();
                break;
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
