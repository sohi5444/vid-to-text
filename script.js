// DOM Elements
let recognition = null;
let currentTranscript = '';
let isRecording = false;

// Storage keys
const STORAGE_KEYS = {
  MIC_TRANSCRIPT: 'mic_transcript',
  FILE_TRANSCRIPT: 'file_transcript',
  FILE_NAME: 'file_name',
  TEXT_CONTENT: 'text_content'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initMicrophone();
  initFileUpload();
  initTextPanel();
  initDemoButtons();
  initTemplates();
  loadSavedData();
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

// Load saved data from localStorage
function loadSavedData() {
  // Load mic transcript
  const savedMic = localStorage.getItem(STORAGE_KEYS.MIC_TRANSCRIPT);
  if (savedMic) {
    currentTranscript = savedMic;
    const transcriptDiv = document.getElementById('transcriptResult');
    if (transcriptDiv) transcriptDiv.innerHTML = savedMic;
  }
  
  // Load file transcript
  const savedFile = localStorage.getItem(STORAGE_KEYS.FILE_TRANSCRIPT);
  if (savedFile) {
    const fileArea = document.getElementById('fileTranscriptArea');
    if (fileArea) fileArea.value = savedFile;
  }
  
  // Load text panel content
  const savedText = localStorage.getItem(STORAGE_KEYS.TEXT_CONTENT);
  if (savedText) {
    const textArea = document.getElementById('directTextArea');
    if (textArea) {
      textArea.value = savedText;
      updateCharCount();
    }
  }
}

// Tab switching
function initTabs() {
  const tabMic = document.getElementById('tabMic');
  const tabFile = document.getElementById('tabFile');
  const tabText = document.getElementById('tabText');
  const micPanel = document.getElementById('micPanel');
  const filePanel = document.getElementById('filePanel');
  const textPanel = document.getElementById('textPanel');

  function setActiveTab(activeTab) {
    [tabMic, tabFile, tabText].forEach(tab => {
      tab.classList.remove('border-emerald-500', 'text-emerald-600');
      tab.classList.add('border-transparent', 'text-gray-500');
    });
    activeTab.classList.add('border-emerald-500', 'text-emerald-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    
    micPanel.classList.add('hidden');
    filePanel.classList.add('hidden');
    textPanel.classList.add('hidden');
    
    if (activeTab === tabMic) micPanel.classList.remove('hidden');
    else if (activeTab === tabFile) filePanel.classList.remove('hidden');
    else if (activeTab === tabText) textPanel.classList.remove('hidden');
  }

  tabMic.addEventListener('click', () => setActiveTab(tabMic));
  tabFile.addEventListener('click', () => setActiveTab(tabFile));
  tabText.addEventListener('click', () => setActiveTab(tabText));
}

// Microphone Transcription (Web Speech API)
function initMicrophone() {
  const startBtn = document.getElementById('startMicBtn');
  const stopBtn = document.getElementById('stopMicBtn');
  const statusEl = document.getElementById('recordingStatus');
  const transcriptDiv = document.getElementById('transcriptResult');
  const micIcon = document.getElementById('micIcon');
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    statusEl.innerHTML = '❌ Your browser does not support Speech Recognition. Try Chrome, Edge, or Safari.';
    startBtn.disabled = true;
    startBtn.classList.add('opacity-50');
    transcriptDiv.innerHTML = 'Speech recognition not supported in this browser.';
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
        localStorage.setItem(STORAGE_KEYS.MIC_TRANSCRIPT, currentTranscript);
      } else if (interimTranscript) {
        transcriptDiv.innerHTML = currentTranscript + '<span class="text-gray-400 italic">' + interimTranscript + '</span>';
      }
    };

    recognition.onerror = (event) => {
      statusEl.innerHTML = '❌ Error: ' + event.error;
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

// File Upload - with drag & drop, audio preview, and manual transcript entry
function initFileUpload() {
  const fileInput = document.getElementById('audioFileInput');
  const dropZone = document.getElementById('dropZone');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const audioPlayerContainer = document.getElementById('audioPlayerContainer');
  const audioPreview = document.getElementById('audioPreview');
  const audioFileName = document.getElementById('audioFileName');
  const fileTranscriptArea = document.getElementById('fileTranscriptArea');
  const fileStatus = document.getElementById('fileTranscriptStatus');
  
  // Auto-save file transcript
  if (fileTranscriptArea) {
    fileTranscriptArea.addEventListener('input', () => {
      localStorage.setItem(STORAGE_KEYS.FILE_TRANSCRIPT, fileTranscriptArea.value);
      if (fileStatus) {
        fileStatus.innerHTML = '✓ Auto-saved';
        setTimeout(() => { if(fileStatus) fileStatus.innerHTML = ''; }, 1500);
      }
    });
  }
  
  // Handle file selection
  function handleFile(file) {
    if (!file) return;
    
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/mp4', 'audio/ogg', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|mp4|webm)$/i)) {
      alert('Please select an audio or video file (MP3, WAV, M4A, OGG, MP4, WEBM)');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large! Maximum 50MB');
      return;
    }
    
    fileNameDisplay.innerHTML = `📄 Selected: ${file.name}`;
    localStorage.setItem(STORAGE_KEYS.FILE_NAME, file.name);
    
    // Create audio URL for preview
    const url = URL.createObjectURL(file);
    audioPreview.src = url;
    audioFileName.textContent = file.name;
    audioPlayerContainer.classList.remove('hidden');
    
    // Show helpful message
    fileStatus.innerHTML = '🎧 Audio loaded! Play the file and type what you hear below.';
    setTimeout(() => {
      if(fileStatus) fileStatus.innerHTML = '';
    }, 4000);
  }
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
  
  // Drag & drop
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
    
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
  }
  
  // Copy file transcript
  const copyFileBtn = document.getElementById('copyFileTranscriptBtn');
  if (copyFileBtn) {
    copyFileBtn.addEventListener('click', () => {
      const text = fileTranscriptArea.value;
      if (text) {
        navigator.clipboard.writeText(text);
        showToast('📋 Copied to clipboard!');
      } else {
        showToast('Nothing to copy', 'error');
      }
    });
  }
  
  // Download file transcript
  const downloadFileBtn = document.getElementById('downloadFileTranscriptBtn');
  if (downloadFileBtn) {
    downloadFileBtn.addEventListener('click', () => {
      const text = fileTranscriptArea.value;
      if (text) {
        downloadTextFile(text, 'file_transcript.txt');
        showToast('💾 Downloaded!');
      } else {
        showToast('No transcript to download', 'error');
      }
    });
  }
  
  // Clear file transcript
  const clearFileBtn = document.getElementById('clearFileTranscriptBtn');
  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', () => {
      fileTranscriptArea.value = '';
      localStorage.setItem(STORAGE_KEYS.FILE_TRANSCRIPT, '');
      showToast('Cleared');
    });
  }
  
  // Voice typing into file transcript
  const voiceTypeBtn = document.getElementById('speechToTextFromFileBtn');
  if (voiceTypeBtn) {
    voiceTypeBtn.addEventListener('click', () => {
      const SpeechRecog = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecog) {
        showToast('Speech recognition not supported', 'error');
        return;
      }
      
      const tempRecog = new SpeechRecog();
      tempRecog.continuous = false;
      tempRecog.interimResults = false;
      tempRecog.lang = 'en-US';
      
      voiceTypeBtn.innerHTML = '<i class="fas fa-microphone"></i> Listening...';
      voiceTypeBtn.disabled = true;
      
      tempRecog.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const currentText = fileTranscriptArea.value;
        fileTranscriptArea.value = currentText + (currentText ? ' ' : '') + spokenText;
        localStorage.setItem(STORAGE_KEYS.FILE_TRANSCRIPT, fileTranscriptArea.value);
        showToast('✓ Added from voice');
      };
      
      tempRecog.onerror = () => {
        showToast('Voice input failed', 'error');
      };
      
      tempRecog.onend = () => {
        voiceTypeBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Type';
        voiceTypeBtn.disabled = false;
      };
      
      tempRecog.start();
    });
  }
}

