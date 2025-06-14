"use strict";
var CookOffBattle;
(function (CookOffBattle) {
    // Global API base URL with fallback if MealWhizConfig is not defined
    const apiBase = (typeof MealWhizConfig !== 'undefined' ?
        MealWhizConfig.apiBaseURL :
        'https://mealhwiz.at:3000');
    // URL of the Jitsi server.
    const JITSI_SERVER_URL = (typeof MealWhizConfig !== 'undefined' ?
        MealWhizConfig.jitsiServerURL :
        'https://meet.mealwhiz.at');
    // Represents the current logged-in user.
    // User ID should ideally be dynamically set based on authentication.
    // User name is retrieved from localStorage or defaults to "MyUsername".
    const currentUser = {
        id: 1,
        name: localStorage.getItem("userName") || "MyUsername",
        avatar: "../assets/img/avatar.jpg", // Default avatar image.
    };
    // Holds the opponent user's information, initially null.
    let opponentUser = null;
    // Holds the Jitsi Meet API instance.
    let jitsiApi = null;
    // Flag to track if the user has joined the video conference.
    let isVideoConferenceJoined = false;
    // Stores details of the current event fetched from the API.
    let currentEventDetails = null;
    // Main execution block after the DOM is fully loaded.
    document.addEventListener("DOMContentLoaded", async () => {
        // Retrieve battle settings from URL parameters.
        const settings = getBattleSettings();
        console.log("Battle Page Loaded. Settings:", settings);
        // Update currentUser name if username is provided in URL
        if (settings.username) {
            currentUser.name = settings.username;
        }
        // Initialize basic page UI elements based on settings.
        initializePageUI(settings);
        // Check if essential parameters for Jitsi are present.
        if (!settings.eventId || !settings.streamUrl) {
            showErrorInPlaceholder("Event ID or Stream URL is missing. Video conference cannot be started.");
            return;
        }
        try {
            // Fetch details of the current event.
            currentEventDetails = await fetchEventDetails(settings.eventId);
            // Set up the battle-specific UI elements (casual vs. competitive).
            setupBattleUI(settings, currentEventDetails); // Initialize and join the Jitsi video conference.
            // Use username from URL if available, otherwise fallback to currentUser.name
            const displayName = settings.username || currentUser.name;
            initializeJitsi(settings, displayName);
        }
        catch (error) {
            console.error("Error during page setup:", error);
            showErrorInPlaceholder("Error loading session data. Video conference cannot be started.");
        }
        // Set up chat functionality.
        setupChatFunctionality(settings.eventId);
        // Set up common event listeners (e.g., exit button).
        setupCommonEventListeners();
    });
    // Parses URL parameters to get battle settings.
    function getBattleSettings() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = (urlParams.get("mode") === "casual" ? "casual" : "competitive");
        return {
            mode: mode,
            eventId: urlParams.get("eventId"),
            streamUrl: urlParams.get("streamUrl"),
            username: urlParams.get("username") ? decodeURIComponent(urlParams.get("username")) : undefined,
            role: urlParams.get("role"),
            // Decode URI components for challenge type and difficulty as they might contain special characters.
            challengeType: urlParams.get("challengeType") ? decodeURIComponent(urlParams.get("challengeType")) : undefined,
            difficulty: urlParams.get("difficulty") ? decodeURIComponent(urlParams.get("difficulty")) : undefined,
            // Time limit is relevant for competitive mode, defaults to 30 minutes if not specified.
            timeLimit: mode === "competitive" ? parseInt(urlParams.get("time") || "30", 10) : undefined,
        };
    }
    // Initializes general UI elements of the page.
    function initializePageUI(settings) {
        // Add a class to the body to style based on mode (casual/competitive).
        document.body.classList.add(`${settings.mode}-mode`);
        const battleHeader = document.getElementById("battleHeader");
        if (battleHeader) {
            // Set the header text based on the mode.
            battleHeader.textContent = settings.mode === "casual" ? "Casual Cooking Session" : "Competitive Cook-Off";
        }
        // Set the page title.
        document.title = `MealWhiz - ${battleHeader?.textContent || "CookOff Battle"}`;
        const jitsiMeetPlaceholder = document.getElementById("jitsiMeetPlaceholder");
        // Check if the Jitsi container element exists in the HTML.
        if (!document.getElementById("jitsiMeetContainer") && jitsiMeetPlaceholder) {
            jitsiMeetPlaceholder.innerHTML =
                '<p class="text-danger text-center p-3">Jitsi video container (jitsiMeetContainer) not found in HTML.</p>';
            jitsiMeetPlaceholder.style.display = "flex";
        }
    }
    // Displays an error message in the Jitsi placeholder area.
    function showErrorInPlaceholder(message) {
        const placeholder = document.getElementById("jitsiMeetPlaceholder");
        if (placeholder) {
            placeholder.innerHTML = `<p class="text-danger text-center p-3">${message}</p>`;
            placeholder.style.display = "flex"; // Make the placeholder visible.
        }
        // Hide the actual Jitsi container if an error occurs.
        const jitsiMeetContainer = document.getElementById("jitsiMeetContainer");
        if (jitsiMeetContainer)
            jitsiMeetContainer.style.display = "none";
    }
    // Sets up UI elements specific to the battle mode (casual or competitive).
    function setupBattleUI(settings, eventDetails) {
        const { mode } = settings;
        // Get references to various UI elements.
        const battleModeTitle = document.getElementById("battleModeTitle");
        const contextualInfoHeader = document.getElementById("contextualInfoHeader");
        const casualContextDiv = document.getElementById("casualContext"); // UI for casual mode.
        const competitiveContextDiv = document.getElementById("competitiveContext"); // UI for competitive mode.
        const chatSuggestionPills = document.getElementById("chatSuggestionPills"); // Quick chat suggestions.
        // Ensure all required UI elements are present.
        if (!battleModeTitle ||
            !contextualInfoHeader ||
            !casualContextDiv ||
            !competitiveContextDiv ||
            !chatSuggestionPills) {
            console.error("One or more UI elements for battle setup are missing.");
            showErrorInPlaceholder("Important UI elements are missing, the meeting cannot be set up.");
            return;
        }
        if (mode === "casual") {
            // Configure UI for casual mode.
            battleModeTitle.textContent = "Casual CookOff";
            contextualInfoHeader.textContent = "Casual Cooking Details";
            casualContextDiv.classList.remove("d-none"); // Show casual context.
            competitiveContextDiv.classList.add("d-none"); // Hide competitive context.
            chatSuggestionPills.classList.remove("d-none"); // Show chat suggestions.
            setupSuggestionPills(); // Populate suggestion pills.
            updateOpponentDisplayInUI(opponentUser, "casual"); // Update partner display.
        }
        else {
            // Configure UI for competitive mode.
            battleModeTitle.textContent = "Competitive CookOff Challenge";
            contextualInfoHeader.textContent = "Challenge Details";
            competitiveContextDiv.classList.remove("d-none"); // Show competitive context.
            casualContextDiv.classList.add("d-none"); // Hide casual context.
            chatSuggestionPills.classList.add("d-none"); // Hide chat suggestions.
            updateCompetitionDetailsInUI(eventDetails, settings.timeLimit); // Display challenge details.
            updateOpponentDisplayInUI(opponentUser, "competitive"); // Update opponent display.
            if (settings.timeLimit) {
                startCookingTimer(settings.timeLimit); // Start the countdown timer.
            }
        }
    }
    // Initializes the Jitsi Meet video conference.
    function initializeJitsi(settings, userName) {
        const jitsiMeetContainer = document.getElementById("jitsiMeetContainer"); // Where Jitsi will be embedded.
        const jitsiMeetPlaceholder = document.getElementById("jitsiMeetPlaceholder"); // Placeholder shown during loading.
        if (!jitsiMeetContainer || !jitsiMeetPlaceholder) {
            console.error("Jitsi container or placeholder not found for initialization.");
            return;
        }
        // Show a loading spinner in the placeholder.
        jitsiMeetPlaceholder.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="fs-5">Establishing connection...</p>
            </div>`;
        jitsiMeetPlaceholder.style.display = "flex";
        jitsiMeetPlaceholder.style.zIndex = "10"; // Ensure placeholder is on top.
        let roomNameForJitsi = "";
        try {
            // Extract the room name from the provided stream URL.
            const url = new URL(settings.streamUrl);
            roomNameForJitsi = url.pathname.substring(1); // Remove leading slash.
        }
        catch (e) {
            console.error("Error parsing streamUrl to get room name:", settings.streamUrl, e);
            showErrorInPlaceholder("Error: Invalid video conference URL format.");
            return;
        }
        if (!roomNameForJitsi) {
            showErrorInPlaceholder("Error: The video conference room name is missing from the URL.");
            return;
        }
        // If Jitsi API was previously initialized, dispose of it first.
        if (jitsiApi) {
            console.log("Jitsi API already initialized. Disposing before re-initializing.");
            jitsiApi.dispose();
            jitsiApi = null;
        }
        console.log(`Initializing Jitsi Meet with room: "${roomNameForJitsi}", user: "${userName}", role: "${settings.role || "competitor"}"`);
        // Call the function to create and configure the Jitsi Meet External API instance.
        jitsiApi = initJitsiMeetExternalAPI(roomNameForJitsi, userName, "jitsiMeetContainer", settings);
        if (!jitsiApi) {
            showErrorInPlaceholder("Error initializing video conference. Please try again later.");
        }
    }
    // Creates and configures the Jitsi Meet External API.
    function initJitsiMeetExternalAPI(roomName, displayName, parentElementId, settings) {
        const parentElement = document.getElementById(parentElementId); // The HTML element to host Jitsi.
        const placeholderElement = document.getElementById("jitsiMeetPlaceholder");
        if (!parentElement) {
            console.error(`Jitsi parent element '${parentElementId}' not found.`);
            if (placeholderElement) {
                placeholderElement.innerHTML =
                    '<p class="text-danger text-center p-3">Error: Video chat container not found.</p>';
                placeholderElement.style.display = "flex";
            }
            return null;
        }
        // Configure the placeholder to show loading state.
        configureJitsiPlaceholder(placeholderElement, true);
        parentElement.style.display = "block"; // Make the Jitsi container visible.
        const jitsiDomain = new URL(JITSI_SERVER_URL).hostname; // Extract domain from Jitsi server URL.
        // Check if user is a viewer in competitive mode
        const isViewer = settings?.mode === "competitive" && settings?.role === "viewer"; // Base configuration for all users - optimized for cooking competitions
        let configOverwrite = {
            prejoinPageEnabled: false,
            requireDisplayName: true,
            disableDeepLinking: true,
            // Optimize for cooking competition environment
            enableNoisyMicDetection: true,
            enableTalkWhileMuted: false,
            disableThirdPartyRequests: true,
            // Disable unnecessary features
            disableProfile: false,
            enableWelcomePage: false,
        };
        // Base interface configuration - cleaner for cooking focus
        let interfaceConfigOverwrite = {
            SHOW_CHROME_EXTENSION_BANNER: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            SETTINGS_SECTIONS: ["devices", "language"],
            // Hide promotional elements
            SHOW_BRAND_WATERMARK: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_POWERED_BY: false,
            HIDE_DEEP_LINKING_LOGO: true,
            INITIAL_TOOLBAR_TIMEOUT: 5000,
            TOOLBAR_TIMEOUT: 8000,
        };
        if (isViewer) {
            // Viewers in competitive mode: invisible spectator configuration
            configOverwrite = {
                ...configOverwrite,
                startWithAudioMuted: true,
                startWithVideoMuted: true,
                disableProfile: true,
                readOnlyName: true,
                // Make viewers truly invisible/silent
                startSilent: true,
                disableInitialGUM: true,
                disableAudioLevels: true,
                enableLayerSuspension: true,
                // Additional invisible participant settings
                defaultRemoteDisplayName: "Competitor",
                hideDisplayName: true,
                // Disable chat for viewers
                disableChat: true,
            };
            interfaceConfigOverwrite = {
                ...interfaceConfigOverwrite,
                // Ultra-minimal interface for invisible spectators - only essential viewer controls
                TOOLBAR_BUTTONS: ["settings", "fullscreen"],
                // Hide as much UI as possible for spectators
                DISABLE_VIDEO_BACKGROUND: true,
                DISABLE_FOCUS_INDICATOR: true,
                FILM_STRIP_MAX_HEIGHT: 0,
                DISABLE_PRESENCE_STATUS: true,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                // Minimal toolbar for viewers
                TOOLBAR_ALWAYS_VISIBLE: false,
                INITIAL_TOOLBAR_TIMEOUT: 2000,
                // Disable chat interface
                DISABLE_CHAT: true,
            };
        }
        else {
            // Competitors or casual mode users: essential cooking competition functionality
            interfaceConfigOverwrite = {
                ...interfaceConfigOverwrite,
                // Only essential buttons for cooking competitions
                TOOLBAR_BUTTONS: ["microphone", "camera", "chat", "fullscreen", "hangup", "settings"],
                // Hide unnecessary branding and promotional elements
                SHOW_BRAND_WATERMARK: false,
                SHOW_JITSI_WATERMARK: false,
                SHOW_POWERED_BY: false,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                HIDE_DEEP_LINKING_LOGO: true,
                // Disable less relevant features for cooking competitions
                DISABLE_VIDEO_BACKGROUND: false,
                DISABLE_FOCUS_INDICATOR: true,
                HIDE_INVITE_MORE_HEADER: true,
            };
        }
        // Jitsi Meet API options.
        const options = {
            roomName: roomName,
            width: "100%",
            height: "100%",
            parentNode: parentElement,
            userInfo: {
                displayName: displayName, // Keep original name, viewers will be hidden anyway
            },
            configOverwrite,
            interfaceConfigOverwrite,
            // jwt: 'YOUR_JWT_TOKEN_IF_USING_SECURE_DOMAIN' // Add JWT if using a secured Jitsi setup.
        };
        try {
            // Instantiate the Jitsi Meet External API.
            const api = new JitsiMeetExternalAPI(jitsiDomain, options);
            isVideoConferenceJoined = false; // Reset joined flag.
            // Apply additional restrictions for viewers after API initialization
            if (isViewer) {
                setupViewerRestrictions(api);
            }
            attachJitsiEventListeners(api); // Attach event listeners to the Jitsi API instance.
            return api;
        }
        catch (error) {
            console.error("Error initializing Jitsi Meet API:", error);
            if (parentElement)
                parentElement.style.display = "none"; // Hide Jitsi container on error.
            if (placeholderElement) {
                // Show critical error message.
                placeholderElement.innerHTML =
                    '<p class="text-danger text-center p-3">Critical error with video conference. Try again later.</p>';
                placeholderElement.style.display = "flex";
            }
            return null;
        }
    }
    // Configures the style and visibility of the Jitsi placeholder.
    function configureJitsiPlaceholder(placeholder, isLoading) {
        if (!placeholder)
            return;
        // Style to overlay the placeholder on top of the Jitsi container.
        placeholder.style.position = "absolute";
        placeholder.style.top = "0";
        placeholder.style.left = "0";
        placeholder.style.right = "0";
        placeholder.style.bottom = "0";
        placeholder.style.zIndex = "10";
        placeholder.style.display = isLoading ? "flex" : "none"; // Show if loading, hide otherwise.
    }
    // Attaches event listeners to the Jitsi API instance.
    function attachJitsiEventListeners(api) {
        // Event: Local user has joined the video conference.
        api.addEventListener("videoConferenceJoined", () => {
            console.log("[Jitsi Event] videoConferenceJoined: Local user joined.");
            isVideoConferenceJoined = true;
            const placeholder = document.getElementById("jitsiMeetPlaceholder");
            if (placeholder)
                placeholder.remove(); // Remove loading placeholder.
        });
        // Event: A remote participant has joined.
        api.addEventListener("participantJoined", (participant) => {
            console.log("Participant joined:", participant);
            // If it's not the current user and no opponent is set yet, consider this participant the opponent.
            if (participant.displayName !== currentUser.name && !opponentUser) {
                opponentUser = { id: 0, name: participant.displayName }; // Jitsi ID is not backend ID.
                const settings = getBattleSettings();
                setupBattleUI(settings, currentEventDetails); // Refresh UI with new opponent info.
                displaySystemMessage(`${participant.displayName} has joined the video call.`, `system-jitsi-${participant.id}`);
            }
        });
        // Event: A remote participant has left.
        api.addEventListener("participantLeft", (participant) => {
            console.log("Participant left:", participant);
            // If the leaving participant was the opponent, clear opponent info.
            if (opponentUser && opponentUser.name === participant.displayName) {
                displaySystemMessage(`${participant.displayName} has left the video call.`, `system-jitsi-left-${participant.id}`);
                opponentUser = null;
                const settings = getBattleSettings();
                setupBattleUI(settings, currentEventDetails); // Refresh UI.
            }
        });
        // Event: A text message is received from another participant via Jitsi.
        api.addEventListener("endpointTextMessageReceived", (event) => {
            console.log("[Jitsi Event] endpointTextMessageReceived:", event);
            if (event.data?.eventData?.text) {
                try {
                    // Parse the received message payload (expected to be JSON).
                    const msgPayload = JSON.parse(event.data.eventData.text);
                    const receivedMsg = {
                        ...msgPayload,
                        id: msgPayload.id || `jitsi-${Date.now()}`,
                        timestamp: new Date(msgPayload.timestamp || Date.now()),
                        // Determine if the message is from the current user or a partner.
                        type: msgPayload.userName === currentUser.name ? "user" : "partner",
                    };
                    displayChatMessage(receivedMsg); // Display the received chat message.
                }
                catch (e) {
                    console.error("Error parsing received Jitsi message:", e, event.data.eventData.text);
                }
            }
        });
        // Event: Jitsi API is ready to be closed (e.g., user clicked hang up).
        api.addEventListener("readyToClose", () => {
            console.log("Jitsi API is ready to close. Cleaning up.");
            isVideoConferenceJoined = false;
            if (jitsiApi) {
                jitsiApi.dispose(); // Clean up Jitsi resources.
                jitsiApi = null;
            }
            showEndConferencePlaceholder(); // Show a message indicating the conference has ended.
        });
        // Handle Jitsi iframe loading and errors.
        const iframe = api.getIFrame();
        if (iframe) {
            iframe.onload = () => {
                console.log("[Jitsi Event] iframe.onload: Jitsi iframe content has loaded.");
                const placeholder = document.getElementById("jitsiMeetPlaceholder");
                if (placeholder)
                    placeholder.remove(); // Remove loading placeholder once iframe is loaded.
            };
            iframe.onerror = (err) => {
                console.error("[Jitsi Event] iframe.onerror: Error loading Jitsi iframe content:", err);
                if (!isVideoConferenceJoined) {
                    // Show error if iframe fails to load before conference is joined.
                    showErrorInPlaceholder("Error loading video conference. Check connection or reload.");
                }
            };
        }
        else {
            console.warn("[Jitsi Init] api.getIFrame() returned null.");
        }
    }
    // Displays a placeholder message when the video conference ends.
    function showEndConferencePlaceholder() {
        const jitsiMeetContainer = document.getElementById("jitsiMeetContainer");
        let placeholder = document.getElementById("jitsiMeetPlaceholder");
        // If placeholder doesn't exist, create it.
        if (!placeholder && jitsiMeetContainer) {
            placeholder = document.createElement("div");
            placeholder.id = "jitsiMeetPlaceholder";
            placeholder.className = "video-placeholder d-flex align-items-center justify-content-center h-100";
            // Basic styling for the end conference message.
            placeholder.style.cssText =
                "position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); z-index: 10; display: flex;";
            jitsiMeetContainer.appendChild(placeholder);
        }
        if (placeholder) {
            placeholder.innerHTML =
                '<p class="text-light text-center p-3">Video conference ended. You can close this page.</p>';
            placeholder.style.display = "flex"; // Make it visible.
        }
    }
    // Fetches event details from the backend API.
    async function fetchEventDetails(eventId) {
        console.log(`Fetching event details for eventId: ${eventId}`);
        try {
            const response = await fetch(`${apiBase}/events/${eventId}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch event details: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`Failed to fetch event details: ${response.status}`);
            }
            const event = await response.json();
            console.log("Event details fetched successfully:", event);
            currentEventDetails = event; // Store globally for later use.
            // Try to identify the opponent from the event participants list.
            if (event.participants?.length > 0) {
                const fetchedOpponent = event.participants.find((p) => p.userId !== currentUser.id && ["opponent", "participant", "host"].includes(p.role));
                if (fetchedOpponent) {
                    opponentUser = {
                        id: fetchedOpponent.userId,
                        name: fetchedOpponent.username,
                        avatar: fetchedOpponent.avatar || "../assets/img/avatar.jpg", // Default avatar if none provided.
                    };
                    console.log("Opponent identified:", opponentUser);
                    displaySystemMessage(`${opponentUser.name} is registered for this event.`, `system-api-opponent-${fetchedOpponent.userId}`);
                }
            }
            return event;
        }
        catch (error) {
            console.error("Error in fetchEventDetails:", error);
            showErrorInPlaceholder("Could not load event data. Please check connection or try again.");
            throw error; // Re-throw to be caught by the caller.
        }
    }
    // Updates UI elements with details for a competitive challenge.
    function updateCompetitionDetailsInUI(eventDetails, timeLimit) {
        // Get references to UI elements displaying challenge info.
        const challengeNameEl = document.getElementById("challengeName");
        const challengeDifficultyEl = document.getElementById("challengeDifficulty");
        const challengeThemeEl = document.getElementById("challengeTheme");
        const challengeTimeEl = document.getElementById("challengeTime");
        // Populate elements with data from eventDetails or show 'N/A'.
        if (challengeNameEl)
            challengeNameEl.textContent = eventDetails?.challenge?.name || "N/A";
        if (challengeDifficultyEl)
            challengeDifficultyEl.textContent = eventDetails?.challenge?.difficulty || "N/A";
        if (challengeThemeEl)
            challengeThemeEl.textContent = eventDetails?.challenge?.theme || "N/A";
        // Use timeLimit from settings if available, otherwise from eventDetails.
        const displayTime = timeLimit || eventDetails?.challenge?.timeLimitMinutes;
        if (challengeTimeEl)
            challengeTimeEl.textContent = displayTime ? `${displayTime} Minuten` : "N/A";
    }
    // Starts a countdown timer for competitive mode.
    function startCookingTimer(durationMinutes) {
        const timerDisplay = document.getElementById("competitiveTimerDisplay");
        if (!timerDisplay)
            return; // Exit if timer display element not found.
        let timeLeft = durationMinutes * 60; // Convert minutes to seconds.
        const timerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            // Format time as MM:SS and update display.
            timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(timerInterval); // Stop the timer.
                timerDisplay.textContent = "Time's Up!";
                timerDisplay.classList.add("text-danger", "fw-bold"); // Style for emphasis.
                alert("Time's up! Cooking phase is over.");
                // TODO: Add logic for when time is up (e.g., disable input, trigger voting phase).
            }
        }, 1000); // Update every second.
    }
    // Sets up event listeners for chat input and send button.
    function setupChatFunctionality(eventId) {
        const chatInput = document.getElementById("chatInput");
        const sendChatBtn = document.getElementById("sendChatBtn");
        if (chatInput && sendChatBtn) {
            const handler = () => sendChatMessage(chatInput, eventId);
            sendChatBtn.addEventListener("click", handler); // Send on button click.
            chatInput.addEventListener("keypress", (event) => {
                if (event.key === "Enter")
                    handler(); // Send on Enter key press.
            });
        }
        else {
            console.warn("Chat input or send button not found.");
        }
    }
    // Sends a chat message.
    function sendChatMessage(chatInput, eventId) {
        const text = chatInput.value.trim();
        if (text === "")
            return; // Don't send empty messages.
        // Create a message object.
        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            text: text,
            timestamp: new Date(),
            type: "user", // Message from the current user.
        };
        displayChatMessage(message); // Display the message locally immediately.
        // If Jitsi API is available and conference is joined, send message via Jitsi.
        if (jitsiApi && isVideoConferenceJoined) {
            try {
                // Jitsi command to send a text message to all participants.
                // The second argument is 'to' (participantID), empty string sends to all.
                jitsiApi.executeCommand("sendEndpointTextMessage", "", JSON.stringify(message));
                console.log("Message sent via Jitsi: ", message);
            }
            catch (e) {
                console.error("Error sending message via Jitsi: ", e);
                // Display a system message if sending via Jitsi fails.
                displaySystemMessage("Error: Could not send message. It was displayed locally.", `err-${Date.now()}`);
            }
        }
        else {
            // Warn if Jitsi is not available or not connected.
            const warning = !jitsiApi ? "Video chat system not available." : "Video chat not fully connected.";
            displaySystemMessage(`Warning: ${warning} Message displayed locally only.`, `warn-${Date.now()}`);
        }
        chatInput.value = ""; // Clear the input field.
        scrollToLastMessage(); // Scroll chat to the latest message.
    }
    // Displays a system message in the chat window.
    function displaySystemMessage(text, id) {
        const systemMessage = {
            id,
            userId: 0,
            userName: "System",
            text,
            timestamp: new Date(),
            type: "system",
        };
        displayChatMessage(systemMessage);
    }
    // Scrolls the chat messages container to the bottom.
    function scrollToLastMessage() {
        const chatMessagesDiv = document.getElementById("chatMessages");
        if (chatMessagesDiv) {
            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
        }
    }
    // Appends a chat message to the chat display area.
    function displayChatMessage(message) {
        const chatMessagesDiv = document.getElementById("chatMessages");
        if (!chatMessagesDiv)
            return; // Exit if chat display area not found.
        const messageDiv = document.createElement("div");
        // Add base class and type-specific class for styling.
        messageDiv.classList.add("chat-message", `message-${message.type}`);
        const isCurrentUserMsg = message.userId === currentUser.id && message.type === "user";
        // Add classes to differentiate current user's messages, other users' messages, and system messages.
        messageDiv.classList.toggle("message-current-user", isCurrentUserMsg);
        messageDiv.classList.toggle("message-other-user", !isCurrentUserMsg && message.type !== "system");
        messageDiv.classList.toggle("message-system", message.type === "system");
        const avatarSrc = message.userAvatar || "../assets/img/avatar.jpg"; // Default avatar.
        // Format timestamp to HH:MM.
        const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        // HTML structure for a single chat message.
        // Uses flexbox to align current user's messages to the right.
        messageDiv.innerHTML = `
            <div class="d-flex ${isCurrentUserMsg ? "flex-row-reverse" : "flex-row"} mb-2">
                ${message.type !== "system"
            ? `<img src="${avatarSrc}" class="rounded-circle me-2 ms-2" style="width: 30px; height: 30px;" alt="${message.userName}'s avatar">`
            : ""}
                <div class="message-content p-2 rounded shadow-sm ${isCurrentUserMsg
            ? "bg-primary text-white"
            : message.type === "system"
                ? "bg-light text-muted w-100 text-center fst-italic"
                : "bg-light"}">
                    ${message.type !== "system" ? `<small class="fw-bold d-block">${message.userName}</small>` : ""}
                    <p class="mb-0">${escapeHTML(message.text)}</p> <!-- Escape HTML to prevent XSS -->
                    <small class="message-timestamp text-muted d-block ${isCurrentUserMsg ? "text-end" : "text-start"} mt-1" style="font-size: 0.75em;">
                        ${timeFormatted}
                    </small>
                </div>
            </div>
        `;
        chatMessagesDiv.appendChild(messageDiv);
        scrollToLastMessage(); // Ensure the new message is visible.
    }
    // Escapes HTML special characters in a string to prevent XSS.
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }
    // Sets up suggestion pills for quick chat messages in casual mode.
    function setupSuggestionPills() {
        const pillsContainer = document.getElementById("chatSuggestionPills");
        const chatInput = document.getElementById("chatInput");
        if (!pillsContainer || !chatInput)
            return;
        const suggestions = [
            "What's your favorite ingredient?",
            "Any tips for this recipe?",
            "How's it going over there?",
            "Need any help?",
            "This is fun!",
        ];
        pillsContainer.innerHTML = ""; // Clear any existing pills.
        suggestions.forEach((suggestion) => {
            const pill = document.createElement("button");
            pill.className = "btn btn-sm btn-outline-secondary me-1 mb-1";
            pill.textContent = suggestion;
            // When a pill is clicked, set its text as the chat input value and focus the input.
            pill.addEventListener("click", () => {
                chatInput.value = suggestion;
                chatInput.focus();
            });
            pillsContainer.appendChild(pill);
        });
    }
    // Sets up common event listeners, like the exit button.
    function setupCommonEventListeners() {
        const exitButton = document.getElementById("exitBattleButton");
        if (exitButton) {
            exitButton.addEventListener("click", () => {
                // Get current user role
                const settings = getBattleSettings();
                const isViewer = settings.mode === "competitive" && settings.role === "viewer";
                if (isViewer) {
                    // For viewers: just leave without affecting the meeting
                    console.log("Viewer leaving session - meeting continues for competitors");
                    if (jitsiApi) {
                        jitsiApi.dispose(); // Only dispose for this viewer
                        jitsiApi = null;
                    }
                    // Redirect to the main CookOff page
                    window.location.href = "CookOff.html";
                }
                else {
                    // For competitors: normal exit that ends the meeting
                    console.log("Competitor/casual user exiting - disposing Jitsi API");
                    if (jitsiApi) {
                        jitsiApi.dispose();
                        jitsiApi = null;
                    }
                    // Redirect to the main CookOff page
                    window.location.href = "CookOff.html";
                }
            });
        }
    }
    // Updates the UI to display opponent/partner information.
    function updateOpponentDisplayInUI(opponent, mode) {
        // Only update UI for casual mode - competitive mode doesn't show opponent info
        if (mode === "competitive") {
            return; // No opponent display in competitive mode
        }
        // Casual mode partner display logic
        const nameElId = "casualPartnerName";
        const avatarElId = "casualPartnerAvatar";
        const statusElId = "casualPartnerStatus";
        const nameEl = document.getElementById(nameElId);
        const avatarEl = document.getElementById(avatarElId);
        const statusEl = document.getElementById(statusElId);
        if (opponent) {
            // If partner exists, display their name and avatar.
            if (nameEl)
                nameEl.textContent = opponent.name;
            if (avatarEl)
                avatarEl.src = opponent.avatar || "../assets/img/avatar.jpg"; // Default avatar.
            // Update status for casual mode (e.g., "Online").
            if (statusEl) {
                statusEl.textContent = "Online";
                statusEl.className = "badge bg-success";
            }
        }
        else {
            // If no partner, display a waiting message.
            if (nameEl)
                nameEl.textContent = "Waiting for partner...";
            if (avatarEl)
                avatarEl.src = "../assets/img/avatar.jpg"; // Default placeholder avatar.
            // Update status for casual mode (e.g., "Offline").
            if (statusEl) {
                statusEl.textContent = "Offline";
                statusEl.className = "badge bg-secondary";
            }
        }
    }
    // Removed mock opponent joining and WebSocket placeholders as they are not functional without a backend.
    // Simplified Jitsi initialization and event handling.
    // Consolidated UI updates.
    // Sets up additional restrictions for viewers in competitive mode (invisible spectators)
    function setupViewerRestrictions(api) {
        // Wait for the API to be ready before applying restrictions
        api.addEventListener("videoConferenceJoined", () => {
            console.log("[Jitsi] Applying invisible spectator mode for viewer");
            try {
                // Ensure viewers are completely muted and hidden
                api.executeCommand("toggleAudio"); // Ensure muted
                api.executeCommand("toggleVideo"); // Ensure video off
                // Hide the local video tile for viewers
                api.executeCommand("setTileView", false);
                console.log("[Jitsi] Invisible spectator mode applied successfully");
            }
            catch (error) {
                console.warn("[Jitsi] Could not apply all spectator restrictions:", error);
            }
        });
        // Completely prevent any audio/video interaction for viewers
        api.addEventListener("audioMuteStatusChanged", (event) => {
            if (!event.muted) {
                console.log("[Jitsi] Spectator attempted audio interaction - blocking");
                api.executeCommand("toggleAudio"); // Force mute
            }
        });
        api.addEventListener("videoMuteStatusChanged", (event) => {
            if (!event.muted) {
                console.log("[Jitsi] Spectator attempted video interaction - blocking");
                api.executeCommand("toggleVideo"); // Force video off
            }
        });
        // Block screen sharing for viewers
        api.addEventListener("screenSharingStatusChanged", (event) => {
            if (event.on) {
                console.log("[Jitsi] Spectator attempted screen sharing - blocking");
                api.executeCommand("toggleShareScreen"); // Turn off screen sharing
            }
        }); // Block any chat attempts (additional layer of protection)
        api.addEventListener("outgoingMessage", (event) => {
            console.log("[Jitsi] Spectator attempted to send chat message - blocking");
            // Note: This event might not exist in all Jitsi versions, but added for completeness
            return false;
        });
        // Handle viewer exit differently - they leave without ending meeting for others
        api.addEventListener("readyToClose", () => {
            console.log("[Jitsi] Viewer is leaving session - meeting continues for competitors");
            // Custom leave logic for viewers - only they leave, meeting continues
            isVideoConferenceJoined = false;
            if (jitsiApi) {
                jitsiApi.dispose(); // Only dispose for this viewer
                jitsiApi = null;
            }
            // Redirect viewer back to lobby or main page
            window.location.href = "CookOff.html";
        });
    }
})(CookOffBattle || (CookOffBattle = {}));
