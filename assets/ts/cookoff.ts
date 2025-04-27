// TypeScript for the CookOff page

interface CookOffEvent {
    target: HTMLElement;
    preventDefault(): void;
}

document.addEventListener('DOMContentLoaded', (): void => {
    // Find cooking partner button click event
    const findPartnerBtn = document.getElementById('findPartnerBtn');
    if (findPartnerBtn) {
        findPartnerBtn.addEventListener('click', function(): void {
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
        startCompetitionBtn.addEventListener('click', function(): void {
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
                    const challengeType = (document.getElementById('challengeType') as HTMLSelectElement).value;
                    const difficultyLevel = (document.getElementById('difficultyLevel') as HTMLSelectElement).value;
                    const timeLimit = (document.getElementById('timeLimit') as HTMLSelectElement).value;
                    
                    window.location.href = `CookOff-Battle.html?mode=competitive&challenge=${challengeType}&difficulty=${difficultyLevel}&time=${timeLimit}`;
                }, 3000);
            }
        });
    }
    
    // Cancel search buttons
    const cancelButtons = document.querySelectorAll('#cancelSearchBtn, #cancelCompetitionBtn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function(this: HTMLElement, event: Event) {
            const modalId = this.closest('.modal')!.id;
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                hideModal(modalElement);
            }
        });
    });
    
    // Initialize competitive cooking form
    initCompetitiveCookingForm();
});

function hideModal(modalElement: HTMLElement): void {
    try {
        // Use Bootstrap's modal API to hide the modal
        // @ts-ignore - Bootstrap types not available
        const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    } catch (e) {
        console.warn("Error hiding modal:", e);
    }
}

function showModal(modalElement: HTMLElement): void {
    try {
        // Use Bootstrap's modal API to show the modal
        // @ts-ignore - Bootstrap types not available
        const bootstrapModal = new bootstrap.Modal(modalElement);
        bootstrapModal.show();
    } catch (e) {
        console.warn("Error showing modal:", e);
    }
}

function initCompetitiveCookingForm(): void {
    // Ensure the challenge type dropdown has proper event listeners
    const challengeTypeSelect = document.getElementById('challengeType') as HTMLSelectElement;
    if (challengeTypeSelect) {
        challengeTypeSelect.addEventListener('change', updateChallengeDetails);
    }
    
    function updateChallengeDetails(): void {
        // In a real application, this would dynamically update challenge details
        // based on the selected challenge type
        console.log('Challenge type changed:', challengeTypeSelect.value);
    }
}