// Text Panel (direct text input)
function initTextPanel() {
  const textArea = document.getElementById('directTextArea');
  const copyBtn = document.getElementById('copyTextBtn');
  const downloadBtn = document.getElementById('downloadTextBtn');
  const clearBtn = document.getElementById('clearTextBtn');
  const charCount = document.getElementById('textCharCount');
  
  function updateCharCount() {
    if (charCount && textArea) {
      const count = textArea.value.length;
      charCount.innerHTML = `${count} characters | ~${Math.ceil(count / 5)} words`;
    }
  }
  
  if (textArea) {
    textArea.addEventListener('input', () => {
      localStorage.setItem(STORAGE_KEYS.TEXT_CONTENT, textArea.value);
      updateCharCount();
    });
    updateCharCount();
  }
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (textArea.value) {
        navigator.clipboard.writeText(textArea.value);
        showToast('📋 Copied!');
      } else {
        showToast('Nothing to copy', 'error');
      }
    });
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (textArea.value) {
        downloadTextFile(textArea.value, 'my_transcript.txt');
        showToast('💾 Downloaded!');
      } else {
        showToast('Nothing to download', 'error');
      }
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textArea.value = '';
      localStorage.setItem(STORAGE_KEYS.TEXT_CONTENT, '');
      updateCharCount();
      showToast('Cleared');
    });
  }
}

