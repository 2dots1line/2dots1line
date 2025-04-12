// Speech recognition implementation
let recognition = null;
let isRecording = false;
let recordingTimeout = null;
let recognitionAttempts = 0;
const MAX_RECOGNITION_ATTEMPTS = 3;

// DOM element references
let micButton;
let recordingIndicator;
let recordingStatus;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Set up DOM references
  micButton = document.getElementById('mic-button') || 
              document.getElementById('voice-toggle') || 
              document.querySelector('.mic-button');
              
  recordingIndicator = document.getElementById('recording-indicator') || 
                       document.querySelector('.recording-indicator');
                       
  recordingStatus = document.getElementById('recording-status') || 
                    document.getElementById('voice-status') || 
                    document.querySelector('.voice-status');
  
  // Create elements if they don't exist
  if (!recordingStatus) {
    recordingStatus = document.createElement('div');
    recordingStatus.id = 'recording-status';
    recordingStatus.className = 'voice-status';
    recordingStatus.style.display = 'none';
    document.body.appendChild(recordingStatus);
  }
  
  if (!recordingIndicator) {
    recordingIndicator = document.createElement('div');
    recordingIndicator.id = 'recording-indicator';
    recordingIndicator.className = 'recording-indicator';
    recordingIndicator.style.display = 'none';
    recordingIndicator.textContent = '🔴';
    document.body.appendChild(recordingIndicator);
  }
  
  if (!micButton) {
    console.warn('No microphone button found in the DOM. Voice recognition controls may not work properly.');
  } else {
    // Set up event listener for the microphone button
    micButton.addEventListener('click', function() {
      startRecording();
    });
  }
  
  // Check browser support on init
  const supportStatus = checkVoiceRecognitionSupport();
  if (!supportStatus.supported) {
    console.warn('Voice recognition not supported in this browser:', supportStatus);
    
    if (recordingStatus) {
      recordingStatus.textContent = "Voice recognition not supported in this browser.";
      recordingStatus.style.color = 'red';
      recordingStatus.style.display = 'block';
    }
    
    if (micButton) {
      micButton.disabled = true;
      micButton.title = "Voice recognition not supported in this browser";
    }
  } else {
    console.log('Voice recognition is supported in this browser');
    
    // Initialize recognition
    resetRecognition();
  }
});

// Initialize speech recognition with better error handling
function initSpeechRecognition() {
  try {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      showErrorMessage('Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Set up event handlers
    recognition.onstart = function() {
      console.log('Voice recognition started');
      isRecording = true;
      document.getElementById('mic-icon').classList.add('recording');
      document.getElementById('recording-indicator').style.display = 'block';
      
      // Safety timeout - stop recording after 2 minutes if not stopped manually
      clearTimeout(recordingTimeout);
      recordingTimeout = setTimeout(() => {
        stopRecording();
        showErrorMessage('Recording automatically stopped after 2 minutes');
      }, 120000);
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = '';
      
      switch(event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Microphone access was denied. Please check your browser permissions and try again.';
          break;
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please ensure your microphone is connected.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Recording was aborted.';
          break;
        default:
          errorMessage = `Error: ${event.error}. Please try again.`;
      }
      
      showErrorMessage(errorMessage);
      stopRecording();
    };
    
    recognition.onend = function() {
      console.log('Voice recognition ended');
      isRecording = false;
      document.getElementById('mic-icon').classList.remove('recording');
      document.getElementById('recording-indicator').style.display = 'none';
      clearTimeout(recordingTimeout);
      recognitionAttempts = 0; // Reset attempts counter when successfully ended
    };
    
    recognition.onresult = function(event) {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript !== '') {
        document.getElementById('message-input').value += finalTranscript + ' ';
      }
      
      console.log('Interim:', interimTranscript);
      console.log('Final:', finalTranscript);
    };
    
    return recognition;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    showErrorMessage('Failed to initialize speech recognition: ' + error.message);
    return null;
  }
}

