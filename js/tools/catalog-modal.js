/**
 * #JagaDokumen - Tools Catalog Modal Logic (Integrated Version)
 * Handles the display, search, and local execution of tools within a modal popup.
 */

// Global helper to trigger a tool locally in a modal
const triggerTool = (toolName) => {
    const catalogModal = document.getElementById('catalog-modal');
    if (!catalogModal) return;

    // Show modal
    catalogModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Switch to Tool View within Modal
    const catalogContent = document.getElementById('catalog-grid-content');
    const searchWrapper = document.querySelector('.catalog-search-wrapper');
    const modalTitle = document.querySelector('.catalog-modal-header h3');
    const closeBtn = document.getElementById('btn-close-catalog');

    if (!catalogContent) return;

    // Save original catalog state if needed or just clear it
    searchWrapper.style.display = 'none';
    modalTitle.innerHTML = `<button id="btn-catalog-back" style="background:none; border:none; color:var(--primary-blue); cursor:pointer; margin-right:10px;"><i class="ph ph-arrow-left"></i></button> ${toolName}`;
    
    // Inject Tool Template
    catalogContent.innerHTML = `
        <div id="modal-tool-container" style="padding: 20px; min-height: 300px; animation: fadeIn 0.3s ease;">
            <div class="shimmer-loading-container" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="shimmer" style="height: 150px; border-radius: 18px;"></div>
                <div class="shimmer" style="height: 60px; border-radius: 12px;"></div>
            </div>
        </div>
    `;

    // Map tool names to templates and init functions
    const toolMap = {
        'Edit PDF': { tpl: 'tpl-edit-pdf', init: typeof initPdfEditor !== 'undefined' ? initPdfEditor : null },
        'Gabungkan PDF': { tpl: 'tpl-merge-pdf', init: typeof initMergePdf !== 'undefined' ? initMergePdf : null },
        'Pisahkan PDF': { tpl: 'tpl-split-pdf', init: typeof initSplitPdf !== 'undefined' ? initSplitPdf : null },
        'Putar Halaman PDF': { tpl: 'tpl-rotate-pdf', init: typeof initRotatePdf !== 'undefined' ? initRotatePdf : null },
        'Hapus Halaman PDF': { tpl: 'tpl-delete-pages', init: typeof initDeletePages !== 'undefined' ? initDeletePages : null },
        'Ganti Halaman PDF': { tpl: 'tpl-replace-pages', init: typeof initReplacePages !== 'undefined' ? initReplacePages : null },
        'Nomor Halaman PDF': { tpl: 'tpl-page-numbers', init: typeof initPageNumbers !== 'undefined' ? initPageNumbers : null },
        'Kompres PDF': { tpl: 'tpl-compress-pdf', init: typeof initCompressPdf !== 'undefined' ? initCompressPdf : null },
        'PDF to Text': { tpl: 'tpl-pdf-to-text', init: typeof initPdfToText !== 'undefined' ? initPdfToText : null },
        'Gambar ke PDF': { tpl: 'tpl-image-to-pdf', init: typeof initImageToPdf !== 'undefined' ? initImageToPdf : null },
        'PDF ke Gambar': { tpl: 'tpl-pdf-to-img', init: typeof initPdfToImg !== 'undefined' ? initPdfToImg : null },
        'Kompres Gambar': { tpl: 'tpl-compress-image', init: typeof initCompressImage !== 'undefined' ? initCompressImage : null },
        'Resize Gambar': { tpl: 'tpl-resize-image', init: typeof initResizeImage !== 'undefined' ? initResizeImage : null },
        'Konversi Gambar': { tpl: 'tpl-convert-image', init: typeof initConvertImage !== 'undefined' ? initConvertImage : null }
    };

    const tool = toolMap[toolName];
    
    setTimeout(() => {
        const container = document.getElementById('modal-tool-container');
        if (tool && container) {
            const tpl = document.getElementById(tool.tpl);
            if (tpl) {
                container.innerHTML = '';
                container.appendChild(tpl.content.cloneNode(true));
                if (typeof tool.init === 'function') {
                    // Initialize the tool UI
                    setTimeout(() => tool.init(container), 50);
                }
            } else {
                container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">Antarmuka alat "${toolName}" belum tersedia di tab ini.</div>`;
            }
        } else if (container) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">Alat "${toolName}" tidak ditemukan.</div>`;
        }
        
        // Setup Back Button
        document.getElementById('btn-catalog-back')?.addEventListener('click', () => {
            initCatalogModal(); // Re-init to show grid
            const catalogBtn = document.getElementById('btn-show-catalog');
            if (catalogBtn) catalogBtn.click();
        });
    }, 600);
};

const initCatalogModal = () => {
    const catalogModal = document.getElementById('catalog-modal');
    const catalogBtn = document.getElementById('btn-show-catalog');
    const closeBtn = document.getElementById('btn-close-catalog');
    const catalogGrid = document.getElementById('catalog-grid-content');
    const searchInput = document.getElementById('catalog-search-input');
    const searchWrapper = document.querySelector('.catalog-search-wrapper');
    const modalTitle = document.querySelector('.catalog-modal-header h3');

    if (!catalogModal || !catalogBtn || !catalogGrid) return;

    // Reset Modal UI to Grid View
    const resetToGrid = () => {
        if (searchWrapper) searchWrapper.style.display = 'flex';
        if (modalTitle) modalTitle.innerHTML = `<i class="ph-bold ph-toolbox"></i> Katalog Semua Alat`;
        populateCatalog();
    };

    // 1. Show Modal & Populate
    catalogBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetToGrid();
        catalogModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // 2. Close Modal
    const closeModal = () => {
        catalogModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    catalogModal.addEventListener('click', (e) => {
        if (e.target === catalogModal) closeModal();
    });

    // 3. Populate Catalog from Main Dashboard Cards
    const populateCatalog = () => {
        const toolCards = document.querySelectorAll('#dashboard-view .tool-card');
        catalogGrid.innerHTML = '';

        toolCards.forEach(card => {
            const h3 = card.querySelector('h3');
            const desc = card.querySelector('p');
            const icon = card.querySelector('.tool-icon');
            
            if (!h3 || !icon) return;

            const title = h3.textContent.trim();
            const description = desc ? desc.textContent.trim() : '';
            const iconHtml = icon.innerHTML;

            const item = document.createElement('div');
            item.className = 'catalog-item';
            item.innerHTML = `
                <div class="catalog-item-icon">${iconHtml}</div>
                <div class="catalog-item-info">
                    <h4>${title}</h4>
                    <p>${description}</p>
                </div>
            `;

            // 4. Handle Tool Selection
            item.addEventListener('click', () => {
                triggerTool(title);
            });

            catalogGrid.appendChild(item);
        });
    };

    // 5. Search Filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = catalogGrid.querySelectorAll('.catalog-item');
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCatalogModal);
