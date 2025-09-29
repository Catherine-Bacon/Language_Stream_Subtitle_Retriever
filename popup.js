// File: popup.js

const STATUS_KEY = "downloadStatus";
const statusElement = document.getElementById('status');
const startButton = document.getElementById('startButton');

/**
 * Updates the text and appearance of the status box.
 * @param {string} message - The status text to display.
 * @param {string} className - The class name (e.g., 'monitoring', 'ready') for styling.
 */
function updateUI(message, className) {
    statusElement.textContent = message;
    statusElement.className = 'p-3 mb-4 rounded-lg text-center font-medium min-h-[40px] flex items-center justify-center text-sm shadow-md ' + (className || '');
}

/**
 * Requests the current status from the background service worker.
 */
function refreshStatus() {
    // Check if background script is available (e.g., after an update)
    if (!chrome.runtime.lastError) {
        chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
            if (chrome.runtime.lastError) {
                // This happens if the service worker is temporarily inactive
                updateUI("Service worker is starting up...", '');
                return;
            }
            const statusMessage = response.status;
            let statusClass = '';

            if (statusMessage.includes("Monitoring")) {
                statusClass = 'monitoring';
            } else if (statusMessage.includes("Ready")) {
                statusClass = 'ready';
            }
            // For download failed/found/started, no specific class needed yet, or could add one
            
            updateUI(statusMessage, statusClass);
        });
    }
}

/**
 * Event listener for the "Start Monitoring" button.
 */
function handleStartClick() {
    startButton.disabled = true;
    updateUI("Sending start command to background...", 'monitoring');
    
    // Send a message to background.js to start the webRequest listener
    chrome.runtime.sendMessage({ action: "startMonitoring" }, (response) => {
        if (chrome.runtime.lastError) {
             updateUI("Error connecting to background script. Try refreshing Netflix page.", '');
             startButton.disabled = false;
             return;
        }
        // The background script will update the status, so we just wait for it.
        // We re-enable the button later if monitoring is paused or download completes.
        refreshStatus();
    });
}

// --- Initialization ---

// 1. Attach the click handler
startButton.addEventListener('click', handleStartClick);

// 2. Refresh status when the popup opens
refreshStatus();

// 3. Set up a listener for storage changes to instantly update the popup status
chrome.storage.local.onChanged.addListener((changes) => {
    if (changes[STATUS_KEY]) {
        refreshStatus();
        
        // Re-enable the button if monitoring is READY after a download completes
        if (changes[STATUS_KEY].newValue.includes("Status: READY")) {
            startButton.disabled = false;
        }
    }
});