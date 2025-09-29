// --- Configuration and Constants ---
// Pattern to identify TTML subtitle files. These files contain '?o=' in their query string.
const TTML_URL_PATTERN = "*://*.netflix.com/*ttml?o=*"
const STATUS_KEY = "downloadStatus"; // Key for chrome.storage.local

/**
 * Updates the current status message in local storage.
 * This message is read by the popup to inform the user.
 * @param {string} statusMessage - The message to display.
 */
function updateStatus(statusMessage) {
    chrome.storage.local.set({ [STATUS_KEY]: statusMessage });
}

/**
 * Handler for completed network requests.
 * @param {object} details - Details of the web request.
 */
function handleRequestCompletion(details) {
    const url = details.url;

    // 1. Check if the URL matches the TTML subtitle pattern
    if (url.includes('ttml?o=')) {
        
        // 2. Stop listening immediately to prevent multiple downloads
        chrome.webRequest.onCompleted.removeListener(handleRequestCompletion);
        
        // 3. Inform the user what we found
        updateStatus("Subtitle file found! Initiating download...");

        // 4. Extract the filename from the URL path for better organization
        let filename = 'netflix_subtitle.ttml';
        try {
            // Attempt to create a more descriptive filename from the URL structure
            const urlPath = new URL(url).pathname;
            const pathSegments = urlPath.split('/');
            // The file ID is often the second-to-last segment (e.g., /language/id/filename)
            if (pathSegments.length >= 2) {
                // Use the media ID (or a segment of the path) as the filename prefix
                filename = `${pathSegments[pathSegments.length - 2]}_subtitle.ttml`;
            }
        } catch (e) {
            console.error("Could not parse URL for filename:", e);
            // Fallback to default filename
        }


        // 5. Trigger the download using the chrome.downloads API
        chrome.downloads.download({
            url: url,
            filename: filename, // Save the file with the generated name
            conflictAction: 'uniquify' // Add a number if a file with this name already exists
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                // Download failed (e.g., due to temporary network issues)
                updateStatus(`Download Failed: ${chrome.runtime.lastError.message}.`);
                // Re-enable the listener in case of failure so the user can try again
                setupListener();
            } else {
                // Download successfully started
                updateStatus(`Download started: "${filename}". Status: READY.`);
                // Listener remains disabled until the user clicks the popup button again
            }
        });
    }
}

/**
 * Sets up the webRequest listener to start monitoring for TTML files.
 */
function setupListener() {
    // Ensure we don't accidentally add the listener twice
    if (!chrome.webRequest.onCompleted.hasListener(handleRequestCompletion)) {
        updateStatus("Monitoring network requests on Netflix. Start playing a show now...");
        chrome.webRequest.onCompleted.addListener(
            handleRequestCompletion,
            { urls: [TTML_URL_PATTERN] }
            // Filter: only listen for requests that look like TTML subtitle files
        );
    } else {
        updateStatus("Monitoring is already active. Start playing a show!");
    }
}

// --- Initialization ---

// When the extension is installed or updated, set the initial status.
chrome.runtime.onInstalled.addListener(() => {
    updateStatus("Ready. Click 'Start Monitoring' to begin.");
});

// Listener for messages from the popup (i.e., when the user clicks the button).
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
