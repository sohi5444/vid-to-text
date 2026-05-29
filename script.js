// DOM Elements
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recognition = null;
let currentTranscript = '';

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initMicrophone();
  initFileUpload();
  initDemoButtons();
  initCopyDownloadButtons();
});

// Theme Toggle
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const isDark = localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');

  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });
}

// Tab switching
function initTabs() {
  const tabMic = document.getElementById('tabMic');
  const tabFile = document.getElementById('tabFile');
  const micPanel = document.getElementById('micPanel');
  const filePanel = document.getElementById('filePanel');

  tabMic.addEventListener('click', () => {
    tabMic.classList.add('border-emerald-500', 'text-emerald-600');
    tabMic.classList.remove('border-transparent', 'text-gray-500');
    tabFile.classList.remove('border-emerald-500', 'text-emerald-600');
    tabFile.classList.add('border-transparent', 'text-gray-500');
    micPanel.classList.remove('hidden');
    filePanel.classList.add('hidden');
  });

  tabFile.addEventListener('click', () => {
    tabFile.classList.add('border-emerald-500', 'text-emerald-600');
    tabFile.classList.remove('border-transparent', 'text-gray-500');
    tabMic.classList.remove('border-emerald-500', 'text-emerald-600');
    tabMic.classList.add('border-transparent', 'text-gray-500');
    filePanel.classList.remove('hidden');
    micPanel.classList.add('hidden');
  });
}

// Microphone Transcription (Web Speech API)
function initMicrophone() {
  const startBtn = document.getElementById('startMicBtn');
  const stopBtn = document.getElementById('stopMicBtn');
  const statusEl = document.getElementById('recordingStatus');
  const transcriptDiv = document.getElementById('transcriptResult');
  const micIcon = document.getElementById('micIcon');

  if (!hasSpeechRecognition) {
    statusEl.innerHTML = '❌ Your browser does not support Speech Recognition. Try Chrome, Edge, or Safari.';
    startBtn.disabled = true;
    startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    transcriptDiv.innerHTML = 'Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.';
    return;
  }

  startBtn.addEventListener('click', () => {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isRecording = true;
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      statusEl.innerHTML = '🔴 Recording... Speak now';
      micIcon.parentElement.classList.add('recording-pulse');
      micIcon.classList.remove('fa-microphone');
      micIcon.classList.add('fa-microphone-slash');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        currentTranscript += finalTranscript;
        transcriptDiv.innerHTML = currentTranscript + '<span class="text-gray-400 italic">' + interimTranscript + '</span>';
      } else if (interimTranscript) {
        transcriptDiv.innerHTML = currentTranscript + '<span class="text-gray-400 italic">' + interimTranscript + '</span>';
      }
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      statusEl.innerHTML = '❌ Error: ' + event.error + '. Please check microphone permissions.';
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };

    recognition.start();
  });

  stopBtn.addEventListener('click', () => {
    if (recognition) recognition.stop();
    stopRecording();
  });

  function stopRecording() {
    if (recognition) recognition.stop();
    isRecording = false;
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    statusEl.innerHTML = '⏹️ Recording stopped';
    micIcon.parentElement.classList.remove('recording-pulse');
    micIcon.classList.remove('fa-microphone-slash');
    micIcon.classList.add('fa-microphone');
  }
}

// File Upload Transcription (Extract audio & use Web Speech)
function initFileUpload() {
  const fileInput = document.getElementById('audioFileInput');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const fileTranscriptDiv = document.getElementById('fileTranscriptResult');
  let fileTranscript = '';

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.innerHTML = `📄 Selected: ${file.name}`;
    fileTranscriptDiv.innerHTML = '🔄 Processing audio... This may take a moment.';
    
    // Create audio element to play/pass to speech recognition alternative
    // Since Web Speech API doesn't directly take files, we'll use a different approach
    // We'll let user listen and provide manual transcription helper, OR we can use a better approach
    
    // For actual file transcription, we'll use the Web Speech API in a different way:
    // We can't directly transcribe files with Web Speech API (needs microphone)
    // So we'll provide a better solution: Audio to Text using built-in
  
    fileTranscriptDiv.innerHTML = `⚠️ Browser limitations: Direct file transcription requires server API.<br><br>
    <strong>Alternative:</strong> You can play the audio and use the Microphone tab to transcribe it.<br><br>
    <strong>Or copy your transcript here:</strong><br>
    <textarea id="manualTranscriptArea" class="w-full p-2 border rounded-lg dark:bg-gray-800 mt-2" rows="5" placeholder="Paste or type your transcript here..."></textarea>
    <button id="saveManualTranscript" class="mt-2 bg-emerald-600 text-white px-3 py-1 rounded text-sm">Save Transcript</button>`;
    
    // Add manual save button
    setTimeout(() => {
      const saveBtn = document.getElementById('saveManualTranscript');
      if (saveBtn) {
        saveBtn.onclick = () => {
          const textarea = document.getElementById('manualTranscriptArea');
          if (textarea) {
            fileTranscript = textarea.value;
            fileTranscriptDiv.innerHTML = fileTranscript;
            localStorage.setItem('fileTranscript', fileTranscript);
          }
        };
      }
    }, 100);
  });
}

// Demo text buttons (for testing UI)
function initDemoButtons() {
  const demoBtns = document.querySelectorAll('.demo-text-btn');
  const transcriptDiv = document.getElementById('transcriptResult');
  let demoTranscript = '';

  demoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      demoTranscript = text;
      transcriptDiv.innerHTML = text;
      currentTranscript = text;
    });
  });
}

// Copy & Download functions
function initCopyDownloadButtons() {
  // Microphone panel copy/download
  const copyBtn = document.getElementById('copyTranscriptBtn');
  const downloadBtn = document.getElementById('downloadTranscriptBtn');
  const clearBtn = document.getElementById('clearTranscriptBtn');
  const transcriptDiv = document.getElementById('transcriptResult');

  copyBtn.addEventListener('click', () => {
    const text = transcriptDiv.innerText || transcriptDiv.textContent;
    navigator.clipboard.writeText(text);
    showToast('📋 Copied to clipboard!');
  });

  downloadBtn.addEventListener('click', () => {
    const text = transcriptDiv.innerText || transcriptDiv.textContent;
    if (text && text !== 'Your transcription will appear here...') {
      downloadTextFile(text, 'transcript.txt');
      showToast('💾 Downloaded!');
    } else {
      showToast('Nothing to download yet', 'error');
    }
  });

  clearBtn.addEventListener('click', () => {
    transcriptDiv.innerHTML = 'Your transcription will appear here...';
    currentTranscript = '';
    showToast('Cleared');
  });

  // File panel copy/download
  const copyFileBtn = document.getElementById('copyFileTranscriptBtn');
  const downloadFileBtn = document.getElementById('downloadFileTranscriptBtn');
  const fileTranscriptDiv = document.getElementById('fileTranscriptResult');

  if (copyFileBtn) {
    copyFileBtn.addEventListener('click', () => {
      const text = fileTranscriptDiv.innerText || fileTranscriptDiv.textContent;
      navigator.clipboard.writeText(text);
      showToast('📋 Copied!');
    });
  }

  if (downloadFileBtn) {
    downloadFileBtn.addEventListener('click', () => {
      const text = fileTranscriptDiv.innerText || fileTranscriptDiv.textContent;
      if (text && text !== 'Upload a file to transcribe...' && !text.includes('limitations')) {
        downloadTextFile(text, 'file_transcript.txt');
        showToast('💾 Downloaded!');
      } else {
        showToast('No transcript to download', 'error');
      }
    });
  }
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm z-50 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}