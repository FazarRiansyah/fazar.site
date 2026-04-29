/**
 * Super Editor PDF Logic
 * Center for all PDF manipulations
 */

function initPdfEditor(container) {
    const uploadArea = container.querySelector('#edit-upload-area');
    const fileInput = container.querySelector('#edit-pdf-input');
    const uploadView = container.querySelector('#pdf-upload-view');
    const editorView = container.querySelector('#pdf-editor-view');
    
    // UI Elements
    const ribbonTabs = container.querySelectorAll('.ribbon-tab');
    const ribbonPanels = container.querySelectorAll('.ribbon-panel');
    const fileNameStatus = container.querySelector('#editor-filename-status');

    // 1. Ribbon Tab Switching Logic
    ribbonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            
            // Toggle Tabs
            ribbonTabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = 'var(--text-muted)';
                t.style.borderBottom = 'none';
            });
            tab.classList.add('active');
            tab.style.color = 'var(--text-main)';
            tab.style.borderBottom = '2px solid var(--primary-blue)';
            
            // Toggle Panels
            ribbonPanels.forEach(p => p.style.display = 'none');
            const targetPanel = container.querySelector(`#${targetId}`);
            if (targetPanel) targetPanel.style.display = 'flex';
        });
    });

    // 2. File Upload Handling
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file || file.type !== 'application/pdf') return;
            
            // Switch View
            uploadView.style.display = 'none';
            editorView.style.display = 'flex';
            
            // Update Status
            if (fileNameStatus) fileNameStatus.textContent = file.name;
            
            // Placeholder for PDF Rendering Logic
            console.log("PDF Editor: File loaded", file.name);
            renderThumbnailsPlaceholder(container);
        });
    }

    // 3. Export Logic (Stub)
    const exportBtn = container.querySelector('#btn-editor-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Fitur Simpan & Ekspor akan segera hadir di Super Editor ini!');
        });
    }
}

/**
 * Temporary Placeholder for Thumbnails
 */
function renderThumbnailsPlaceholder(container) {
    const list = container.querySelector('#editor-thumbnail-list');
    if (!list) return;
    
    list.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        const item = document.createElement('div');
        item.className = `thumbnail-item ${i === 1 ? 'active' : ''}`;
        item.innerHTML = `
            <div class="thumbnail-canvas" style="height: 120px; display: flex; align-items: center; justify-content: center; background: #eee; color: #999;">
                <i class="ph ph-file-pdf" style="font-size: 40px;"></i>
            </div>
            <span class="thumbnail-number">Halaman ${i}</span>
        `;
        list.appendChild(item);
    }
}
