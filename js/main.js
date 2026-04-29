/**
 * #JagaDokumen - Main Application Logic
 * Optimized for cinematic transitions and stable SPA navigation.
 */

// Safe initialization
const initApp = () => {
    try { initSearch(); } catch(e) { console.error("Search init failed", e); }
    try { initThemeToggle(); } catch(e) { console.error("Theme init failed", e); }
    try { initModal(); } catch(e) { console.error("Modal init failed", e); }
    try { initStats(); } catch(e) { console.error("Stats init failed", e); }
    try { initViewSwitching(); } catch(e) { console.error("View switching init failed", e); }
    try { initReveal(); } catch(e) { console.error("Reveal init failed", e); }
    try { initScrollProgress(); } catch(e) { console.error("Scroll progress failed", e); }
    try { initKeyboardShortcuts(); } catch(e) { console.error("Shortcuts init failed", e); }
    try { initProVisuals(); } catch(e) { console.error("Pro Visuals failed", e); }
    try { initPreloader(); } catch(e) { console.error("Preloader failed", e); }
    
    // Auto-open tool from URL parameter (?tool=Name)
    try { handleUrlParams(); } catch(e) { console.error("URL Params failed", e); }

    // How it works listener
    const howBtn = document.getElementById('btn-how-it-works');
    if (howBtn) {
        howBtn.addEventListener('click', () => {
            const modal = document.getElementById('toolModal');
            if (!modal) return;
            
            const modalTitle = document.getElementById('modalTitle');
            const modalCategory = document.getElementById('modalCategory');
            const modalIcon = document.getElementById('modalIcon');
            const modalBody = document.getElementById('modalBody');

            if (modalTitle) modalTitle.textContent = 'Cara Kerja #JagaDokumen';
            if (modalCategory) modalCategory.innerHTML = '<span class="modal-subtitle-clean">Transparansi penuh tentang keamanan Anda</span>';
            if (modalIcon) modalIcon.innerHTML = '<div style="width:100%;height:100%;background:var(--primary-gradient);color:white;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 12px rgba(0, 122, 255, 0.3);"><i class="ph-light ph-shield-check"></i></div>';
            
            if (modalBody) {
                modalBody.innerHTML = '';
                const tpl = document.getElementById('tpl-how-it-works');
                if (tpl) modalBody.appendChild(tpl.content.cloneNode(true));
            }

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }

    // Start Now listener
    const startBtn = document.getElementById('btn-start-now');
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('tools-section-anchor');
            if (target) {
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
            }
        });
    }
};

const initPreloader = () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    // Minimum display time for the premium feel (1.5s)
    const minTime = 1500;
    const startTime = Date.now();

    window.addEventListener('load', () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minTime - elapsedTime);

        setTimeout(() => {
            preloader.classList.add('fade-out');
            
            // Remove from DOM after transition
            setTimeout(() => {
                preloader.remove();
            }, 800);
        }, remainingTime);
    });

    // Safety timeout (3s)
    setTimeout(() => {
        if (document.getElementById('preloader')) {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.remove(), 800);
        }
    }, 3000);
};

const initProVisuals = () => {
    console.log("Initializing Pro Visuals (Mesh BG, Mouse Glow, Adaptive Nav)...");
    // 1. Mouse Glow Tracker
    window.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.tool-card, .stat-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // 2. Adaptive Navbar (Removed per user request)
};