// Mic panel copy/download/clear
function initCopyDownloadButtons() {
  const copyBtn = document.getElementById('copyTranscriptBtn');
  const downloadBtn = document.getElementById('downloadTranscriptBtn');
  const clearBtn = document.getElementById('clearTranscriptBtn');
  const transcriptDiv = document.getElementById('transcriptResult');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = transcriptDiv.innerText || transcriptDiv.textContent;
      if (text && text !== 'Your transcription will appear here...') {
        navigator.clipboard.writeText(text);
        showToast('📋 Copied!');
      } else {
        showToast('Nothing to copy', 'error');
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const text = transcriptDiv.innerText || transcriptDiv.textContent;
      if (text && text !== 'Your transcription will appear here...') {
        downloadTextFile(text, 'mic_transcript.txt');
        showToast('💾 Downloaded!');
      } else {
        showToast('No transcript', 'error');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      transcriptDiv.innerHTML = 'Your transcription will appear here...';
      currentTranscript = '';
      localStorage.setItem(STORAGE_KEYS.MIC_TRANSCRIPT, '');
      showToast('Cleared');
    });
  }
}

// Demo text buttons
function initDemoButtons() {
  const demoBtns = document.querySelectorAll('.demo-text-btn');
  const transcriptDiv = document.getElementById('transcriptResult');
  const fileArea = document.getElementById('fileTranscriptArea');
  const textArea = document.getElementById('directTextArea');
  
  // Determine which panel is active
  function getActiveTarget() {
    const micPanel = document.getElementById('micPanel');
    const filePanel = document.getElementById('filePanel');
    const textPanel = document.getElementById('textPanel');
    
    if (!micPanel.classList.contains('hidden')) return 'mic';
    if (!filePanel.classList.contains('hidden')) return 'file';
    if (!textPanel.classList.contains('hidden')) return 'text';
    return 'mic';
  }
  
  demoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      const target = getActiveTarget();
      
      if (target === 'mic') {
        currentTranscript = text;
        transcriptDiv.innerHTML = text;
        localStorage.setItem(STORAGE_KEYS.MIC_TRANSCRIPT, text);
      } else if (target === 'file' && fileArea) {
        const current = fileArea.value;
        fileArea.value = current + (current ? '\n\n' : '') + text;
        localStorage.setItem(STORAGE_KEYS.FILE_TRANSCRIPT, fileArea.value);
      } else if (target === 'text' && textArea) {
        const current = textArea.value;
        textArea.value = current + (current ? '\n\n' : '') + text;
        localStorage.setItem(STORAGE_KEYS.TEXT_CONTENT, textArea.value);
        updateCharCount();
      }
      
      showToast(`✓ Added to ${target} panel`);
    });
  });
}

// Templates for different use cases
function initTemplates() {
  const templates = {
    'Meeting Notes Template': `MEETING NOTES\nDate: ___________\nAttendees: ___________\n\nAgenda:\n1. \n2. \n3. \n\nKey Decisions:\n- \n- \n\nAction Items:\n- [ ] \n- [ ] \n\nNext Meeting: ___________`,
    'Interview Transcript Template': `INTERVIEW TRANSCRIPT\nInterviewer: ___________\nSubject: ___________\nDate: ___________\n\nQ: \nA: \n\nQ: \nA: \n\nKey Takeaways:\n- \n- `,
    'YouTube Video Script': `[INTRO - 0:00-0:30]\n\n[MAIN CONTENT - 0:30-5:00]\n\n[OUTRO - 5:00-6:00]\n\nCall to Action: Like, subscribe, comment!`,
    'Podcast Episode Notes': `🎙️ EPISODE TITLE: ___________\n\n🕐 Timestamps:\n0:00 - Introduction\n5:00 - Main topic\n15:00 - Guest interview\n25:00 - Q&A\n30:00 - Outro\n\n📝 Show Notes:\n• \n• \n\n🔗 Resources:\n- \n- `
  };
  
  const templateBtns = document.querySelectorAll('.template-btn');
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const templateName = btn.textContent.trim();
      const templateText = templates[templateName];
      if (!templateText) return;
      
      const micPanel = document.getElementById('micPanel');
      const fileArea = document.getElementById('fileTranscriptArea');
      const textArea = document.getElementById('directTextArea');
      
      if (!micPanel.classList.contains('hidden')) {
        currentTranscript = templateText;
        document.getElementById('transcriptResult').innerHTML = templateText;
        localStorage.setItem(STORAGE_KEYS.MIC_TRANSCRIPT, templateText);
      } else if (fileArea && !document.getElementById('filePanel').classList.contains('hidden')) {
        fileArea.value = templateText;
        localStorage.setItem(STORAGE_KEYS.FILE_TRANSCRIPT, templateText);
      } else if (textArea && !document.getElementById('textPanel').classList.contains('hidden')) {
        textArea.value = templateText;
        localStorage.setItem(STORAGE_KEYS.TEXT_CONTENT, templateText);
        updateCharCount();
      }
      
      showToast(`✓ ${templateName} inserted`);
    });
  });
}

function updateCharCount() {
  const textArea = document.getElementById('directTextArea');
  const charCount = document.getElementById('textCharCount');
  if (textArea && charCount) {
    const count = textArea.value.length;
    charCount.innerHTML = `${count} characters | ~${Math.ceil(count / 5)} words`;
  }
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white text-sm z-50 animate-fade-in ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Initialize copy/download buttons after DOM
setTimeout(() => initCopyDownloadButtons(), 100);