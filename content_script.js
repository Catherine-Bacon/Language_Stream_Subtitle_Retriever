// File: content_script.js

console.log("[Netflix Inspector] Content script running in MAIN world.");

// --- Hijack JSON.parse ---
const originalParse = JSON.parse;
JSON.parse = function (text) {
  // This log should now appear in the Netflix Page Console (F12)
  console.log("[Netflix Inspector] JSON.parse hijacked. Parsing text...");
  
  const data = originalParse(text);

  // Make the condition less strict to catch more potential data packets
  if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.log("[Netflix Inspector] Intercepted a potential data object:", data);
      
      // We can't use chrome.runtime.sendMessage from the MAIN world.
      // Instead, we use a Custom Event to send data to our isolated content script.
      // But for simple logging, we'll rely on the page console for now.
  }

  return data;
};

// --- Hijack fetch ---
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0] instanceof Request ? args[0].url : args[0];
  
  // This log should now also appear in the Netflix Page Console (F12)
  console.log(`[Netflix Inspector] fetch hijacked. URL: ${url}`);
  
  if (typeof url === 'string' && url.includes('/metadata?')) {
    console.log("[Netflix Inspector] Metadata request found!");
    // We can inspect the response here if needed
  }
  return originalFetch(...args);
};

console.log("[Netflix Inspector] Hijacking of JSON.parse and fetch is complete.");