// Run on ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initViewSwitching() {
    const dashboardView = document.getElementById('dashboard-view');
    const toolView = document.getElementById('tool-view');
    const toolCards = document.querySelectorAll('.tool-card');
    const backBtn = document.getElementById('btn-back-dashboard');
    const toolViewTitle = document.getElementById('toolViewTitle');
    const toolViewCategory = document.getElementById('toolViewCategory');
    const toolViewIcon = document.getElementById('toolViewIcon');
    const toolViewBody = document.getElementById('toolViewBody');
    const siteFooter = document.querySelector('.site-footer');

    if (!dashboardView || !toolView) return;

    const switchToTool = (card) => {
        try {
            const h3 = card.querySelector('h3');
            const type = card.querySelector('.tool-type');
            const icon = card.querySelector('.tool-icon');
            if (!h3 || !type || !icon) return;

            const title = h3.textContent.trim();
            const category = type.textContent.trim();
            const iconHtml = icon.innerHTML;

            // Phase 1: Exit Dashboard
            dashboardView.classList.add('view-exit');
            
            setTimeout(() => {
                try {
                    // Phase 2: Swap Views
                    dashboardView.style.display = 'none';
                    dashboardView.classList.remove('view-exit');
                    
                    // Populate UI
                    if (toolViewTitle) toolViewTitle.textContent = title;
                    if (toolViewCategory) toolViewCategory.textContent = category;
                    if (toolViewIcon) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = iconHtml;
                        toolViewIcon.innerHTML = (tempDiv.querySelector('i') || tempDiv).outerHTML;
                    }

                    // Inject Shimmer Loading (The "Pro" Touch)
                    if (toolViewBody) {
                        toolViewBody.innerHTML = `
                            <div class="shimmer-loading-container" style="padding: 40px; display: flex; flex-direction: column; gap: 24px;">
                                <div class="shimmer" style="height: 200px; border-radius: 24px; width: 100%;"></div>
                                <div style="display: flex; gap: 20px;">
                                    <div class="shimmer" style="height: 100px; border-radius: 18px; flex: 1;"></div>
                                    <div class="shimmer" style="height: 100px; border-radius: 18px; flex: 1;"></div>
                                </div>
                                <div class="shimmer" style="height: 300px; border-radius: 24px; width: 100%;"></div>
                            </div>
                        `;
                    }

                    // Reveal Tool View with Shimmer
                    toolView.style.display = 'block';
                    toolView.classList.add('view-enter');
                    window.scrollTo(0, 0);

                    if (siteFooter) siteFooter.style.cssText = 'display:none !important';

                    // Phase 3: Final Content Injection after Shimmer
                    setTimeout(() => {
                        if (toolViewBody) {
                            toolViewBody.innerHTML = '';
                            let found = false;
                            const inject = (tplId, initFn) => {
                                const tpl = document.getElementById(tplId);
                                if (tpl) {
                                    toolViewBody.appendChild(tpl.content.cloneNode(true));
                                    if (typeof initFn === 'function') setTimeout(() => initFn(toolViewBody), 50);
                                    found = true;
                                    return true;
                                }
                                return false;
                            };

                            if (title === 'Edit PDF') found = inject('tpl-edit-pdf', typeof initPdfEditor !== 'undefined' ? initPdfEditor : null);
                            else if (title === 'Gabungkan PDF') found = inject('tpl-merge-pdf', typeof initMergePdf !== 'undefined' ? initMergePdf : null);
                            else if (title === 'Pisahkan PDF') found = inject('tpl-split-pdf', typeof initSplitPdf !== 'undefined' ? initSplitPdf : null);
                            else if (title === 'Hapus Halaman PDF') found = inject('tpl-delete-pages', typeof initDeletePages !== 'undefined' ? initDeletePages : null);
                            else if (title === 'Ganti Halaman PDF') found = inject('tpl-replace-pages', typeof initReplacePages !== 'undefined' ? initReplacePages : null);
                            else if (title === 'Putar Halaman PDF') found = inject('tpl-rotate-pdf', typeof initRotatePdf !== 'undefined' ? initRotatePdf : null);
                            else if (title === 'Gambar ke PDF') found = inject('tpl-image-to-pdf', typeof initImageToPdf !== 'undefined' ? initImageToPdf : null);
                            else if (title === 'PDF ke Gambar') found = inject('tpl-pdf-to-img', typeof initPdfToImg !== 'undefined' ? initPdfToImg : null);
                            else if (title === 'PDF to Text') found = inject('tpl-pdf-to-text', typeof initPdfToText !== 'undefined' ? initPdfToText : null);
                            else if (title === 'Kompres Gambar') found = inject('tpl-compress-image', typeof initCompressImg !== 'undefined' ? initCompressImg : null);
                            else if (title === 'Resize Gambar') found = inject('tpl-resize-image', typeof initResizeImg !== 'undefined' ? initResizeImg : null);
                            else if (title === 'Konversi Gambar') found = inject('tpl-convert-image', typeof initConvertImg !== 'undefined' ? initConvertImg : null);
                            else if (title === 'Kompres PDF') found = inject('tpl-compress-pdf', typeof initCompressPdf !== 'undefined' ? initCompressPdf : null);
                            else if (title === 'Nomor Halaman PDF') found = inject('tpl-page-numbers', typeof initPageNumbers !== 'undefined' ? initPageNumbers : null);

                            if (!found) {
                                toolViewBody.innerHTML = `<div class="tool-placeholder" style="text-align:center;padding:100px 20px;"><div class="placeholder-icon" style="font-size:80px;color:var(--primary-blue);margin-bottom:24px;opacity:0.8;"><i class="ph-fill ph-rocket-launch"></i></div><h2 style="font-size:2rem;color:var(--text-main);margin-bottom:16px;">Fitur Sedang Disiapkan!</h2><p style="color:var(--text-muted);max-width:500px;margin:0 auto;line-height:1.6;font-size:1.1rem;">Kami sedang meracik fitur <strong>${title}</strong> ini agar memberikan pengalaman terbaik untuk Anda.</p></div>`;
                            }
                        }
                        toolView.classList.remove('view-enter');
                    }, 400); // Premium Shimmer Duration

                } catch(err) {
                    console.error("Transition internal error", err);
                    toolView.style.display = 'block';
                }
            }, 350);
        } catch(e) {
            console.error("Switch to tool failed", e);
            dashboardView.style.display = 'none';
            toolView.style.display = 'block';
        }
    };

    toolCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            if (!card.classList.contains('maintenance')) switchToTool(card);
        });
        const btn = card.querySelector('.btn-tool');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                switchToTool(card);
            });
        }
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            toolView.classList.add('view-exit');
            setTimeout(() => {
                toolView.style.display = 'none';
                toolView.classList.remove('view-exit');
                
                dashboardView.style.display = 'block';
                dashboardView.classList.add('view-enter');
                
                if (siteFooter) siteFooter.style.cssText = '';
                
                setTimeout(() => {
                    dashboardView.classList.remove('view-enter');
                    const target = document.getElementById('tools-section-anchor');
                    if (target) {
                        const headerOffset = 100;
                        const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
                    }
                }, 600);
            }, 350);
        });
    }
}

