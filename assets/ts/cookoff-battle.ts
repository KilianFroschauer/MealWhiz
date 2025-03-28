// TypeScript for the CookOff Battle page

interface BattleSettings {
    mode: string;
    challenge?: string;
    difficulty?: string;
    timeLimit?: number;
}

document.addEventListener('DOMContentLoaded', (): void => {
    // Parse URL parameters to determine battle mode and settings
    const settings = getBattleSettings();
    
    // Initialize the appropriate UI based on the mode
    initializeBattleUI(settings);
    
    // Handle common initialization
    setupCommonEventListeners();
});

function getBattleSettings(): BattleSettings {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'competitive';
    
    const settings: BattleSettings = {
        mode: mode
    };
    
    // If we're in competitive mode, get additional parameters
    if (mode === 'competitive') {
        settings.challenge = urlParams.get('challenge') || 'default';
        settings.difficulty = urlParams.get('difficulty') || 'intermediate';
        settings.timeLimit = parseInt(urlParams.get('time') || '30', 10);
    }
    
    // Add mode class to body
    document.body.classList.add(`${mode}-mode`);
    
    return settings;
}

function initializeBattleUI(settings: BattleSettings): void {
    // Show the appropriate content section based on mode
    const casualContent = document.getElementById('casualModeContent');
    const competitiveContent = document.getElementById('competitiveModeContent');
    
    if (settings.mode === 'casual') {
        if (casualContent) casualContent.classList.remove('d-none');
        if (competitiveContent) competitiveContent.classList.add('d-none');
        initializeCasualMode();
    } else {
        if (casualContent) casualContent.classList.add('d-none');
        if (competitiveContent) competitiveContent.classList.remove('d-none');
        initializeCompetitiveMode(settings);
    }
    
    // Update page title and header
    const headerText = settings.mode === 'casual' ? 'Casual Cooking Session' : 'Competitive Cook-Off';
    const battleHeader = document.getElementById('battleHeader');
    if (battleHeader) {
        battleHeader.textContent = headerText;
    }
    
    document.title = `MealWhiz - ${headerText}`;
}

function initializeCasualMode(): void {
    console.log('Initializing casual mode...');
    
    // Set up casual chat
    setupCasualChat();
    
    // Set up suggestion pills
    setupSuggestionPills();
    
    // Simulate partner connection
    simulatePartnerConnection();
}

function initializeCompetitiveMode(settings: BattleSettings): void {
    console.log('Initializing competitive mode...', settings);
    
    // Set up competition details
    updateCompetitionDetails(settings);
    
    // Start the cooking timer based on settings
    startCookingTimer(settings.timeLimit || 30);
    
    // Set up spectator chat
    setupSpectatorChat();
    
    // Set up voting system if in the right phase
    setupVotingSystem();
    
    // Simulate spectator activity
    simulateSpectatorActivity();
}

// Casual Mode Functions
function setupCasualChat(): void {
    const chatInput = document.querySelector('#casualModeContent .chat-input') as HTMLInputElement;
    const sendButton = document.querySelector('#casualModeContent .send-button');
    const chatContainer = document.querySelector('#casualModeContent .chat-messages');
    
    if (chatInput && sendButton && chatContainer) {
        sendButton.addEventListener('click', () => sendCasualMessage(chatInput, chatContainer));
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendCasualMessage(chatInput, chatContainer);
            }
        });
    }
}

function sendCasualMessage(input: HTMLInputElement, container: Element): void {
    const message = input.value.trim();
    if (message) {
        // Create user message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';
        messageEl.innerHTML = `
            <div class="message-content">
                <span class="username">You</span>
                <p>${message}</p>
            </div>
        `;
        
        // Add to chat container
        container.appendChild(messageEl);
        
        // Clear input
        input.value = '';
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Simulate partner response after random delay
        setTimeout(() => {
            simulatePartnerResponse(container);
        }, 1000 + Math.random() * 2000);
    }
}