// Display error message to the user
function showErrorMessage(message) {
  const errorElement = document.getElementById('voice-error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  } else {
    // Fallback if error element doesn't exist
    console.error('Voice recognition error:', message);
    alert('Voice recognition error: ' + message);
  }
}

// Check for microphone permissions directly
function checkMicrophonePermission() {
  return new Promise((resolve, reject) => {
    navigator.permissions.query({ name: 'microphone' })
      .then(permissionStatus => {
        console.log('Microphone permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
          resolve(true);
        } else if (permissionStatus.state === 'prompt') {
          // We'll need to request permission
          resolve(false);
        } else if (permissionStatus.state === 'denied') {
          showErrorMessage('Microphone access is blocked. Please allow access in your browser settings and reload the page.');
          reject(new Error('Microphone permission denied'));
        }
        
        // Listen for changes in permission state
        permissionStatus.onchange = function() {
          console.log('Microphone permission state changed to:', this.state);
          if (this.state === 'granted') {
            // If user grants permission after initially denying
            showErrorMessage('Microphone access granted! You can now use voice recording.');
          }
        };
      })
      .catch(error => {
        console.error('Error checking microphone permission:', error);
        // Permissions API might not be supported, we'll fall back to getUserMedia
        resolve(false);
      });
  });
}

// Function to start voice recording
function startRecording() {
  // If we're already recording, stop it first
  if (isRecording) {
    stopRecording();
    return;
  }

  // Check browser support first
  const supportStatus = checkVoiceRecognitionSupport();
  if (!supportStatus.supported) {
    const errorMessage = "Your browser doesn't support voice recognition. " + 
      (!supportStatus.speechRecognition ? "Speech recognition API is not available. " : "") +
      (!supportStatus.getUserMedia ? "Microphone access is not supported. " : "");
    
    showRecognitionError(errorMessage);
    return;
  }

  // Update UI to show we're trying to start
  showLoading(true);
  
  // Reset state and create new recognition object
  resetRecognition();
  
  // Check for microphone availability
  checkMicrophoneExists()
    .then(hasMicrophone => {
      if (hasMicrophone === false) {
        showRecognitionError("No microphone detected. Please connect a microphone and try again.");
        showLoading(false);
        return;
      }
      
      // If we're unsure if there's a microphone (due to permissions) or we confirmed one exists,
      // try to access it with explicit permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          
          // Now that we have permission, start the recognition
          try {
            // Set up recognition properties
            recognition.continuous = true;
            recognition.interimResults = true;
            
            // Start recording
            recognition.start();
            isRecording = true;
            
            // Update UI
            micButton.classList.add('recording');
            recordingIndicator.style.display = 'inline-block';
            showMicrophoneAccess(true);
            showLoading(false);
            
            console.log('Recording started');
          } catch (error) {
            console.error('Error starting recognition:', error);
            showRecognitionError("Error starting voice recognition: " + error.message);
            showLoading(false);
          }
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            showRecognitionError("Microphone access was denied. Please allow microphone access in your browser settings.");
          } else if (error.name === 'NotFoundError') {
            showRecognitionError("No microphone was found. Please check your microphone connection.");
          } else {
            showRecognitionError("Error accessing microphone: " + error.message);
          }
          showMicrophoneAccess(false);
          showLoading(false);
        });
    })
    .catch(error => {
      console.error('Error checking microphone:', error);
      showRecognitionError("Error checking for microphone: " + error.message);
      showLoading(false);
    });
}

// Helper function to show recognition errors
function showRecognitionError(message) {
  console.error(message);
  recordingStatus.textContent = message;
  recordingStatus.style.color = 'red';
  recordingStatus.style.display = 'block';
  
  // Reset buttons/indicators
  micButton.classList.remove('recording');
  recordingIndicator.style.display = 'none';
}

// Helper function to show microphone access status
function showMicrophoneAccess(granted) {
  if (granted) {
    recordingStatus.textContent = 'Microphone access granted. You can speak now.';
    recordingStatus.style.color = 'green';
  } else {
    recordingStatus.textContent = 'Microphone access not available.';
    recordingStatus.style.color = 'red';
  }
  recordingStatus.style.display = 'block';
}