function initSearch() {
    const trigger = document.getElementById('searchInputTrigger');
    const overlay = document.getElementById('search-overlay');
    const modalInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('search-results-list');
    const toolCards = document.querySelectorAll('.tool-card');

    if (!trigger || !overlay || !modalInput || !resultsList) return;

    const openSearch = () => {
        overlay.style.display = 'flex';
        modalInput.focus();
        document.body.style.overflow = 'hidden';
        renderResults('');
    };

    const closeSearch = () => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        modalInput.value = '';
    };

    trigger.addEventListener('click', openSearch);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    modalInput.addEventListener('input', (e) => {
        renderResults(e.target.value.toLowerCase());
    });

    // Handle Keyboard Navigation in Results
    let selectedIndex = -1;
    modalInput.addEventListener('keydown', (e) => {
        const items = resultsList.querySelectorAll('.search-result-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            items[selectedIndex].click();
        }
    });

    const updateSelection = (items) => {
        items.forEach((item, idx) => {
            item.classList.toggle('selected', idx === selectedIndex);
            if (idx === selectedIndex) item.scrollIntoView({ block: 'nearest' });
        });
    };

    const renderResults = (term) => {
        resultsList.innerHTML = '';
        selectedIndex = -1;
        let found = 0;

        toolCards.forEach(card => {
            if (card.classList.contains('maintenance')) return;
            const h3 = card.querySelector('h3');
            const p = card.querySelector('.tool-card-body p');
            const icon = card.querySelector('.tool-icon');
            
            if (!h3) return;
            const title = h3.textContent;
            const desc = p ? p.textContent : '';
            
            if (title.toLowerCase().includes(term) || desc.toLowerCase().includes(term)) {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="result-icon">${icon.innerHTML}</div>
                    <div class="result-info">
                        <h4>${title}</h4>
                        <p>${desc.substring(0, 60)}...</p>
                    </div>
                `;
                item.addEventListener('click', () => {
                    closeSearch();
                    card.click();
                });
                resultsList.appendChild(item);
                found++;
            }
        });

        if (found === 0) {
            resultsList.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);">Tidak ada hasil untuk "${term}"</div>`;
        }
    };

    // Public API for keyboard shortcuts
    window.openGlobalSearch = openSearch;
    window.closeGlobalSearch = closeSearch;
}

function initThemeToggle() {
    const toggleBtn = document.querySelector('.theme-toggle');
    if (!toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const body = document.body;
        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');
        
        if (root.hasAttribute('data-theme')) {
            root.removeAttribute('data-theme');
            body.removeAttribute('data-theme');
            if (icon) icon.className = 'ph-fill ph-moon';
            if (text) text.textContent = 'Mode Gelap';
            localStorage.setItem('theme', 'light');
        } else {
            root.setAttribute('data-theme', 'dark');
            body.setAttribute('data-theme', 'dark');
            if (icon) icon.className = 'ph-fill ph-sun';
            if (text) text.textContent = 'Mode Terang';
            localStorage.setItem('theme', 'dark');
        }
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
        const icon = toggleBtn.querySelector('i');
        const text = toggleBtn.querySelector('span');
        if (icon) icon.className = 'ph-fill ph-sun';
        if (text) text.textContent = 'Mode Terang';
    }
}

function initStats() {
    const toolCards = document.querySelectorAll('.tool-card');
    const statsToolCount = document.getElementById('stat-tool-count');
    if (statsToolCount) statsToolCount.textContent = toolCards.length;
}

function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
}

