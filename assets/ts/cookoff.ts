// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\cookoff.ts
// TypeScript for the CookOff page
// This script handles the main CookOff landing page, allowing users to
// initiate either a casual cooking session or a competitive cook-off.
// It interacts with a backend API to create events and then redirects
// to the CookOff-Battle page.

// Interface for CookOffEvent, primarily for type-checking event targets.
// Note: This interface seems basic and might need refinement based on actual usage.
interface CookOffEvent {
    target: HTMLElement;
    preventDefault(): void;
}

// Declare bootstrap for TypeScript
declare var bootstrap: any;

// --- Bootstrap Modal Helper Functions ---
function showBootstrapModal(modalElement: HTMLElement | null): void {
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
    } catch (e) {
        console.warn("Error showing Bootstrap modal:", e, modalElement.id);
    }
}

function hideBootstrapModal(modalElement: HTMLElement | null): void {
    if (!modalElement) {
        // console.error("Modal element not provided to hideBootstrapModal.");
        return;
    }
    try {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    } catch (e) {
        console.warn("Error hiding Bootstrap modal:", e, modalElement.id);
    }
}

// Main execution block after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', (): void => {
    // REMOVED: const _showModal = ...
    // REMOVED: const _hideModal = ...

    const findingModalElement = document.getElementById('findingPartnerModal');

    // --- NEW HELPER FUNCTIONS for Lobby System ---

    async function handleCreateLobbyClick(): Promise<void> {
        showBootstrapModal(findingModalElement);

        try {
            const response = await fetch('http://localhost:3000/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            window.location.href = `CookOff-Battle.html?mode=casual&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}`;

        } catch (error) {
            console.error("Error creating lobby:", error);
            hideBootstrapModal(findingModalElement);
            alert("Could not create lobby. Please try again.");
        }
    }

    function promptToJoinLobby(lobbyId: string, lobbyName: string, streamUrl: string): void {
        const confirmationModal = document.getElementById('joinLobbyConfirmationModal');
        const confirmationBody = document.getElementById('joinLobbyConfirmationBody');
        const yesBtn = document.getElementById('confirmJoinYesBtn');
        const casualModal = document.getElementById('casualModeModal');
        
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
                // If your backend requires an explicit join call, add it here.
                // e.g., await fetch(`http://localhost:3000/events/${lobbyId}/join`, { method: 'POST' });
                
                hideBootstrapModal(findingModalElement);
                window.location.href = `CookOff-Battle.html?mode=casual&eventId=${lobbyId}&streamUrl=${encodeURIComponent(streamUrl)}`;
            } catch (error) {
                console.error("Error joining lobby:", error);
                hideBootstrapModal(findingModalElement);
                alert(`Could not join lobby "${lobbyName}". Please try again.`);
            }
            // Clean up listener to prevent multiple executions if modal is reused without full re-render
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode!.replaceChild(newYesBtn, yesBtn);
        };
        
        const newYesBtn = yesBtn.cloneNode(true) as HTMLElement;
        yesBtn.parentNode!.replaceChild(newYesBtn, yesBtn);
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
            } catch (e) {
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
            backdrop: 'static', // Prevents closing modal when clicking outside
            keyboard: true,     // Allow ESC key to close modal
            focus: true         // Focus the modal when initialized
        });
        
        // Show the confirmation modal after a short delay to ensure DOM has updated
        setTimeout(() => {
            confirmModal.show();
        }, 100);
    }

    async function fetchAndRenderPublicLobbies(container: HTMLElement): Promise<void> {
        container.innerHTML = '<p class="text-center">Loading public lobbies...</p>';
        try {
            // Add a cache-busting parameter (timestamp) to the URL
            const timestamp = new Date().getTime();
            const response = await fetch(`http://localhost:3000/events?mode=casual&status=open&t=${timestamp}`); // Adjust API endpoint if needed
            if (!response.ok) {
                throw new Error(`Failed to fetch lobbies: ${response.statusText} (${response.status})`);
            }
            const lobbies: Array<{ id: string; name?: string; streamUrl: string; [key: string]: any }> = await response.json();

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
                li.textContent = `Lobby: ${lobby.name || lobby.id}`; 
                li.style.cursor = 'pointer';
                li.setAttribute('data-lobby-id', lobby.id);
                li.setAttribute('data-lobby-name', lobby.name || lobby.id);
                li.setAttribute('data-stream-url', lobby.streamUrl);
                li.addEventListener('click', () => {
                    promptToJoinLobby(lobby.id, lobby.name || lobby.id, lobby.streamUrl);
                });
                ul.appendChild(li);
            });
            container.appendChild(ul);

        } catch (error) {
            console.error("Error fetching public lobbies:", error);
            container.innerHTML = '<p class="text-center text-danger">Could not load public lobbies. Please try again later.</p>';
        }
    }

    function setupLobbyInterface(modalBody: HTMLElement): void {
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
        createLobbyBtn.addEventListener('click', handleCreateLobbyClick);
        
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

    const findPartnerBtn = document.getElementById('findPartnerBtn');
    if (findPartnerBtn) {
        findPartnerBtn.addEventListener('click', function(): void { 
            const casualModalElement = document.getElementById('casualModeModal');
            if (casualModalElement) {
                const modalBody = casualModalElement.querySelector('.modal-body');
                if (modalBody) {
                    setupLobbyInterface(modalBody as HTMLElement);
                    // The casualModalElement is the one triggered by data-bs-toggle="modal" data-bs-target="#casualModeModal"
                    // on the "Start Casual Cooking" button.
                    // If it's not already shown by Bootstrap's default behavior, we ensure it here.
                    // However, the button "Start Casual Cooking" should handle showing #casualModeModal.
                    // The `setupLobbyInterface` is called when `findPartnerBtn` (which is *inside* #casualModeModal) is clicked.
                    // So, #casualModeModal should already be visible.
                    // If findPartnerBtn was *outside* and meant to *open* #casualModeModal with lobby UI, then showBootstrapModal(casualModalElement) here would be correct.
                    // Given the current HTML, "Start Casual Cooking" opens #casualModeModal, then user clicks #findPartnerBtn inside it.
                } else {
                    console.error('Could not find .modal-body in #casualModeModal');
                    alert('Error setting up lobby interface: Modal body not found.');
                }
            } else {
                console.error('#casualModeModal not found.');
                alert('Error accessing casual mode features: Modal element not found.');
            }
        });
    }
    
    const startCompetitionBtn = document.getElementById('startCompetitionBtn');
    if (startCompetitionBtn) {
        startCompetitionBtn.addEventListener('click', async function(): Promise<void> {
            const competitiveModalElement = document.getElementById('competitiveModeModal');
            const findingOpponentElement = document.getElementById('findingOpponentModal');
            
            const challengeTypeEl = document.getElementById('challengeType') as HTMLSelectElement;
            const difficultyLevelEl = document.getElementById('difficultyLevel') as HTMLSelectElement;

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

                } catch (error) {
                    console.error("Error starting competitive cookoff:", error);
                    hideBootstrapModal(findingOpponentElement);
                    alert("Could not start competitive cookoff. Please try again.");
                }
            } else {
                let errorMsg = "Could not start competitive cookoff. Required elements are missing: ";
                if (!competitiveModalElement) errorMsg += "Competitive Modal, ";
                if (!findingOpponentElement) errorMsg += "Finding Opponent Modal, ";
                if (!challengeTypeEl) errorMsg += "Challenge Type Select, ";
                if (!difficultyLevelEl) errorMsg += "Difficulty Level Select, ";
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
                hideBootstrapModal(modalToCancel as HTMLElement);
            }
        });
    });
});

// Initializes the form for setting up a competitive cooking session.
function initCompetitiveCookingForm(): void {
    // Get the challenge type dropdown element.
    const challengeTypeSelect = document.getElementById('challengeType') as HTMLSelectElement;
    if (challengeTypeSelect) {
        // Add an event listener for changes to the challenge type.
        challengeTypeSelect.addEventListener('change', updateChallengeDetails);
    }
    
    // Placeholder function to update challenge details based on selection.
    // In a real application, this might fetch details from an API or update other form fields.
    function updateChallengeDetails(): void {
        console.log('Challenge type changed:', challengeTypeSelect.value);
        // Example: Fetch details for challengeTypeSelect.value and update UI.
    }
}
