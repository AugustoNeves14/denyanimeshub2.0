// Deny Animes Hub - Main JavaScript
// Advanced interactions and animations system

class AkatsukiApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initAnimations();
        this.initScrollEffects();
        this.initParallax();
        this.initMagneticCursor();
        this.initIntersectionObserver();
    }

    setupEventListeners() {
        // Navbar scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', this.handleSmoothScroll.bind(this));
        });
        
        // Search modal
        const searchBtn = document.querySelector('.search-btn');
        const searchModal = document.getElementById('searchModal');
        
        if (searchBtn && searchModal) {
            searchBtn.addEventListener('click', () => this.openSearchModal());
            searchModal.addEventListener('click', (e) => {
                if (e.target === searchModal) this.closeSearchModal();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar-akatsuki');
        const scrollY = window.scrollY;
        
        if (navbar) {
            if (scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        
        // Update scroll position for parallax
        document.documentElement.style.setProperty('--scroll-position', scrollY);
    }

    handleSmoothScroll(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    handleKeyboardShortcuts(e) {
        // Cmd/Ctrl + K to open search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            this.openSearchModal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeSearchModal();
        }
    }

    initAnimations() {
        // Stagger animations for content rails
        const rails = document.querySelectorAll('.rail-container');
        rails.forEach((rail, index) => {
            const cards = rail.querySelectorAll('.anime-card');
            cards.forEach((card, cardIndex) => {
                card.style.animationDelay = `${cardIndex * 0.1}s`;
            });
        });
    }

    initScrollEffects() {
        // Intersection Observer for scroll-triggered animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        // Observe all scroll-reveal elements
        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });
    }

    initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length > 0) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                
                parallaxElements.forEach(element => {
                    const speed = element.dataset.parallax || 0.5;
                    const yPos = -(scrolled * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                });
            });
        }
    }

    initMagneticCursor() {
        const cursor = document.querySelector('.magnetic-cursor');
        
        if (!cursor) return;
        
        const cursorDot = cursor.querySelector('.cursor-dot');
        const cursorRing = cursor.querySelector('.cursor-ring');
        
        let mouseX = 0;
        let mouseY = 0;
        let ringX = 0;
        let ringY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const animateCursor = () => {
            ringX += (mouseX - ringX) * 0.1;
            ringY += (mouseY - ringY) * 0.1;
            
            if (cursorDot) {
                cursorDot.style.left = `${mouseX}px`;
                cursorDot.style.top = `${mouseY}px`;
            }
            
            if (cursorRing) {
                cursorRing.style.left = `${ringX}px`;
                cursorRing.style.top = `${ringY}px`;
            }
            
            requestAnimationFrame(animateCursor);
        };
        
        animateCursor();
        
        // Magnetic effect on interactive elements
        const magneticElements = document.querySelectorAll('[data-magnetic]');
        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        });
    }

    initIntersectionObserver() {
        // Lazy loading for images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    openSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus search input
            setTimeout(() => {
                const searchInput = modal.querySelector('.search-input');
                if (searchInput) searchInput.focus();
            }, 100);
        }
    }

    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.akatsukiApp = new AkatsukiApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AkatsukiApp;
}