/**
 * #JagaDokumen - Tools Catalog Modal Logic
 * Handles the display, search, and navigation of tools from within the editor.
 */

const initCatalogModal = () => {
    const catalogModal = document.getElementById('catalog-modal');
    const catalogBtn = document.getElementById('btn-show-catalog');
    const closeBtn = document.getElementById('btn-close-catalog');
    const catalogGrid = document.getElementById('catalog-grid-content');
    const searchInput = document.getElementById('catalog-search-input');

    if (!catalogModal || !catalogBtn || !catalogGrid) return;

    // 1. Show Modal & Populate
    catalogBtn.addEventListener('click', (e) => {
        e.preventDefault();
        populateCatalog();
        catalogModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // 2. Close Modal
    const closeModal = () => {
        catalogModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
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

            // 4. Handle Tool Selection (New Tab Navigation)
            item.addEventListener('click', () => {
                const toolName = title;
                const url = window.location.origin + window.location.pathname + `?tool=${encodeURIComponent(toolName)}`;
                window.open(url, '_blank');
                closeModal();
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
