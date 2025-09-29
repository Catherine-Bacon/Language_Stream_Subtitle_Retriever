const TTML_URL_PATTERN = "*://*.netflix.com/*ttml?o=*"
const STATUS_KEY = "downloadStatus"; // Key for chrome.storage.local

/**
 * Updates the current status message in local storage, which the popup reads.
 * @param {string} statusMessage - The message to display.
 */
function updateStatus(statusMessage) {
    chrome.storage.local.set({ [STATUS_KEY]: statusMessage });
}

/**
 * Handler for completed network requests.
 * Triggers the download when a subtitle URL is detected.
 * @param {object} details - Details of the web request.
 */
function handleRequestCompletion(details) {
    const url = details.url;

    // 1. Check if the URL matches the TTML subtitle pattern
    if (url.includes('ttml?o=')) {
        
        // 2. Stop listening immediately to prevent multiple downloads
        chrome.webRequest.onCompleted.removeListener(handleRequestCompletion);
        
        // 3. Inform the user what was found
        updateStatus("Subtitle file found! Initiating download...");

        // 4. Create a descriptive filename based on the URL path
        let filename = 'netflix_subtitle.ttml';
        try {
            const urlPath = new URL(url).pathname;
            const pathSegments = urlPath.split('/');
            // Use the media ID (or a segment of the path) as the filename prefix
            if (pathSegments.length >= 2) {
                // Example: /title_id/language_code/media_id.ttml?o=... 
                filename = `${pathSegments[pathSegments.length - 2]}_subtitle.ttml`;
            }
        } catch (e) {
            console.error("Could not parse URL for filename:", e);
        }

        // 5. Trigger the download using the chrome.downloads API
        chrome.downloads.download({
            url: url,
            filename: `Subtitles/${filename}`, // Stores the file in a 'Subtitles' folder
            conflictAction: 'uniquify'
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                updateStatus(`Download Failed: ${chrome.runtime.lastError.message}. Click 'Start Monitoring' to retry.`);
            } else {
                updateStatus(`Download started: "${filename}". Status: READY.`);
            }
            // Re-enable the listener setup to allow re-running the tool
            setupListener(); 
        });
    }
}

/**
 * Sets up the webRequest listener to start monitoring for TTML files.
 */
function setupListener() {
    if (!chrome.webRequest.onCompleted.hasListener(handleRequestCompletion)) {
        updateStatus("Monitoring network requests on Netflix. Start playing a show now...");
        
        // Add listener, targeting only the required pattern
        chrome.webRequest.onCompleted.addListener(
            handleRequestCompletion,
            { urls: [TTML_URL_PATTERN] }
        );
    } else {
        updateStatus("Monitoring is already active. Start playing a show!");
    }
}

// --- Initialization and Popup Communication ---

// Set initial status on extension install/update
chrome.runtime.onInstalled.addListener(() => {
    updateStatus("Ready. Click 'Start Monitoring' to begin.");
});

// Listener for messages from the popup (when the user clicks the button).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startMonitoring") {
        setupListener();
        sendResponse({ success: true, message: "Monitoring initiated." });
    }
    // Handle status refresh requests from the popup
    if (request.action === "getStatus") {
        chrome.storage.local.get(STATUS_KEY, (data) => {
            sendResponse({ status: data[STATUS_KEY] || "Ready. Click 'Start Monitoring' to begin." });
        });
        return true; // Indicates an asynchronous response
    }
});
