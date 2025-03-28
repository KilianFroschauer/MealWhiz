"use strict";
// TypeScript for the CookOff page
document.addEventListener('DOMContentLoaded', () => {
    // Find cooking partner button click event
    const findPartnerBtn = document.getElementById('findPartnerBtn');
    if (findPartnerBtn) {
        findPartnerBtn.addEventListener('click', function () {
            // Hide the casual mode modal if it exists
            const casualModalElement = document.getElementById('casualModeModal');
            if (casualModalElement) {
                // Use Bootstrap's modal API to hide the modal
                hideModal(casualModalElement);
            }
            // Show the finding partner modal
            const findingModalElement = document.getElementById('findingPartnerModal');
            if (findingModalElement) {
                showModal(findingModalElement);
                // Simulate finding a partner after a few seconds
                setTimeout(() => {
                    // Hide finding partner modal
                    hideModal(findingModalElement);
                    // Redirect to the battle page with a query parameter indicating casual mode
                    window.location.href = "CookOff-Battle.html?mode=casual";
                }, 3000);
            }
        });
    }
    // Start competition button event
    const startCompetitionBtn = document.getElementById('startCompetitionBtn');
    if (startCompetitionBtn) {
        startCompetitionBtn.addEventListener('click', function () {
            const competitiveModalElement = document.getElementById('competitiveModeModal');
            if (competitiveModalElement) {
                hideModal(competitiveModalElement);
            }
            const findingOpponentElement = document.getElementById('findingOpponentModal');
            if (findingOpponentElement) {
                showModal(findingOpponentElement);
                // Simulate finding an opponent after a few seconds
                setTimeout(() => {
                    hideModal(findingOpponentElement);
                    // Redirect to the battle page with a query parameter indicating competitive mode
                    const challengeType = document.getElementById('challengeType').value;
                    const difficultyLevel = document.getElementById('difficultyLevel').value;
                    const timeLimit = document.getElementById('timeLimit').value;
                    window.location.href = `CookOff-Battle.html?mode=competitive&challenge=${challengeType}&difficulty=${difficultyLevel}&time=${timeLimit}`;
                }, 3000);
            }
        });
    }
    // Cancel search buttons
    const cancelButtons = document.querySelectorAll('#cancelSearchBtn, #cancelCompetitionBtn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            const modalId = this.closest('.modal').id;
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                hideModal(modalElement);
            }
        });
    });
    // Initialize competitive cooking form
    initCompetitiveCookingForm();
    // Timer functionality if needed
    setupTimers();
    // Simulate spectator activity if on the battle page
    updateSpectatorActivity();
});
function hideModal(modalElement) {
    try {
        // Use Bootstrap's modal API to hide the modal
        // @ts-ignore - Bootstrap types not available
        const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }
    catch (e) {
        console.warn("Error hiding modal:", e);
    }
}
function showModal(modalElement) {
    try {
        // Use Bootstrap's modal API to show the modal
        // @ts-ignore - Bootstrap types not available
        const bootstrapModal = new bootstrap.Modal(modalElement);
        bootstrapModal.show();
    }
    catch (e) {
        console.warn("Error showing modal:", e);
    }
}
function initCompetitiveCookingForm() {
    // Ensure the challenge type dropdown has proper event listeners
    const challengeTypeSelect = document.getElementById('challengeType');
    if (challengeTypeSelect) {
        challengeTypeSelect.addEventListener('change', updateChallengeDetails);
    }
    function updateChallengeDetails() {
        // In a real application, this would dynamically update challenge details
        // based on the selected challenge type
        console.log('Challenge type changed:', challengeTypeSelect.value);
    }
}
function setupTimers() {
    // Timer functionality code would go here
    console.log('Timers set up');
}
function updateSpectatorActivity() {
    const spectatorCountElements = document.querySelectorAll('.spectator-count');
    if (spectatorCountElements.length > 0) {
        setInterval(() => {
            spectatorCountElements.forEach(el => {
                const text = el.textContent || '';
                const match = text.match(/\d+/);
                if (match) {
                    const currentCount = parseInt(match[0]);
                    // Random increase or decrease by 0, 1, or 2 viewers
                    const change = Math.floor(Math.random() * 5) - 2;
                    const newCount = Math.max(1, currentCount + change);
                    el.innerHTML = `<i class="fas fa-eye me-1"></i> ${newCount} watching`;
                }
            });
        }, 5000);
    }
}