// Helper function to show/hide loading state
function showLoading(isLoading) {
  if (isLoading) {
    recordingStatus.textContent = 'Initializing microphone...';
    recordingStatus.style.color = 'blue';
    recordingStatus.style.display = 'block';
  }
}

// Improved reset function
function resetRecognition() {
  // Stop any existing recognition
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore errors on stop
    }
  }
  
  // Create a new recognition instance
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  isRecording = false;
  
  // Configure recognition settings
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US'; // Set language to English
  
  // Variables to store transcript
  let finalTranscript = '';
  
  // Add event listeners
  recognition.onstart = function() {
    console.log('Recognition started');
    isRecording = true;
    recordingStatus.textContent = 'Listening...';
    recordingStatus.style.color = 'green';
    recordingStatus.style.display = 'block';
    // Reset the transcript when starting new recognition
    finalTranscript = '';
  };
  
  recognition.onresult = function(event) {
    let interimTranscript = '';
    
    // Process the results
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
        console.log('Final transcript:', finalTranscript);
      } else {
        interimTranscript += transcript;
        console.log('Interim transcript:', interimTranscript);
      }
    }
    
    // Update the status with interim results
    if (interimTranscript !== '') {
      recordingStatus.textContent = 'Heard: ' + interimTranscript;
    }
    
    // If we have a final transcript and it's not empty, process it
    if (finalTranscript.trim() !== '') {
      // Find the chat input field first
      const chatInput = document.getElementById('message-input') || 
                       document.getElementById('chat-input') || 
                       document.querySelector('input[name="message"]') ||
                       document.querySelector('textarea[name="message"]');
      
      // If we're just updating the input field without submitting
      if (chatInput) {
        chatInput.value = finalTranscript.trim();
      }
    }
  };
  
  recognition.onerror = function(event) {
    console.error('Recognition error:', event.error);
    
    // Handle specific error types
    if (event.error === 'no-speech') {
      showRecognitionError('No speech was detected. Please try again.');
    } else if (event.error === 'audio-capture') {
      showRecognitionError('Audio capture failed. Please check your microphone.');
    } else if (event.error === 'not-allowed') {
      showRecognitionError('Microphone access was denied. Please allow microphone access.');
    } else if (event.error === 'network') {
      showRecognitionError('Network error occurred. Please check your connection.');
    } else if (event.error === 'aborted') {
      console.log('Recognition aborted');
      // This is normal when stopping, don't show an error
    } else {
      showRecognitionError('Error: ' + event.error);
    }
    
    isRecording = false;
    micButton.classList.remove('recording');
    recordingIndicator.style.display = 'none';
  };
  
  recognition.onend = function() {
    console.log('Recognition ended');
    
    // Process the final transcript when recognition ends
    if (finalTranscript.trim() !== '') {
      processVoiceCommand(finalTranscript.trim());
    }
    
    isRecording = false;
    
    // Only update UI if this was not an error case (errors are handled in onerror)
    if (recordingStatus.style.color !== 'red') {
      recordingStatus.textContent = 'Voice recognition stopped';
      recordingStatus.style.color = 'black';
    }
    
    micButton.classList.remove('recording');
    recordingIndicator.style.display = 'none';
  };
}

// Helper function to detect browser
function getBrowserName() {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "IE";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  
  return null;
}

// Get browser-specific permission instructions
function getPermissionInstructions(browser) {
  switch(browser) {
    case "Chrome":
      return " Click the camera icon in the address bar and select 'Allow'.";
    case "Firefox":
      return " Click the microphone icon in the address bar and select 'Allow'.";
    case "Safari":
      return " Go to Safari > Preferences > Websites > Microphone and allow access for this site.";
    case "Edge":
      return " Click the lock icon in the address bar and enable microphone access.";
    default:
      return " Check your browser settings to allow microphone access.";
  }
}

