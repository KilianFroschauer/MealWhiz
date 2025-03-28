// TypeScript for the CookOff Rules page

document.addEventListener('DOMContentLoaded', (): void => {
    // FAQ toggle functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function(this: HTMLElement): void {
            const answer = this.nextElementSibling as HTMLElement;
            const icon = this.querySelector('i');
            
            if (answer && icon) {
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    answer.style.display = 'block';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            }
        });
    });
});