function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });
}

function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (window.openGlobalSearch) window.openGlobalSearch();
        }
        if (e.key === 'Escape') {
            if (window.closeGlobalSearch) window.closeGlobalSearch();
            const backBtn = document.getElementById('btn-back-dashboard');
            const toolView = document.getElementById('tool-view');
            if (toolView && toolView.style.display === 'block' && backBtn) backBtn.click();
            const modal = document.getElementById('toolModal');
            const closeBtn = document.getElementById('closeModal');
            if (modal && modal.style.display === 'flex' && closeBtn) closeBtn.click();
        }
    });
}


function initModal() {
    const modal = document.getElementById('toolModal');
    const closeBtn = document.getElementById('closeModal');
    if (!modal || !closeBtn) return;
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}
function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const toolToOpen = params.get('tool');
    if (toolToOpen) {
        // Wait a bit for everything to be ready
        setTimeout(() => {
            const cards = document.querySelectorAll('.tool-card');
            const targetCard = Array.from(cards).find(card => {
                const title = card.querySelector('h3');
                return title && title.textContent.trim().toLowerCase() === toolToOpen.toLowerCase();
            });

            if (targetCard) {
                const btn = targetCard.querySelector('.btn-tool');
                if (btn) {
                    btn.click();
                    // Clean up URL to prevent repeat on refresh
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        }, 1000);
    }
}
