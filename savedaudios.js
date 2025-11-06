document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const audioGallery = document.getElementById('audio-gallery');
    const noAudiosMessage = document.getElementById('no-audios-message');

    const getCurrentUser = () => {
        const currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = 'index.html';
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

        const savedRecordings = JSON.parse(localStorage.getItem(`${currentUser}_audios`)) || [];

        if (savedRecordings.length === 0) {
            noAudiosMessage.classList.remove('hidden');
            audioGallery.classList.add('hidden');
        } else {
            noAudiosMessage.classList.add('hidden');
            audioGallery.classList.remove('hidden');
            audioGallery.innerHTML = '';
            
            savedRecordings.forEach((data, index) => {
                const card = document.createElement('div');
                card.classList.add('audio-card');
                card.dataset.index = index;
                const isVideo = data.url.startsWith('data:video/webm');
                const mediaElement = isVideo
                    ? `<video controls class="media-player" src="${data.url}"></video>`
                    : `<audio controls class="media-player" src="${data.url}"></audio>`;

                card.innerHTML = `
                    <div class="card-header">
                        <h3 class="audio-title">Recording #${index + 1}</h3>
                        <div class="audio-metadata">
                            <span class="audio-date">${data.date}</span>
                            <span class="audio-duration">Duration: ${formatDuration(data.duration)}</span>
                        </div>
                        ${mediaElement}
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
                let recordings = JSON.parse(localStorage.getItem(`${currentUser}_audios`)) || [];
                recordings.splice(indexToDelete, 1);
                localStorage.setItem(`${currentUser}_audios`, JSON.stringify(recordings));
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
