// Main TypeScript file for general functionalities

// Spinner functionality
document.addEventListener('DOMContentLoaded', (): void => {
    const spinner = (): void => {
        setTimeout((): void => {
            const spinnerElement = document.getElementById('spinner');
            if (spinnerElement && spinnerElement.classList.contains('show')) {
                spinnerElement.classList.remove('show');
            }
        }, 1);
    };
    spinner();

    // Fixed Navbar
    window.addEventListener('scroll', (): void => {
        if (window.innerWidth < 992) {
            if (window.scrollY > 55) {
                document.querySelector('.fixed-top')?.classList.add('shadow');
            } else {
                document.querySelector('.fixed-top')?.classList.remove('shadow');
            }
        } else {
            if (window.scrollY > 55) {
                const fixedTop = document.querySelector('.fixed-top') as HTMLElement;
                fixedTop?.classList.add('shadow');
                if (fixedTop) fixedTop.style.top = '-5px';
            } else {
                const fixedTop = document.querySelector('.fixed-top') as HTMLElement;
                fixedTop?.classList.remove('shadow');
                if (fixedTop) fixedTop.style.top = '0';
            }
        }
    });

    // Back to top button
    window.addEventListener('scroll', (): void => {
        if (window.scrollY > 300) {
            document.querySelector('.back-to-top')?.classList.add('fadeIn');
        } else {
            document.querySelector('.back-to-top')?.classList.remove('fadeIn');
        }
    });

    const backToTopButtons = document.querySelectorAll('.back-to-top');
    backToTopButtons.forEach((btn) => {
        btn.addEventListener('click', (e): void => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Testimonial carousel
    initCarousels();

    // Product Quantity
    const quantityButtons = document.querySelectorAll('.quantity button');
    quantityButtons.forEach((button) => {
        button.addEventListener('click', function(this: HTMLElement): void {
            const inputElement = this.parentElement?.parentElement?.querySelector('input') as HTMLInputElement;
            if (!inputElement) return;
            
            let oldValue = parseFloat(inputElement.value);
            let newVal: number;
            
            if (this.classList.contains('btn-plus')) {
                newVal = parseFloat(oldValue.toString()) + 1;
            } else {
                if (oldValue > 0) {
                    newVal = parseFloat(oldValue.toString()) - 1;
                } else {
                    newVal = 0;
                }
            }
            
            inputElement.value = newVal.toString();
        });
    });
});

// Initialize carousels
function initCarousels(): void {
    // This is where we would initialize owl carousel
    // Since we want to remove jQuery dependencies, we would replace the jQuery code
    // with vanilla JS or use a TypeScript compatible carousel library

    // For now, we'll just add a comment as a placeholder
    console.log('Carousels should be initialized here');
    
    // When implementing a carousel in vanilla JS, you'll need to handle all the
    // functionality that owl.carousel.js provided, or use a different library
}
