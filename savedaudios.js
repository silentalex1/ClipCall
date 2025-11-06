document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const audioGallery = document.getElementById('audio-gallery');
    const noAudiosMessage = document.getElementById('no-audios-message');

    const getCurrentUser = () => {
        const currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = '/';
        }
        return currentUser;
    };

    const formatDuration = (totalSeconds) => {
        if (!totalSeconds || totalSeconds < 1) {
            return '0:01';
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const renderGallery = () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const savedAudios = JSON.parse(localStorage.getItem(`${currentUser}_audios`)) || [];

        if (savedAudios.length === 0) {
            noAudiosMessage.classList.remove('hidden');
            audioGallery.classList.add('hidden');
        } else {
            noAudiosMessage.classList.add('hidden');
            audioGallery.classList.remove('hidden');
            audioGallery.innerHTML = '';
            
            savedAudios.forEach((audioData, index) => {
                const card = document.createElement('div');
                card.classList.add('audio-card');
                card.dataset.index = index;

                card.innerHTML = `
                    <div class="card-header">
                        <h3 class="audio-title">Recording #${index + 1}</h3>
                        <div class="audio-metadata">
                            <span class="audio-date">${audioData.date}</span>
                            <span class="audio-duration">Duration: ${formatDuration(audioData.duration)}</span>
                        </div>
                        <audio controls class="audio-player" src="${audioData.url}"></audio>
                    </div>
                    <div class="card-footer">
                        <button class="card-action-btn delete-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            Delete
                        </button>
                    </div>
                `;
                audioGallery.appendChild(card);
            });
        }
    };

    audioGallery.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const card = deleteButton.closest('.audio-card');
            const indexToDelete = parseInt(card.dataset.index, 10);
            const currentUser = getCurrentUser();
            
            if (confirm(`Are you sure you want to delete Recording #${indexToDelete + 1}?`)) {
                let savedAudios = JSON.parse(localStorage.getItem(`${currentUser}_audios`)) || [];
                savedAudios.splice(indexToDelete, 1);
                localStorage.setItem(`${currentUser}_audios`, JSON.stringify(savedAudios));
                renderGallery(); 
            }
        }
    });

    const currentUser = getCurrentUser();
    if (currentUser) {
        welcomeMessage.textContent = `Welcome, ${currentUser}`;
        renderGallery();
    }
});
