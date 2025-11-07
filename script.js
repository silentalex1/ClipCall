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

const microphoneButton = document.getElementById('microphone-button');
const editingOptions = document.getElementById('editing-options');
const recordingStatus = document.getElementById('recording-status');
const timerDisplay = document.getElementById('timer');
const stopButton = document.getElementById('stop-button');
const visualizerCanvas = document.getElementById('visualizer');
const canvasCtx = visualizerCanvas.getContext('2d');
const choiceModal = document.getElementById('recording-choice-modal');
const recordMicBtn = document.getElementById('record-mic-btn');
const recordScreenBtn = document.getElementById('record-screen-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const downloadBtn = document.getElementById('download-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const spinnerContainer = document.getElementById('spinner-container');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmationMessage = document.getElementById('confirmation-message');
const closeConfirmationBtn = document.getElementById('close-confirmation-btn');

let mediaRecorder;
let audioChunks = [];
let audioContext;
let animationFrameId;
let timerInterval;
let seconds = 0;
let currentRecordingType = 'audio';

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
        canvasCtx.fillStyle = '#121212';
        canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            canvasCtx.fillStyle = `rgba(0, 122, 255, ${barHeight / 200})`;
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

const showSpinner = () => spinnerContainer.classList.remove('hidden');
const hideSpinner = () => spinnerContainer.classList.add('hidden');

const showConfirmation = (message) => {
    confirmationMessage.textContent = message;
    confirmationModal.classList.remove('hidden');
};

const resetUI = () => {
    microphoneButton.classList.remove('hidden');
    editingOptions.classList.remove('visible');
    recordingStatus.classList.add('hidden');
    microphoneButton.classList.remove('recording');
    stopVisualizer();
    stopTimer();
    audioChunks = [];
};

const startRecording = (stream) => {
    microphoneButton.classList.add('recording');
    microphoneButton.classList.add('hidden');
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
            showSpinner();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const audios = JSON.parse(localStorage.getItem('user_recordings')) || [];
                audios.unshift({ name: `Recording #${audios.length + 1}`, url: reader.result, date: new Date().toLocaleString(), duration: seconds });
                localStorage.setItem('user_recordings', JSON.stringify(audios));
                setTimeout(() => {
                    hideSpinner();
                    resetUI();
                    showConfirmation('Recording saved successfully!');
                }, 1000);
            };
        };
        editingOptions.classList.add('visible');
        microphoneButton.classList.add('hidden');
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

microphoneButton.addEventListener('click', () => choiceModal.classList.remove('hidden'));
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
closeConfirmationBtn.addEventListener('click', () => confirmationModal.classList.add('hidden'));
