document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const audioGallery = document.getElementById('audio-gallery');
    const noAudiosMessage = document.getElementById('no-audios-message');

    const getCurrentUser = () => {
        let currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = '/';
        }
        return currentUser;
    };

    const displayWelcomeMessage = (currentUser) => {
        if (currentUser) {
            welcomeMessage.textContent = `Welcome, ${currentUser}`;
        }
    };

    const displaySavedAudios = (currentUser) => {
        if (!currentUser) return;

        const savedAudios = JSON.parse(localStorage.getItem(`${currentUser}_audios`)) || [];

        if (savedAudios.length === 0) {
            noAudiosMessage.classList.remove('hidden');
        } else {
            audioGallery.innerHTML = '';
            savedAudios.forEach((audioData, index) => {
                const card = document.createElement('div');
                card.classList.add('audio-card');

                card.innerHTML = `
                    <h3 class="audio-title">Recording ${index + 1}</h3>
                    <p class="audio-date">Saved on: ${audioData.date}</p>
                    <audio controls class="audio-player" src="${audioData.url}"></audio>
                `;
                audioGallery.appendChild(card);
            });
        }
    };

    const currentUser = getCurrentUser();
    displayWelcomeMessage(currentUser);
    displaySavedAudios(currentUser);
});
