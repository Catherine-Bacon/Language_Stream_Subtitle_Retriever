// File: popup.js

document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    
    chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
        if (chrome.runtime.lastError) {
            statusElement.textContent = "Error. Please reload the extension and the Netflix page.";
            statusElement.className = '';
        } else {
            statusElement.textContent = response.status;
            statusElement.className = 'ready'; // Use 'ready' style
        }
    });
});