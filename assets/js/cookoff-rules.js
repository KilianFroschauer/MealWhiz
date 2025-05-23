"use strict";
// filepath: c:\Users\Samuel\Documents\HTL\SYP\MealWhiz\assets\ts\cookoff-rules.ts
// TypeScript for the CookOff Rules page
document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            if (answer && icon) {
                // Toggle a class on the answer element for display
                answer.classList.toggle('active');
                // Toggle icon classes based on the 'active' state of the answer
                if (answer.classList.contains('active')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                    // Consider setting display block via CSS for .active class
                    answer.style.display = 'block'; // Kept for explicitness if CSS isn't set up for .active
                }
                else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                    answer.style.display = 'none'; // Kept for explicitness
                }
            }
        });
    });
});
/*
Consider adding CSS like:
.faq-answer {
  display: none;
}
.faq-answer.active {
  display: block;
}
*/ 
