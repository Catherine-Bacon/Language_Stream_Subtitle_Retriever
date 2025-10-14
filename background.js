// File: background.js

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "INSPECTED_DATA") {
        console.log("--- Intercepted JSON Data Packet ---", request.payload);
    } else if (request.type === "INSPECTED_METADATA") {
        console.log("--- Intercepted Metadata Packet ---", request.payload);
    }
    return true; // Keep the message channel open for asynchronous responses if needed
});

// A simple listener to let the popup know the inspector is active
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getStatus") {
        sendResponse({ status: "Inspector is active. Check the service worker console for data." });
    }
});

console.log("Netflix Inspector background script loaded and listening.");