// Show success message
function showSuccessMessage(message) {
  const messageContainer = document.getElementById('mic-status') || 
                          document.getElementById('voiceStatus') || 
                          document.querySelector('.voice-status');
                          
  if (messageContainer) {
    messageContainer.textContent = message;
    messageContainer.style.color = '#4CAF50';
    setTimeout(() => {
      messageContainer.textContent = 'Voice input ready';
      messageContainer.style.color = '';
    }, 3000);
  }
}

// Function to stop voice recording
function stopRecording() {
  if (!isRecording || !recognition) {
    return;
  }
  
  try {
    recognition.stop();
    console.log('Recognition stopped');
  } catch (error) {
    console.error('Error stopping recognition:', error);
  }
  
  // Update UI
  isRecording = false;
  micButton.classList.remove('recording');
  recordingIndicator.style.display = 'none';
  recordingStatus.textContent = 'Voice recognition stopped';
  recordingStatus.style.color = 'black';
  recordingStatus.style.display = 'block';
}

// Function to process voice commands received from the recognition
function processVoiceCommand(command) {
  if (!command || typeof command !== 'string') {
    return;
  }
  
  const trimmedCommand = command.trim();
  console.log('Processing command:', trimmedCommand);
  
  // Update status to show the command
  recordingStatus.textContent = 'Command: ' + trimmedCommand;
  recordingStatus.style.color = 'blue';
  
  // Find the chat input field
  const chatInput = document.getElementById('message-input') || 
                   document.getElementById('chat-input') || 
                   document.querySelector('input[name="message"]') ||
                   document.querySelector('textarea[name="message"]');
  
  if (chatInput) {
    // Set the transcribed text in the input field
    chatInput.value = trimmedCommand;
    
    // If the chat has a form, you might want to submit it automatically
    const chatForm = document.getElementById('chat-form') ||
                    document.querySelector('form');
    
    // Focus the input field so the user can edit it if needed
    chatInput.focus();
    
    // Show a notification that the text was transcribed
    showSuccessMessage('Voice transcribed successfully! You can edit or send it now.');
  } else {
    console.error('Could not find chat input field');
    showRecognitionError('Could not find chat input field to place transcribed text');
  }
  
  // Stop recording after successful transcription
  stopRecording();
}

