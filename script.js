window.addEventListener('load', () => {
    const startupAnimation = document.getElementById('startup-animation');
    const mainUi = document.getElementById('main-ui');
    setTimeout(() => {
        startupAnimation.style.opacity = '0';
        mainUi.classList.remove('hidden');
        setTimeout(() => {
            startupAnimation.style.display = 'none';
            mainUi.style.opacity = '1';
        }, 1500);
    }, 4000);
});

const microphoneIcon = document.getElementById('microphone-icon');
const microphoneContainer = document.getElementById('microphone-container');
const editingOptions = document.getElementById('editing-options');
const controlsWrapper = document.getElementById('controls-wrapper');
const accountUiContainer = document.getElementById('account-ui-container');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const flipCard = document.querySelector('.flip-card');
const showCreateAccount = document.getElementById('show-create-account');
const showLogin = document.getElementById('show-login');
const downloadBtn = document.getElementById('download-btn');
const menuIcon = document.querySelector('.menu-icon');
const navLinks = document.querySelector('.nav-links');
const recordingStatus = document.getElementById('recording-status');
const timerDisplay = document.getElementById('timer');
const stopButton = document.getElementById('stop-button');
const visualizerCanvas = document.getElementById('visualizer');
const canvasCtx = visualizerCanvas.getContext('2d');
const choiceModal = document.getElementById('recording-choice-modal');
const recordMicBtn = document.getElementById('record-mic-btn');
const recordScreenBtn = document.getElementById('record-screen-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

let mediaRecorder;
let audioChunks = [];
let audioContext;
let animationFrameId;
let timerInterval;
let seconds = 0;
let currentRecordingType = 'audio';

menuIcon.addEventListener('click', () => navLinks.classList.toggle('active'));

const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const startTimer = () => {
    seconds = 0;
    timerDisplay.textContent = formatTime(seconds);
    timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = formatTime(seconds);
    }, 1000);
};

const stopTimer = () => clearInterval(timerInterval);

const setupVisualizer = (stream) => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    visualizerCanvas.classList.remove('hidden');
    const draw = () => {
        animationFrameId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = '#1a1a1a';
        canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
            canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };
    draw();
};

const stopVisualizer = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    visualizerCanvas.classList.add('hidden');
    if (audioContext && audioContext.state !== 'closed') audioContext.close();
};

const resetUI = () => {
    editingOptions.classList.remove('visible');
    controlsWrapper.classList.remove('editing');
    recordingStatus.classList.add('hidden');
    microphoneContainer.classList.remove('recording');
    microphoneIcon.classList.remove('on');
    stopVisualizer();
    stopTimer();
    audioChunks = [];
};

const showEditor = () => {
    const audioOnlyOptions = document.querySelectorAll('.audio-only');
    if (currentRecordingType === 'video') {
        audioOnlyOptions.forEach(el => el.classList.add('hidden'));
    } else {
        audioOnlyOptions.forEach(el => el.classList.remove('hidden'));
    }
    editingOptions.classList.add('visible');
    controlsWrapper.classList.add('editing');
};

const startRecording = (stream) => {
    microphoneIcon.classList.add('on');
    microphoneContainer.classList.add('recording');
    recordingStatus.classList.remove('hidden');
    startTimer();
    const options = { mimeType: 'video/webm; codecs=vp8,opus' };
    mediaRecorder = new MediaRecorder(stream, currentRecordingType === 'video' ? options : {});
    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blobType = currentRecordingType === 'video' ? 'video/webm' : 'audio/wav';
        const fileExtension = currentRecordingType === 'video' ? 'webm' : 'wav';
        const blob = new Blob(audioChunks, { type: blobType });
        const url = URL.createObjectURL(blob);
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url; a.download = `recording.${fileExtension}`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        };
        saveBtn.onclick = () => {
            const currentUser = sessionStorage.getItem('currentUser');
            if (currentUser) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const audios = JSON.parse(localStorage.getItem(`${currentUser}_audios`)) || [];
                    audios.push({ url: reader.result, date: new Date().toLocaleString(), duration: seconds });
                    localStorage.setItem(`${currentUser}_audios`, JSON.stringify(audios));
                    alert('Recording saved!');
                };
            } else {
                accountUiContainer.classList.remove('hidden');
            }
        };
        showEditor();
        microphoneContainer.classList.remove('recording');
        microphoneIcon.classList.remove('on');
        recordingStatus.classList.add('hidden');
        stopTimer();
        stopVisualizer();
    };
    audioChunks = [];
    mediaRecorder.start();
    stream.getVideoTracks()[0]?.addEventListener('ended', handleStopRecording);
};

const startMicrophoneRecording = async () => {
    try {
        currentRecordingType = 'audio';
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setupVisualizer(stream);
        startRecording(stream);
    } catch (error) {
        alert("Microphone permission is required.");
    }
};

const startScreenRecording = async () => {
    try {
        currentRecordingType = 'video';
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setupVisualizer(micStream);
        const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...micStream.getAudioTracks(),
            ...screenStream.getAudioTracks()
        ]);
        startRecording(combinedStream);
    } catch (error) {
        alert("Screen sharing permission is required.");
    }
};

const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
};

microphoneIcon.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    choiceModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => choiceModal.classList.add('hidden'));
recordMicBtn.addEventListener('click', () => {
    choiceModal.classList.add('hidden');
    startMicrophoneRecording();
});
recordScreenBtn.addEventListener('click', () => {
    choiceModal.classList.add('hidden');
    startScreenRecording();
});
stopButton.addEventListener('click', handleStopRecording);
cancelBtn.addEventListener('click', resetUI);
showCreateAccount.addEventListener('click', e => { e.preventDefault(); flipCard.classList.add('flipped'); });
showLogin.addEventListener('click', e => { e.preventDefault(); flipCard.classList.remove('flipped'); });

const loginBtn = document.getElementById('login-btn');
const createAccountBtn = document.getElementById('create-account-btn');
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
const saveUsers = users => localStorage.setItem('users', JSON.stringify(users));

createAccountBtn.addEventListener('click', () => {
    const username = document.getElementById('create-username').value;
    const password = document.getElementById('create-password').value;
    const users = getUsers();
    if (users.find(user => user.username === username)) {
        alert('Username already exists.');
    } else {
        users.push({ username, password });
        saveUsers(users);
        sessionStorage.setItem('currentUser', username);
        alert('Account created successfully!');
        window.location.href = 'savedaudios.html';
    }
});

loginBtn.addEventListener('click', () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const user = getUsers().find(u => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem('currentUser', username);
        alert('Login successful!');
        window.location.href = 'savedaudios.html';
    } else {
        alert('Invalid username or password.');
    }
});
