"use strict";
// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\cookoff.ts
// TypeScript for the CookOff page
// This script handles the main CookOff landing page, allowing users to
// initiate either a casual cooking session or a competitive cook-off.
// It interacts with a backend API to create events and then redirects
// to the CookOff-Battle page.
// --- AUTH HELPER FUNCTIONS ---
async function getUserInfoFromToken(token) {
    try {
        const response = await fetch('http://localhost:3000/validate-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            return {
                userId: data.userId || data.user_id,
                username: data.username || data.user_name
            };
        }
        return null;
    }
    catch (error) {
        console.error('Error validating token:', error);
        return null;
    }
}
// --- Bootstrap Modal Helper Functions ---
function showBootstrapModal(modalElement) {
    if (!modalElement) {
        // console.error("Modal element not provided to showBootstrapModal.");
        return;
    }
    try {
        let modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modalElement);
        }
        modalInstance.show();
    }
    catch (e) {
        console.warn("Error showing Bootstrap modal:", e, modalElement.id);
    }
}
function hideBootstrapModal(modalElement) {
    if (!modalElement) {
        // console.error("Modal element not provided to hideBootstrapModal.");
        return;
    }
    try {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    catch (e) {
        console.warn("Error hiding Bootstrap modal:", e, modalElement.id);
    }
}
// Main execution block after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // REMOVED: const _showModal = ...
    // REMOVED: const _hideModal = ...
    const findingModalElement = document.getElementById('findingPartnerModal');
    // --- NEW HELPER FUNCTIONS for Lobby System ---
    async function handleCreateCasualLobbyClick() {
        const form = document.getElementById('casualLobbyForm');
        const titleInput = document.getElementById('casualLobbyTitle');
        if (!form || !titleInput) {
            alert('Form elements not found');
            return;
        }
        const title = titleInput.value.trim();
        if (!title) {
            alert('Please enter a lobby title');
            return;
        }
        showBootstrapModal(findingModalElement);
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('accessToken');
            if (!token) {
                hideBootstrapModal(findingModalElement);
                alert("Please log in to create a lobby.");
                window.location.href = 'login.html';
                return;
            }
            // Get user info from token
            const userInfo = await getUserInfoFromToken(token);
            if (!userInfo) {
                hideBootstrapModal(findingModalElement);
                alert("Authentication failed. Please log in again.");
                window.location.href = 'login.html';
                return;
            }
            // Hide the create modal
            const createCasualModal = document.getElementById('createCasualLobbyModal');
            if (createCasualModal)
                hideBootstrapModal(createCasualModal);
            // Stream-URL wird jetzt vom Backend generiert
            const response = await fetch('http://localhost:3000/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    mode: 'casual',
                    challengeType: title,
                    description: 'Casual cooking session',
                    difficulty: 'Any'
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to create lobby: ${response.statusText}`);
            }
            const eventDetails = await response.json();
            const { id: eventId, streamUrl } = eventDetails;
            hideBootstrapModal(findingModalElement); // Pass username to Battle page for Jitsi
            window.location.href = `CookOff-Battle.html?mode=casual&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}&username=${encodeURIComponent(userInfo.username)}`;
        }
        catch (error) {
            console.error("Error creating casual lobby:", error);
            hideBootstrapModal(findingModalElement);
            alert("Could not create lobby. Please try again.");
        }
    }
    async function handleCreateLobbyClick() {
        showBootstrapModal(findingModalElement);
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('accessToken');
            if (!token) {
                hideBootstrapModal(findingModalElement);
                alert("Please log in to create a lobby.");
                window.location.href = 'login.html';
                return;
            }
            // Get user info from token
            const userInfo = await getUserInfoFromToken(token);
            if (!userInfo) {
                hideBootstrapModal(findingModalElement);
                alert("Authentication failed. Please log in again.");
                window.location.href = 'login.html';
                return;
            } // Stream-URL wird jetzt vom Backend generiert
            const response = await fetch('http://localhost:3000/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    mode: 'casual',
                    challengeType: 'Casual Fun',
                    difficulty: 'Any'
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to create lobby: ${response.statusText}`);
            }
            const eventDetails = await response.json();
            const { id: eventId, streamUrl } = eventDetails;
            hideBootstrapModal(findingModalElement);
            // Pass username to Battle page for Jitsi
            window.location.href = `CookOff-Battle.html?mode=casual&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}&username=${encodeURIComponent(userInfo.username)}`;
        }
        catch (error) {
            console.error("Error creating lobby:", error);
            hideBootstrapModal(findingModalElement);
            alert("Could not create lobby. Please try again.");
        }
    }
    function promptToJoinLobby(lobbyId, lobbyName, streamUrl) {
        const confirmationModal = document.getElementById('joinLobbyConfirmationModal');
        const confirmationBody = document.getElementById('joinLobbyConfirmationBody');
        const yesBtn = document.getElementById('confirmJoinYesBtn');
        const casualModal = document.getElementById('casualLobbyModal');
        if (!confirmationModal || !confirmationBody || !yesBtn) {
            console.error('Join confirmation modal elements not found.');
            alert('Error preparing to join lobby. Modal structure missing.');
            return;
        }
        confirmationBody.textContent = `Are you sure you want to join lobby "${lobbyName}"?`;
        const handleYesClick = async () => {
            hideBootstrapModal(confirmationModal);
            showBootstrapModal(findingModalElement);
            try {
                // Check authentication and get username
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    hideBootstrapModal(findingModalElement);
                    alert("Please log in to join a lobby.");
                    window.location.href = 'login.html';
                    return;
                }
                const userInfo = await getUserInfoFromToken(token);
                if (!userInfo) {
                    hideBootstrapModal(findingModalElement);
                    alert("Authentication failed. Please log in again.");
                    window.location.href = 'login.html';
                    return;
                }
                hideBootstrapModal(findingModalElement);
                // Pass username to Battle page for Jitsi
                window.location.href = `CookOff-Battle.html?mode=casual&eventId=${lobbyId}&streamUrl=${encodeURIComponent(streamUrl)}&username=${encodeURIComponent(userInfo.username)}`;
            }
            catch (error) {
                console.error("Error joining lobby:", error);
                hideBootstrapModal(findingModalElement);
                alert(`Could not join lobby "${lobbyName}". Please try again.`);
            }
            // Clean up listener to prevent multiple executions if modal is reused without full re-render
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        };
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        newYesBtn.addEventListener('click', handleYesClick, { once: true });
        // First hide the casual modal
        if (casualModal) {
            // Get the Bootstrap modal instance directly
            try {
                const bsModal = bootstrap.Modal.getInstance(casualModal);
                if (bsModal) {
                    // Use hide method with the preserve backdrop option
                    bsModal._config.backdrop = false; // Temporarily disable backdrop for the casual modal
                    bsModal.hide();
                }
            }
            catch (e) {
                console.warn("Error accessing casualModal instance:", e);
                // Fallback to hideBootstrapModal
                hideBootstrapModal(casualModal);
            }
        }
        // Reset modal display properties and ensure fresh initialization
        confirmationModal.style.display = 'block';
        confirmationModal.style.zIndex = '1500'; // Higher than default Bootstrap modal z-index
        // Use native Bootstrap modal initialization with specific options
        const confirmModal = new bootstrap.Modal(confirmationModal, {
            backdrop: 'static',
            keyboard: true,
            focus: true // Focus the modal when initialized
        });
        // Show the confirmation modal after a short delay to ensure DOM has updated
        setTimeout(() => {
            confirmModal.show();
        }, 100);
    }
    async function fetchAndRenderPublicLobbies(container) {
        container.innerHTML = '<p class="text-center">Loading public lobbies...</p>';
        try {
            // Add a cache-busting parameter (timestamp) to the URL
            const timestamp = new Date().getTime();
            const response = await fetch(`http://localhost:3000/events?mode=casual&status=open&t=${timestamp}`); // Adjust API endpoint if needed
            if (!response.ok) {
                throw new Error(`Failed to fetch lobbies: ${response.statusText} (${response.status})`);
            }
            const lobbies = await response.json();
            container.innerHTML = '';
            if (lobbies.length === 0) {
                container.innerHTML = '<p class="text-center">No public lobbies available. Why not create one?</p>';
                return;
            }
            const ul = document.createElement('ul');
            ul.className = 'list-group';
            lobbies.forEach(lobby => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-action';
                // Create a more detailed display with title only
                const titleDiv = document.createElement('div');
                titleDiv.className = 'fw-bold';
                titleDiv.textContent = lobby.challengeType || lobby.name || lobby.id;
                li.appendChild(titleDiv);
                li.style.cursor = 'pointer';
                li.setAttribute('data-lobby-id', lobby.id);
                li.setAttribute('data-lobby-name', lobby.challengeType || lobby.name || lobby.id);
                li.setAttribute('data-stream-url', lobby.streamUrl);
                li.addEventListener('click', () => {
                    promptToJoinLobby(lobby.id, lobby.challengeType || lobby.name || lobby.id, lobby.streamUrl);
                });
                ul.appendChild(li);
            });
            container.appendChild(ul);
        }
        catch (error) {
            console.error("Error fetching public lobbies:", error);
            container.innerHTML = '<p class="text-center text-danger">Could not load public lobbies. Please try again later.</p>';
        }
    }
    function setupLobbyInterface(modalBody) {
        modalBody.innerHTML = ''; // Clear existing content
        const headerDiv = document.createElement('div');
        headerDiv.className = 'd-flex justify-content-between align-items-center mb-3';
        const title = document.createElement('h5');
        title.className = 'modal-title'; // Match Bootstrap modal title styling
        title.textContent = 'Casual Lobbies';
        const createLobbyBtn = document.createElement('button');
        createLobbyBtn.id = 'createLobbyBtn';
        createLobbyBtn.className = 'btn btn-success'; // Green button
        // Replace with your preferred icon method if available:
        createLobbyBtn.innerHTML = '<span style="font-size: 1.2em; line-height: 1; vertical-align: middle; margin-right: 0.3em;">+</span> Create Lobby';
        createLobbyBtn.addEventListener('click', () => {
            const createCasualModal = document.getElementById('createCasualLobbyModal');
            if (createCasualModal) {
                showBootstrapModal(createCasualModal);
            }
        });
        headerDiv.appendChild(title);
        headerDiv.appendChild(createLobbyBtn);
        modalBody.appendChild(headerDiv);
        const lobbiesListContainer = document.createElement('div');
        lobbiesListContainer.id = 'publicLobbiesList';
        modalBody.appendChild(lobbiesListContainer);
        fetchAndRenderPublicLobbies(lobbiesListContainer);
        // Note: The casualModeModal (which contains this modalBody) should already be shown
        // by the button that calls setupLobbyInterface.
    }
    const startCasualCookingBtn = document.getElementById('startCasualCookingBtn');
    if (startCasualCookingBtn) {
        startCasualCookingBtn.addEventListener('click', function () {
            const casualLobbyModalElement = document.getElementById('casualLobbyModal');
            if (casualLobbyModalElement) {
                const modalBody = document.getElementById('casualLobbyModalBody');
                if (modalBody) {
                    setupLobbyInterface(modalBody);
                    showBootstrapModal(casualLobbyModalElement);
                }
                else {
                    console.error('Could not find modal body in #casualLobbyModal');
                    alert('Error setting up lobby interface: Modal body not found.');
                }
            }
            else {
                console.error('#casualLobbyModal not found.');
                alert('Error accessing casual mode features: Modal element not found.');
            }
        });
    }
    const findPartnerBtn = document.getElementById('findPartnerBtn');
    if (findPartnerBtn) {
        findPartnerBtn.addEventListener('click', function () {
            // This is now legacy code since we removed the casualModeModal
            // But keeping it for backwards compatibility if any old references exist
            console.warn('findPartnerBtn clicked - this is legacy functionality');
        });
    }
    const startCompetitionBtn = document.getElementById('startCompetitionBtn');
    if (startCompetitionBtn) {
        startCompetitionBtn.addEventListener('click', async function () {
            const competitiveModalElement = document.getElementById('competitiveModeModal');
            const findingOpponentElement = document.getElementById('findingOpponentModal');
            const challengeTypeEl = document.getElementById('challengeType');
            const difficultyLevelEl = document.getElementById('difficultyLevel');
            if (competitiveModalElement && findingOpponentElement && challengeTypeEl && difficultyLevelEl) {
                hideBootstrapModal(competitiveModalElement);
                showBootstrapModal(findingOpponentElement);
                const challengeType = challengeTypeEl.value;
                const difficultyLevel = difficultyLevelEl.value;
                try {
                    const response = await fetch('http://localhost:3000/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            mode: 'competitive',
                            challengeType: challengeType,
                            difficulty: difficultyLevel
                        })
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to create competitive event: ${response.statusText}`);
                    }
                    const eventDetails = await response.json();
                    const { id: eventId, streamUrl } = eventDetails;
                    hideBootstrapModal(findingOpponentElement);
                    window.location.href = `CookOff-Battle.html?mode=competitive&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}`;
                }
                catch (error) {
                    console.error("Error starting competitive cookoff:", error);
                    hideBootstrapModal(findingOpponentElement);
                    alert("Could not start competitive cookoff. Please try again.");
                }
            }
            else {
                let errorMsg = "Could not start competitive cookoff. Required elements are missing: ";
                if (!competitiveModalElement)
                    errorMsg += "Competitive Modal, ";
                if (!findingOpponentElement)
                    errorMsg += "Finding Opponent Modal, ";
                if (!challengeTypeEl)
                    errorMsg += "Challenge Type Select, ";
                if (!difficultyLevelEl)
                    errorMsg += "Difficulty Level Select, ";
                console.error(errorMsg.slice(0, -2));
                alert(errorMsg.slice(0, -2) + ".");
                if (findingOpponentElement && findingOpponentElement.classList.contains('show')) {
                    hideBootstrapModal(findingOpponentElement);
                }
            }
        });
    }
    const cancelButtons = document.querySelectorAll('#cancelSearchBtn, #cancelCompetitionBtn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalToCancel = button.closest('.modal');
            if (modalToCancel) {
                hideBootstrapModal(modalToCancel);
            }
        });
    });
    // Event Listeners for Competitive Mode
    const competitiveModeModal = document.getElementById('competitiveModeModal');
    if (competitiveModeModal) {
        competitiveModeModal.addEventListener('shown.bs.modal', () => {
            setupCompetitiveLobbies();
        });
    }
    const createCompetitiveLobbyBtn = document.getElementById('createCompetitiveLobbyBtn');
    if (createCompetitiveLobbyBtn) {
        createCompetitiveLobbyBtn.addEventListener('click', () => {
            const createModal = document.getElementById('createCompetitiveLobbyModal');
            if (createModal)
                showBootstrapModal(createModal);
        });
    }
    const competitiveLobbyForm = document.getElementById('competitiveLobbyForm');
    if (competitiveLobbyForm) {
        competitiveLobbyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateCompetitiveLobbyClick();
        });
    }
    const casualLobbyForm = document.getElementById('casualLobbyForm');
    if (casualLobbyForm) {
        casualLobbyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateCasualLobbyClick();
        });
    }
});
// Initializes the form for setting up a competitive cooking session.
function initCompetitiveCookingForm() {
    // Get the challenge type dropdown element.
    const challengeTypeSelect = document.getElementById('challengeType');
    if (challengeTypeSelect) {
        // Add an event listener for changes to the challenge type.
        challengeTypeSelect.addEventListener('change', updateChallengeDetails);
    }
    // Placeholder function to update challenge details based on selection.
    // In a real application, this might fetch details from an API or update other form fields.
    function updateChallengeDetails() {
        console.log('Challenge type changed:', challengeTypeSelect.value);
        // Example: Fetch details for challengeTypeSelect.value and update UI.
    }
}
// --- COMPETITIVE MODE FUNCTIONS ---
async function handleCreateCompetitiveLobbyClick() {
    const form = document.getElementById('competitiveLobbyForm');
    const durationInput = document.getElementById('cookoffDuration');
    const descriptionInput = document.getElementById('cookoffDescription');
    if (!form || !durationInput || !descriptionInput) {
        alert('Form elements not found');
        return;
    }
    const duration = parseInt(durationInput.value);
    const description = descriptionInput.value.trim();
    if (!duration || duration < 10 || duration > 180) {
        alert('Please enter a valid duration (10-180 minutes)');
        return;
    }
    if (!description) {
        alert('Please enter a description');
        return;
    }
    try {
        // Check authentication
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert("Please log in to create a lobby.");
            window.location.href = 'login.html';
            return;
        }
        const userInfo = await getUserInfoFromToken(token);
        if (!userInfo) {
            alert("Authentication failed. Please log in again.");
            window.location.href = 'login.html';
            return;
        } // Stream-URL wird jetzt vom Backend generiert
        const response = await fetch('http://localhost:3000/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                mode: 'competitive',
                challengeType: description,
                difficulty: 'medium'
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to create competitive lobby: ${response.statusText}`);
        }
        const eventDetails = await response.json();
        const { id: eventId, streamUrl } = eventDetails;
        // Hide modals and redirect
        const createModal = document.getElementById('createCompetitiveLobbyModal');
        const competitiveModal = document.getElementById('competitiveModeModal');
        if (createModal)
            hideBootstrapModal(createModal);
        if (competitiveModal)
            hideBootstrapModal(competitiveModal);
        // Redirect to battle page with competitive mode and duration
        window.location.href = `CookOff-Battle.html?mode=competitive&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}&username=${encodeURIComponent(userInfo.username)}&duration=${duration}&description=${encodeURIComponent(description)}`;
    }
    catch (error) {
        console.error("Error creating competitive lobby:", error);
        alert("Could not create competitive lobby. Please try again.");
    }
}
function setupCompetitiveLobbies() {
    const competitiveLobbiesList = document.getElementById('competitiveLobbiesList');
    if (!competitiveLobbiesList)
        return;
    // Fetch competitive lobbies
    fetchCompetitiveLobbies(competitiveLobbiesList);
}
async function fetchCompetitiveLobbies(container) {
    container.innerHTML = '<p class="text-center">Loading competitive lobbies...</p>';
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`http://localhost:3000/events?mode=competitive&status=pending&t=${timestamp}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch competitive lobbies: ${response.statusText}`);
        }
        const lobbies = await response.json();
        container.innerHTML = '';
        if (lobbies.length === 0) {
            container.innerHTML = '<p class="text-center">No competitive lobbies available. Create one!</p>';
            return;
        }
        const div = document.createElement('div');
        div.className = 'list-group';
        lobbies.forEach(lobby => {
            const competitors = lobby.participants?.filter(p => p.role === 'host' || p.role === 'opponent') || [];
            const isOpen = competitors.length < 2;
            const item = document.createElement('div');
            item.className = `list-group-item ${isOpen ? 'list-group-item-action' : 'list-group-item-secondary'}`;
            item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">                        <div>
                            <h6 class="mb-1">${lobby.challengeType || 'Competitive CookOff'}</h6>
                            <small>Host: ${lobby.hostName || 'Unknown'}</small>
                        </div>
                        <div>
                            ${isOpen ?
                `<button class="btn btn-sm btn-danger me-2" onclick="joinCompetitiveLobby('${lobby.id}', '${lobby.challengeType || 'CookOff'}', '${lobby.streamUrl}', 'competitor')">Join as Competitor</button>
                                 <button class="btn btn-sm btn-outline-primary" onclick="joinCompetitiveLobby('${lobby.id}', '${lobby.challengeType || 'CookOff'}', '${lobby.streamUrl}', 'viewer')">Join as Viewer</button>` :
                `<button class="btn btn-sm btn-outline-primary" onclick="joinCompetitiveLobby('${lobby.id}', '${lobby.challengeType || 'CookOff'}', '${lobby.streamUrl}', 'viewer')">Watch</button>`}
                        </div>
                    </div>
                `;
            div.appendChild(item);
        });
        container.appendChild(div);
    }
    catch (error) {
        console.error("Error fetching competitive lobbies:", error);
        container.innerHTML = '<p class="text-center text-danger">Could not load competitive lobbies.</p>';
    }
}
// Global function for joining competitive lobbies (called from dynamically generated buttons)
window.joinCompetitiveLobby = async function (lobbyId, lobbyName, streamUrl, role) {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert("Please log in to join a lobby.");
            window.location.href = 'login.html';
            return;
        }
        const userInfo = await getUserInfoFromToken(token);
        if (!userInfo) {
            alert("Authentication failed. Please log in again.");
            window.location.href = 'login.html';
            return;
        }
        // Hide competitive modal
        const competitiveModal = document.getElementById('competitiveModeModal');
        if (competitiveModal)
            hideBootstrapModal(competitiveModal);
        // Redirect with role information
        window.location.href = `CookOff-Battle.html?mode=competitive&eventId=${lobbyId}&streamUrl=${encodeURIComponent(streamUrl)}&username=${encodeURIComponent(userInfo.username)}&role=${role}`;
    }
    catch (error) {
        console.error("Error joining competitive lobby:", error);
        alert("Could not join lobby. Please try again.");
    }
};
// --- EVENT LISTENERS ---