// Toggle recording state
function toggleVoiceRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Add DOM elements needed for voice recording UI if they don't exist
function setupVoiceUI() {
  // Check if recording indicator exists, create if not
  if (!document.getElementById('recording-indicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'recording-indicator';
    indicator.textContent = 'Recording...';
    indicator.style.display = 'none';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '80px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.background = 'rgba(255, 0, 0, 0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '1000';
    document.body.appendChild(indicator);
  }
  
  // Check if error message element exists, create if not
  if (!document.getElementById('voice-error-message')) {
    const errorElement = document.createElement('div');
    errorElement.id = 'voice-error-message';
    errorElement.style.display = 'none';
    errorElement.style.position = 'fixed';
    errorElement.style.bottom = '120px';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translateX(-50%)';
    errorElement.style.background = 'rgba(220, 53, 69, 0.9)';
    errorElement.style.color = 'white';
    errorElement.style.padding = '10px 15px';
    errorElement.style.borderRadius = '5px';
    errorElement.style.maxWidth = '80%';
    errorElement.style.textAlign = 'center';
    errorElement.style.zIndex = '1000';
    document.body.appendChild(errorElement);
  }
  
  // Check if success message element exists, create if not
  if (!document.getElementById('voice-success-message')) {
    const successElement = document.createElement('div');
    successElement.id = 'voice-success-message';
    successElement.style.display = 'none';
    successElement.style.position = 'fixed';
    successElement.style.bottom = '120px';
    successElement.style.left = '50%';
    successElement.style.transform = 'translateX(-50%)';
    successElement.style.background = 'rgba(40, 167, 69, 0.9)';
    successElement.style.color = 'white';
    successElement.style.padding = '10px 15px';
    successElement.style.borderRadius = '5px';
    successElement.style.maxWidth = '80%';
    successElement.style.textAlign = 'center';
    successElement.style.zIndex = '1000';
    document.body.appendChild(successElement);
  }
}

// Create recognition object
function createRecognitionObject() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionObj = new SpeechRecognition();
  
  recognitionObj.continuous = false;
  recognitionObj.interimResults = true;
  recognitionObj.lang = 'en-US';
  recognitionObj.maxAlternatives = 1;
  
  return recognitionObj;
}

// Set up event handlers for recognition
function setupRecognitionHandlers() {
  if (!recognition) return;
  
  let finalTranscript = '';
  let interimTranscript = '';
  
  recognition.onstart = function() {
    console.log('Recognition started');
    isRecording = true;
    
    // Set up recording timeout (stop after 30 seconds of silence)
    recordingTimeout = setTimeout(() => {
      if (isRecording) {
        console.log('Recording timed out due to silence');
        stopRecording();
      }
    }, 30000); // 30 seconds timeout
  };
  
  recognition.onresult = function(event) {
    // Reset timeout on each result
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    
    // Reset timeout for silence
    recordingTimeout = setTimeout(() => {
      if (isRecording) {
        console.log('Recording stopped due to silence');
        stopRecording();
      }
    }, 5000); // 5 seconds of silence
    
    interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    // Update UI with transcription
    const transcriptionElement = document.getElementById('transcription') || 
                               document.getElementById('voiceText') || 
                               document.querySelector('.voice-text');
    if (transcriptionElement) {
      transcriptionElement.innerHTML = finalTranscript + '<i style="color:#999">' + interimTranscript + '</i>';
    }
    
    // Update status
    const statusElement = document.getElementById('mic-status') || 
                         document.getElementById('voiceStatus') || 
                         document.querySelector('.voice-status');
    if (statusElement) {
      statusElement.textContent = "Listening...";
    }
  };
  
  recognition.onerror = function(event) {
    console.error('Recognition error:', event.error);
    handleRecognitionError({
      name: event.error,
      message: `Voice recognition error: ${event.error}`
    });
  };
  
  recognition.onend = function() {
    console.log('Recognition ended');
    
    // Process final result and send to server if needed
    const transcriptionElement = document.getElementById('transcription') || 
                               document.getElementById('voiceText') || 
                               document.querySelector('.voice-text');
    if (transcriptionElement && finalTranscript) {
      sendVoiceInput(finalTranscript);
    }
    
    // Stop recording
    if (isRecording) {
      stopRecording();
    }
  };
}

// Function to send voice input to server
function sendVoiceInput(text) {
  if (!text || text.trim() === '') return;
  
  console.log('Sending voice input:', text);
  
  // Find the appropriate elements for sending the input
  const chatInput = document.getElementById('chat-input') || 
                   document.getElementById('userInput') || 
                   document.querySelector('input[type="text"]');
  
  const sendButton = document.getElementById('send-button') || 
                    document.getElementById('sendButton') || 
                    document.querySelector('button[type="submit"]');
  
  // Update input field with transcribed text
  if (chatInput) {
    chatInput.value = text;
  }
  
  // Click send button to submit the form
  if (sendButton) {
    sendButton.click();
  } else if (chatInput) {
    // If no button found, try to submit the form
    const form = chatInput.closest('form');
    if (form) {
      form.submit();
    }
  }
}

// Function to check if microphone exists without requiring permissions
function checkMicrophoneExists() {
  return new Promise((resolve, reject) => {
    // First try to enumerate devices without requesting permissions
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        // Look for audio input devices
        const hasAudioInputs = devices.some(device => device.kind === 'audioinput');
        if (hasAudioInputs) {
          // Found at least one audio input device
          console.log('Audio input device detected');
          resolve(true);
        } else {
          // No audio input device with label, but this could be due to permissions
          // This doesn't mean there's no microphone, just that we can't see it without permission
          console.log('No labeled audio input devices found, might need permission');
          resolve(null); // Return null to indicate we need explicit permission to confirm
        }
      })
      .catch(error => {
        console.error('Error enumerating devices:', error);
        reject(error);
      });
  });
}

