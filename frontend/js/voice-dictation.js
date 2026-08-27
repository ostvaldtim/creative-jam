/**
 * VOICE DICTATION MODULE
 * Запись голоса через микрофон → транскрипция через Replicate Whisper
 * Поддерживает как главный #taskInput, так и произвольные поля брифа
 */
const VoiceDictation = (() => {
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let isProcessing = false;

    // Current target: which input/textarea receives the transcribed text
    let currentTarget = null;
    // Current mic button being used
    let currentBtn = null;

    // Get the main mic button element
    function getMicBtn() {
        return document.getElementById('micBtn');
    }

    // SVG icons for button states
    const ICON_MIC = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`;

    const ICON_STOP = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const ICON_SPINNER = `<svg class="mic-spinner" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 018-8"/>
    </svg>`;

    // Small inline SVG for brief form mic buttons (16x16)
    const ICON_MIC_SM = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`;

    const ICON_STOP_SM = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const ICON_SPINNER_SM = `<svg width="16" height="16" class="mic-spinner" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 018-8"/>
    </svg>`;

    // Update visual state of any mic button
    function updateBtnUI(btn, state, isSmall) {
        if (!btn) return;

        btn.classList.remove('recording', 'processing');

        if (state === 'recording') {
            btn.classList.add('recording');
            btn.title = 'Остановить запись';
            btn.innerHTML = isSmall ? ICON_STOP_SM : ICON_STOP;
        } else if (state === 'processing') {
            btn.classList.add('processing');
            btn.title = 'Распознавание речи...';
            btn.innerHTML = isSmall ? ICON_SPINNER_SM : ICON_SPINNER;
        } else {
            btn.title = 'Голосовой ввод';
            btn.innerHTML = isSmall ? ICON_MIC_SM : ICON_MIC;
        }
    }

    // Update UI — delegates to current button
    function updateUI(state) {
        const isSmall = currentBtn && currentBtn !== getMicBtn();
        updateBtnUI(currentBtn || getMicBtn(), state, isSmall);
    }

    // Start recording audio
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                if (audioChunks.length === 0) {
                    updateUI('idle');
                    return;
                }

                await sendForTranscription();
            };

            mediaRecorder.start(250); // collect data every 250ms
            isRecording = true;
            updateUI('recording');

            if (typeof showNotification === 'function') {
                showNotification('Запись начата. Говорите...', 'success');
            }

        } catch (err) {
            console.error('Microphone access error:', err);
            isRecording = false;
            updateUI('idle');

            if (err.name === 'NotAllowedError') {
                if (typeof showNotification === 'function') {
                    showNotification('Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.', 'error');
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Не удалось получить доступ к микрофону', 'error');
                }
            }
        }
    }

    // Stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            isRecording = false;
            mediaRecorder.stop();
            updateUI('processing');
        }
    }

    // Send recorded audio to backend for transcription
    async function sendForTranscription() {
        isProcessing = true;
        updateUI('processing');

        try {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });

            // Convert blob to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const apiUrl = (typeof API_URL !== 'undefined') ? API_URL : '';

            const response = await fetch(`${apiUrl}/api/speech/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64 })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.text) {
                // Insert transcribed text into the target input/textarea
                const target = currentTarget || document.getElementById('taskInput');
                if (target) {
                    const currentText = target.value;
                    const separator = currentText && !currentText.endsWith(' ') && !currentText.endsWith('\n') ? ' ' : '';
                    target.value = currentText + separator + data.text;

                    // Trigger auto-resize and input events
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                    target.focus();
                }

                if (typeof showNotification === 'function') {
                    showNotification('Текст распознан и добавлен', 'success');
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Не удалось распознать речь. Попробуйте ещё раз.', 'error');
                }
            }

        } catch (error) {
            console.error('Transcription error:', error);
            if (typeof showNotification === 'function') {
                showNotification(`Ошибка распознавания: ${error.message}`, 'error');
            }
        } finally {
            isProcessing = false;
            audioChunks = [];
            updateUI('idle');
            currentTarget = null;
            currentBtn = null;
        }
    }

    // Toggle recording for the main #taskInput (original behavior)
    function toggle() {
        if (isProcessing) return;

        // Reset any active brief field mic buttons if switching to main
        if (currentBtn && currentBtn !== getMicBtn() && isRecording) {
            stopRecording();
            return;
        }

        currentTarget = document.getElementById('taskInput');
        currentBtn = getMicBtn();

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // Toggle recording for a specific input/textarea field (brief forms)
    function toggleFor(targetInput, micBtn) {
        if (isProcessing) return;

        // If already recording for a different field — stop first
        if (isRecording && currentTarget !== targetInput) {
            stopRecording();
            // Small delay to let the previous recording stop cleanly
            setTimeout(() => {
                currentTarget = targetInput;
                currentBtn = micBtn;
                startRecording();
            }, 300);
            return;
        }

        currentTarget = targetInput;
        currentBtn = micBtn;

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // Check if currently recording/processing
    function isBusy() {
        return isRecording || isProcessing;
    }

    // Public API
    return { toggle, toggleFor, isBusy };
})();

// Make globally accessible
window.VoiceDictation = VoiceDictation;
