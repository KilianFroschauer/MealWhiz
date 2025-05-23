"use strict";
// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\cookoff.ts
// TypeScript for the CookOff page
// This script handles the main CookOff landing page, allowing users to
// initiate either a casual cooking session or a competitive cook-off.
// It interacts with a backend API to create events and then redirects
// to the CookOff-Battle page.
// Main execution block after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Event listener for the "Find Cooking Partner" button (Casual Mode).
    const findPartnerBtn = document.getElementById('findPartnerBtn');
    if (findPartnerBtn) {
        findPartnerBtn.addEventListener('click', async function () {
            // Hide the casual mode selection modal if it's currently shown.
            const casualModalElement = document.getElementById('casualModeModal');
            if (casualModalElement) {
                hideModal(casualModalElement);
            }
            // Show the "Finding Partner" loading modal.
            const findingModalElement = document.getElementById('findingPartnerModal');
            if (findingModalElement) {
                showModal(findingModalElement);
                try {
                    // Send a POST request to the backend to create a new 'casual' event.
                    const response = await fetch('http://localhost:3000/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // TODO: Add Authorization header if authentication is required.
                        },
                        body: JSON.stringify({
                            mode: 'casual',
                            challengeType: 'Casual Fun',
                            difficulty: 'Any' // Default difficulty for casual mode.
                        })
                    });
                    if (!response.ok) {
                        // If the API request fails, throw an error.
                        throw new Error(`Failed to create event: ${response.statusText}`);
                    }
                    // Parse the JSON response from the API.
                    const eventDetails = await response.json();
                    const { id: eventId, streamUrl } = eventDetails; // Destructure event ID and stream URL.
                    // Hide the "Finding Partner" loading modal.
                    hideModal(findingModalElement);
                    // Redirect to the CookOff-Battle page with necessary parameters.
                    window.location.href = `CookOff-Battle.html?mode=casual&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}`;
                }
                catch (error) {
                    console.error("Error starting casual cookoff:", error);
                    // Hide the loading modal on error.
                    hideModal(findingModalElement);
                    // Optionally, display an error message to the user.
                    alert("Could not start casual cookoff. Please try again.");
                }
            }
        });
    }
    // Event listener for the "Start Competition" button (Competitive Mode).
    const startCompetitionBtn = document.getElementById('startCompetitionBtn');
    if (startCompetitionBtn) {
        startCompetitionBtn.addEventListener('click', async function () {
            // Hide the competitive mode setup modal.
            const competitiveModalElement = document.getElementById('competitiveModeModal');
            if (competitiveModalElement) {
                hideModal(competitiveModalElement);
            }
            // Show the "Finding Opponent" loading modal (or similar).
            const findingOpponentElement = document.getElementById('findingOpponentModal');
            if (findingOpponentElement) {
                showModal(findingOpponentElement);
                // Get selected challenge type and difficulty level from the form.
                const challengeType = document.getElementById('challengeType').value;
                const difficultyLevel = document.getElementById('difficultyLevel').value;
                try {
                    // Send a POST request to create a 'competitive' event.
                    const response = await fetch('http://localhost:3000/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // TODO: Add Authorization header if needed.
                        },
                        body: JSON.stringify({
                            mode: 'competitive',
                            challengeType: challengeType,
                            difficulty: difficultyLevel
                        })
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to create event: ${response.statusText}`);
                    }
                    const eventDetails = await response.json();
                    const { id: eventId, streamUrl } = eventDetails;
                    // Hide the loading modal.
                    hideModal(findingOpponentElement);
                    // Redirect to CookOff-Battle page with competitive mode parameters.
                    // Encode URI components for parameters that might contain special characters.
                    window.location.href = `CookOff-Battle.html?mode=competitive&eventId=${eventId}&streamUrl=${encodeURIComponent(streamUrl)}&challengeType=${encodeURIComponent(challengeType)}&difficulty=${encodeURIComponent(difficultyLevel)}`;
                }
                catch (error) {
                    console.error("Error starting competitive cookoff:", error);
                    hideModal(findingOpponentElement);
                    alert("Could not start competitive cookoff. Please try again.");
                }
            }
        });
    }
    // Event listeners for "Cancel" buttons within modals.
    const cancelButtons = document.querySelectorAll('#cancelSearchBtn, #cancelCompetitionBtn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            // Find the closest parent modal and hide it.
            const modalId = this.closest('.modal').id;
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                hideModal(modalElement);
            }
        });
    });
    // Initialize the competitive cooking form (e.g., set up dynamic updates based on selections).
    initCompetitiveCookingForm();
});
// Hides a Bootstrap modal.
function hideModal(modalElement) {
    try {
        // Uses Bootstrap's JavaScript API to hide the modal.
        // @ts-ignore is used because Bootstrap's global `bootstrap` object might not be typed.
        const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }
    catch (e) {
        // Log a warning if hiding the modal fails (e.g., Bootstrap JS not loaded).
        console.warn("Error hiding modal:", e);
    }
}
// Shows a Bootstrap modal.
function showModal(modalElement) {
    try {
        // Uses Bootstrap's JavaScript API to show the modal.
        // @ts-ignore for potential untyped Bootstrap global.
        const bootstrapModal = new bootstrap.Modal(modalElement);
        bootstrapModal.show();
    }
    catch (e) {
        console.warn("Error showing modal:", e);
    }
}
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
