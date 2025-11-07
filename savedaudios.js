document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const noAudiosMessage = document.getElementById('no-audios-message');
    const deleteModal = document.getElementById('delete-confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let indexToDelete = -1;

    const formatDuration = (totalSeconds) => {
        if (!totalSeconds || totalSeconds < 1) return '0:01';
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getRecordings = () => JSON.parse(localStorage.getItem('user_recordings')) || [];
    const saveRecordings = (recordings) => localStorage.setItem('user_recordings', JSON.stringify(recordings));

    const renderGallery = () => {
        const recordings = getRecordings();
        if (recordings.length === 0) {
            noAudiosMessage.classList.remove('hidden');
            galleryGrid.classList.add('hidden');
        } else {
            noAudiosMessage.classList.add('hidden');
            galleryGrid.classList.remove('hidden');
            galleryGrid.innerHTML = '';
            
            recordings.forEach((data, index) => {
                const card = document.createElement('div');
                card.classList.add('recording-card');
                card.dataset.index = index;
                const isVideo = data.url.startsWith('data:video/webm');
                const mediaElement = isVideo
                    ? `<video controls class="media-player" src="${data.url}"></video>`
                    : `<audio controls class="media-player" src="${data.url}"></audio>`;

                card.innerHTML = `
                    <div class="card-content">
                        <div class="card-title">
                            <h3 title="${data.name}">${data.name}</h3>
                            <input type="text" class="rename-input hidden" value="${data.name}" />
                        </div>
                        <div class="card-metadata">
                            <span>${data.date}</span>
                            <span>${formatDuration(data.duration)}</span>
                        </div>
                        ${mediaElement}
                    </div>
                    <div class="card-actions">
                        <button class="icon-btn rename-btn" aria-label="Rename Recording" data-tooltip="Rename">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="icon-btn delete-btn" aria-label="Delete Recording" data-tooltip="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;
                galleryGrid.appendChild(card);
            });
        }
    };

    const handleRename = (input, h3, index) => {
        const recordings = getRecordings();
        const newName = input.value.trim();
        if (newName && newName !== recordings[index].name) {
            recordings[index].name = newName;
            saveRecordings(recordings);
        }
        h3.textContent = recordings[index].name;
        h3.title = recordings[index].name;
        input.classList.add('hidden');
        h3.classList.remove('hidden');
    };

    galleryGrid.addEventListener('click', (e) => {
        const renameBtn = e.target.closest('.rename-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (renameBtn) {
            const card = renameBtn.closest('.recording-card');
            const index = parseInt(card.dataset.index, 10);
            const h3 = card.querySelector('h3');
            const input = card.querySelector('.rename-input');
            h3.classList.add('hidden');
            input.classList.remove('hidden');
            input.focus();
            input.select();

            input.onblur = () => handleRename(input, h3, index);
            input.onkeydown = (event) => {
                if (event.key === 'Enter') input.blur();
                if (event.key === 'Escape') {
                    input.value = h3.textContent;
                    input.blur();
                }
            };
        }

        if (deleteBtn) {
            indexToDelete = parseInt(deleteBtn.closest('.recording-card').dataset.index, 10);
            deleteModal.classList.remove('hidden');
        }
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (indexToDelete > -1) {
            let recordings = getRecordings();
            recordings.splice(indexToDelete, 1);
            saveRecordings(recordings);
            renderGallery();
        }
        deleteModal.classList.add('hidden');
        indexToDelete = -1;
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        indexToDelete = -1;
    });

    renderGallery();
});