// Function to check browser and API support
function checkVoiceRecognitionSupport() {
  // Check browser support for speech recognition
  const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  
  // Check for getUserMedia support (needed for microphone access)
  const hasGetUserMedia = navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices;
  
  // Return results
  return {
    supported: hasSpeechRecognition && hasGetUserMedia,
    speechRecognition: hasSpeechRecognition,
    getUserMedia: hasGetUserMedia
  };
}

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    startRecording,
    stopRecording,
    checkVoiceRecognitionSupport,
    checkMicrophoneExists
  };
}

// Function to integrate the browser's speech recognition with the chat UI
function setupVoiceRecognition() {
  // Check if Speech Recognition is supported
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech Recognition API is not supported in this browser');
    return;
  }

  // Get DOM elements from the chat interface
  const chatInput = document.getElementById('chat-input');
  const voiceInputButton = document.getElementById('voice-input-button');
  const recordingIndicator = document.getElementById('recording-indicator');
  const attachmentsContainer = document.getElementById('attachments-container');
  
  if (!chatInput || !voiceInputButton || !recordingIndicator) {
    console.error('Required DOM elements for voice recognition not found');
    return;
  }
  
  // Initialize variables
  let recognition = null;
  let isRecording = false;
  
  // Initialize speech recognition
  function initRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    // Handle recognition results
    recognition.onresult = function(event) {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results while speaking
      if (interimTranscript) {
        chatInput.value = 'Heard: ' + interimTranscript;
      }
      
      // Update input with final transcript
      if (finalTranscript) {
        chatInput.value = finalTranscript.trim();
        // Enable the send button if we have text
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
          sendButton.disabled = false;
        }
      }
    };
    
    // Handle recognition errors
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      stopRecording();
      
      // Show error message based on error type
      let errorMessage = '';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was detected. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Recognition was aborted.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }
      
      // Add system message to chat
      if (typeof addMessage === 'function') {
        addMessage(errorMessage, 'system');
      } else {
        // Fallback if addMessage isn't available
        chatInput.value = errorMessage;
      }
    };
    
    // Handle recognition end
    recognition.onend = function() {
      console.log('Speech recognition ended');
      stopRecording();
    };
  }
  
  // Start recording function
  function startRecording() {
    try {
      if (!recognition) {
        initRecognition();
      }
      
      // Update UI to show recording state
      isRecording = true;
      voiceInputButton.style.color = '#e53e3e';
      recordingIndicator.style.display = 'flex';
      chatInput.placeholder = 'Listening...';
      
      // Start the recognition
      recognition.start();
      console.log('Speech recognition started');
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      stopRecording();
      
      // Show error message
      if (typeof addMessage === 'function') {
        addMessage('Error starting voice recognition: ' + error.message, 'system');
      } else {
        chatInput.value = 'Error starting voice recognition: ' + error.message;
      }
    }
  }
  
  // Stop recording function
  function stopRecording() {
    isRecording = false;
    voiceInputButton.style.color = '';
    recordingIndicator.style.display = 'none';
    chatInput.placeholder = 'Type your message...';
    
    try {
      if (recognition) {
        recognition.stop();
        console.log('Speech recognition stopped');
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }
  
  // Toggle recording state
  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
  
  // Add click event listener to the voice button
  voiceInputButton.addEventListener('click', function(e) {
    e.preventDefault();
    toggleRecording();
  });
  
  // Initialize the recognition on page load
  initRecognition();
  
  // Check for microphone permissions
  navigator.permissions.query({ name: 'microphone' })
    .then(permissionStatus => {
      console.log('Microphone permission status:', permissionStatus.state);
      
      // Listen for changes in permission
      permissionStatus.onchange = function() {
        console.log('Microphone permission changed to:', this.state);
      };
    })
    .catch(error => {
      console.error('Error checking microphone permission:', error);
    });
    
  // Return public methods
  return {
    start: startRecording,
    stop: stopRecording,
    toggle: toggleRecording
  };
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
  const voiceRecognition = setupVoiceRecognition();
  
  // Make it available globally
  window.voiceRecognition = voiceRecognition;
}); 