function simulatePartnerResponse(container: Element): void {
    const responses = [
        "That's a great tip! I'll have to try that.",
        "How long have you been cooking?",
        "Do you think I should add more seasoning?",
        "I'm really enjoying this cooking session!",
        "What's your favorite dish to make?",
        "I just took my dish out of the oven, it smells amazing!",
        "Have you ever tried adding a pinch of nutmeg? It makes a big difference!"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Create partner message element
    const messageEl = document.createElement('div');
    messageEl.className = 'message partner-message';
    messageEl.innerHTML = `
        <div class="message-content">
            <span class="username">Chef Partner</span>
            <p>${randomResponse}</p>
        </div>
    `;
    
    // Add to chat container
    container.appendChild(messageEl);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function setupSuggestionPills(): void {
    const suggestionPills = document.querySelectorAll('.suggestion-pill');
    const chatInput = document.querySelector('#casualModeContent .chat-input') as HTMLInputElement;
    
    suggestionPills.forEach(pill => {
        pill.addEventListener('click', function(this: Element) {
            if (chatInput) {
                chatInput.value = this.textContent || '';
                chatInput.focus();
            }
        });
    });
}

function simulatePartnerConnection(): void {
    const statusIndicator = document.querySelector('#casualModeContent .partner-status');
    const partnerInfo = document.querySelector('#casualModeContent .partner-info');
    
    if (statusIndicator && partnerInfo) {
        // Show connecting status
        statusIndicator.innerHTML = '<span class="badge bg-warning">Connecting...</span>';
        
        // After delay, show connected status
        setTimeout(() => {
            statusIndicator.innerHTML = '<span class="badge bg-success">Connected</span>';
            partnerInfo.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="../assets/img/avatar.jpg" class="rounded-circle me-2" style="width: 40px; height: 40px;" alt="Partner">
                    <div>
                        <h6 class="mb-0">Chef Alex</h6>
                        <small class="text-muted">Making: Italian Pasta</small>
                    </div>
                </div>
            `;
            
            // Show welcome message in chat
            const chatContainer = document.querySelector('#casualModeContent .chat-messages');
            if (chatContainer) {
                const messageEl = document.createElement('div');
                messageEl.className = 'message system-message';
                messageEl.innerHTML = `
                    <div class="message-content text-center">
                        <p>You are now connected with Chef Alex! Say hello and start cooking together.</p>
                    </div>
                `;
                chatContainer.appendChild(messageEl);
            }
        }, 2000);
    }
}

// Competitive Mode Functions
function updateCompetitionDetails(settings: BattleSettings): void {
    // Update challenge name
    const challengeName = document.querySelector('#competitiveModeContent .challenge-name');
    if (challengeName) {
        let displayName = "Default Challenge";
        
        // Map challenge codes to readable names
        switch(settings.challenge) {
            case 'breakfast-bowl': displayName = "Breakfast Bowl Challenge"; break;
            case 'poke-bowl': displayName = "Poke Bowl Showdown"; break;
            case 'seafood': displayName = "Seafood Extravaganza"; break;
            case 'pasta-perfection': displayName = "Pasta Perfection Battle"; break;
            case 'dessert-duel': displayName = "Sweet Dessert Duel"; break;
            case 'veggie-victory': displayName = "Vegetarian Victory Challenge"; break;
            case 'quick-meal': displayName = "30-Minute Meal Masterpiece"; break;
            case 'mystery-box': displayName = "Mystery Box Challenge"; break;
        }
        
        challengeName.textContent = displayName;
    }
    
    // Update difficulty badge
    const difficultyBadge = document.querySelector('#competitiveModeContent .difficulty-badge');
    if (difficultyBadge) {
        let badgeClass = "";
        
        // Assign appropriate badge color based on difficulty
        switch(settings.difficulty) {
            case 'beginner': badgeClass = "bg-success"; break;
            case 'intermediate': badgeClass = "bg-primary"; break;
            case 'advanced': badgeClass = "bg-warning"; break;
            case 'professional': badgeClass = "bg-danger"; break;
            default: badgeClass = "bg-primary";
        }
        
        difficultyBadge.className = `badge ${badgeClass}`;
        difficultyBadge.textContent = settings.difficulty || 'Intermediate';
    }
    
    // Update opponent info
    const opponentInfo = document.querySelector('#competitiveModeContent .opponent-info');
    if (opponentInfo) {
        opponentInfo.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="../assets/img/avatar.jpg" class="rounded-circle me-2" style="width: 40px; height: 40px;" alt="Opponent">
                <div>
                    <h6 class="mb-0">Chef Marcus</h6>
                    <small class="text-muted">Cooking Level: ${settings.difficulty || 'Intermediate'}</small>
                </div>
            </div>
        `;
    }
}

function startCookingTimer(minutes: number): void {
    const timerElement = document.querySelector('#competitiveModeContent .cooking-timer');
    if (!timerElement) return;
    
    let totalSeconds = minutes * 60;
    const timerInterval = setInterval(() => {
        const minutesLeft = Math.floor(totalSeconds / 60);
        const secondsLeft = totalSeconds % 60;
        
        timerElement.textContent = `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
        
        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            timerElement.textContent = "TIME'S UP!";
            timerElement.classList.add('text-danger', 'fw-bold');
            
            // Show photo submission section
            showPhotoSubmission();
        }
        
        totalSeconds--;
    }, 1000);
}

function showPhotoSubmission(): void {
    const competitivePhases = document.querySelectorAll('#competitiveModeContent .competition-phase');
    competitivePhases.forEach(phase => {
        phase.classList.add('d-none');
    });
    
    const submissionPhase = document.querySelector('#competitiveModeContent .submission-phase');
    if (submissionPhase) {
        submissionPhase.classList.remove('d-none');
    }
}

function setupSpectatorChat(): void {
    const chatInput = document.querySelector('#competitiveModeContent .spectator-chat-input') as HTMLInputElement;
    const sendButton = document.querySelector('#competitiveModeContent .spectator-send-button');
    const chatContainer = document.querySelector('#competitiveModeContent .spectator-chat-messages');
    
    if (chatInput && sendButton && chatContainer) {
        sendButton.addEventListener('click', () => sendSpectatorMessage(chatInput, chatContainer));
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendSpectatorMessage(chatInput, chatContainer);
            }
        });
    }
}

function sendSpectatorMessage(input: HTMLInputElement, container: Element): void {
    const message = input.value.trim();
    if (message) {
        // Create spectator message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message spectator-message';
        messageEl.innerHTML = `
            <div class="message-content">
                <span class="username">You (Spectator)</span>
                <p>${message}</p>
            </div>
        `;
        
        // Add to chat container
        container.appendChild(messageEl);
        
        // Clear input
        input.value = '';
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }
}

function setupVotingSystem(): void {
    const voteButtons = document.querySelectorAll('#competitiveModeContent .vote-button');
    voteButtons.forEach(button => {
        button.addEventListener('click', function(this: Element) {
            // Remove active class from all buttons
            voteButtons.forEach(btn => btn.classList.remove('active', 'btn-success'));
            
            // Add active class to clicked button
            this.classList.add('active', 'btn-success');
            
            // In a real application, this would send the vote to the server
            console.log('Voted for:', this.getAttribute('data-chef'));
        });
    });
}

function simulateSpectatorActivity(): void {
    const spectatorCountElement = document.querySelector('#competitiveModeContent .spectator-count');
    const chatContainer = document.querySelector('#competitiveModeContent .spectator-chat-messages');
    
    if (!spectatorCountElement || !chatContainer) return;
    
    // Initial spectator count
    let spectatorCount = Math.floor(Math.random() * 50) + 20;
    spectatorCountElement.textContent = `${spectatorCount} watching`;
    
    // Randomly update spectator count
    setInterval(() => {
        const change = Math.floor(Math.random() * 5) - 2;
        spectatorCount = Math.max(10, spectatorCount + change);
        spectatorCountElement.textContent = `${spectatorCount} watching`;
    }, 5000);
    
    // Simulate spectator chat messages
    const spectatorNames = ['FoodLover42', 'CookingFan', 'MasterChefWatcher', 'FoodieFanatic', 'KitchenGuru', 'CulinaryExplorer'];
    const spectatorMessages = [
        "That looks delicious!",
        "Chef 1 is doing great with that sauce!",
        "I think Chef 2 has the edge on presentation.",
        "Does anyone know what spice Chef 1 just added?",
        "Chef 2's plating skills are amazing!",
        "I'm definitely voting for Chef 1!",
        "This is so exciting to watch!",
        "Both dishes look amazing, hard to choose!",
        "I'm learning so much from watching this!",
        "Chef 2 seems to be struggling with timing"
    ];
    
    // Add initial system message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message system-message';
    welcomeMessage.innerHTML = `
        <div class="message-content text-center">
            <p>Welcome to the live competition! Chat with other spectators as you watch.</p>
        </div>
    `;
    chatContainer.appendChild(welcomeMessage);
    
    // Add random spectator messages periodically
    setInterval(() => {
        if (Math.random() > 0.7) {
            const randomName = spectatorNames[Math.floor(Math.random() * spectatorNames.length)];
            const randomMessage = spectatorMessages[Math.floor(Math.random() * spectatorMessages.length)];
            
            const messageEl = document.createElement('div');
            messageEl.className = 'message spectator-message';
            messageEl.innerHTML = `
                <div class="message-content">
                    <span class="username">${randomName}</span>
                    <p>${randomMessage}</p>
                </div>
            `;
            
            chatContainer.appendChild(messageEl);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, 3000);
}

// Common Functions
function setupCommonEventListeners(): void {
    try {
        // Handle page exit confirmation
        window.addEventListener('beforeunload', (e: BeforeUnloadEvent) => {
            // Show confirmation dialog if in the middle of a session
            const message = "Are you sure you want to leave? Your cooking session will be ended.";
            e.returnValue = message;
            return message;
        });
        
        // Handle exit button
        const exitButtons = document.querySelectorAll('.exit-button');
        exitButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (confirm("Are you sure you want to end this cooking session?")) {
                    window.location.href = "CookOff.html";
                }
            });
        });
    } catch (e) {
        console.warn("Error setting up event listeners:", e);
    }
}
