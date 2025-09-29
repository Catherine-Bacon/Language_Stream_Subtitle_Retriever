<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subtitle Downloader</title>
    <!-- Load Tailwind CSS for styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            width: 300px;
            font-family: 'Inter', sans-serif;
            background-color: #141414; /* Netflix dark background */
        }
        .text-netflix-red {
            color: #e50914;
        }
        .btn-netflix {
            background-color: #e50914;
            transition: background-color 0.15s ease-in-out;
        }
        .btn-netflix:hover {
            background-color: #b20707;
        }
    </style>
</head>
<body class="p-4 text-white">

    <h1 class="text-2xl font-bold mb-3 text-center text-netflix-red">TTML Subtitle</h1>

    <div id="status" class="p-3 mb-4 rounded-lg text-center font-medium bg-gray-800 text-gray-300 min-h-[40px] flex items-center justify-center text-sm shadow-md">
        Loading status...
    </div>

    <button id="startButton" class="w-full btn-netflix text-white font-semibold py-2 px-4 rounded-lg shadow-lg">
        Start Monitoring
    </button>
    
    <p class="text-xs text-gray-500 mt-4 text-center">
        Ensure you are on a Netflix show page before starting.
    </p>


    <script>
        const startButton = document.getElementById('startButton');
        const statusElement = document.getElementById('status');

        /**
         * Sends a message to the background service worker to fetch the current status.
         */
        function updateStatusDisplay() {
            chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
                if (response && response.status) {
                    statusElement.textContent = response.status;
                    
                    // Simple logic to change color based on content
                    if (response.status.includes('Monitoring')) {
                        statusElement.classList.add('bg-blue-900', 'text-blue-200');
                        statusElement.classList.remove('bg-gray-800', 'text-gray-300', 'bg-green-900', 'text-green-200');
                        startButton.disabled = true;
                        startButton.textContent = "Monitoring Active (Play Video)";
                    } else if (response.status.includes('Download started') || response.status.includes('found')) {
                        statusElement.classList.add('bg-green-900', 'text-green-200');
                        statusElement.classList.remove('bg-gray-800', 'text-gray-300', 'bg-blue-900', 'text-blue-200');
                        startButton.disabled = false;
                        startButton.textContent = "Restart Monitoring";
                    } else {
                         // Default / Ready state
                        statusElement.classList.remove('bg-blue-900', 'text-blue-200', 'bg-green-900', 'text-green-200');
                        statusElement.classList.add('bg-gray-800', 'text-gray-300');
                        startButton.disabled = false;
                        startButton.textContent = "Start Monitoring";
                    }

                } else {
                    statusElement.textContent = "Error: Could not retrieve status.";
                }
            });
        }

        // On button click, tell the background script to start monitoring
        startButton.addEventListener('click', () => {
            // Check if we are on a Netflix page (best practice)
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const url = tabs[0].url;
                if (!url.includes('netflix.com')) {
                    statusElement.textContent = "Error: Please navigate to a Netflix page first.";
                    return;
                }

                chrome.runtime.sendMessage({ action: "startMonitoring" }, (response) => {
                    if (response.success) {
                        // Once monitoring is started, update the UI
                        updateStatusDisplay();
                    } else {
                        statusElement.textContent = `Error: ${response.message || "Failed to start monitoring."}`;
                    }
                });
            });
        });

        // Update the status display when the popup is opened
        updateStatusDisplay();

        // Optional: Set up an interval to refresh status if the user keeps the popup open
        setInterval(updateStatusDisplay, 1500);

    </script>
</body>
</html>
