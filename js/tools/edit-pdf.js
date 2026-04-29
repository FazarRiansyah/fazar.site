/**
 * Super Editor PDF Logic - Advanced Version
 * Handles real-time PDF manipulation, page organization, and rendering.
 */

let editorState = {
    pdfLibDoc: null,
    pdfJsDoc: null,
    currentPage: 1,
    zoom: 1.0,
    pages: [], // Array of page objects { id, originalIndex, rotation }
    container: null
};

async function initPdfEditor(container) {
    editorState.container = container;
    const fileInput = container.querySelector('#edit-pdf-input');
    const uploadArea = container.querySelector('#edit-upload-area');
    
    // Tab Switching
    setupRibbonTabs(container);

    // Upload Logic
    if (uploadArea && fileInput) {
        uploadArea.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                await loadPdfToEditor(file);
            }
        };
    }

    // Connect Buttons
    setupEditorButtons(container);
}

function setupRibbonTabs(container) {
    const tabs = container.querySelectorAll('.ribbon-tab');
    const panels = container.querySelectorAll('.ribbon-panel');

    tabs.forEach(tab => {
        tab.onclick = () => {
            const targetId = tab.getAttribute('data-tab');
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = 'var(--text-muted)';
                t.style.borderBottom = 'none';
            });
            tab.classList.add('active');
            tab.style.color = 'var(--text-main)';
            tab.style.borderBottom = '2px solid var(--primary-blue)';
            
            panels.forEach(p => p.style.display = 'none');
            const panel = container.querySelector(`#${targetId}`);
            if (panel) panel.style.display = 'flex';
        };
    });
}

function setupEditorButtons(container) {
    // Page Manipulation
    container.querySelector('#btn-editor-rotate-cw')?.addEventListener('click', () => rotateActivePage(90));
    container.querySelector('#btn-editor-delete')?.addEventListener('click', () => deleteActivePage());
    
    // Zoom
    container.querySelector('#btn-editor-zoom-in')?.addEventListener('click', () => {
        editorState.zoom += 0.1;
        renderActivePage();
    });
    container.querySelector('#btn-editor-zoom-out')?.addEventListener('click', () => {
        editorState.zoom = Math.max(0.5, editorState.zoom - 0.1);
        renderActivePage();
    });

    // Export
    container.querySelector('#btn-editor-export')?.addEventListener('click', () => exportEditedPdf());
}

async function loadPdfToEditor(file) {
    const container = editorState.container;
    const uploadView = container.querySelector('#pdf-upload-view');
    const editorView = container.querySelector('#pdf-editor-view');
    const fileNameStatus = container.querySelector('#editor-filename-status');

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // 1. Load for manipulation (pdf-lib)
        editorState.pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // 2. Load for rendering (pdf.js)
        editorState.pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // 3. Initialize Page State
        const count = editorState.pdfLibDoc.getPageCount();
        editorState.pages = [];
        for (let i = 0; i < count; i++) {
            editorState.pages.push({ id: Math.random().toString(36).substr(2, 9), index: i });
        }

        // 4. Update UI
        if (uploadView) uploadView.style.display = 'none';
        if (editorView) editorView.style.display = 'flex';
        if (fileNameStatus) fileNameStatus.textContent = file.name;

        editorState.currentPage = 1;
        await refreshEditorUI();

    } catch (err) {
        console.error("Failed to load PDF:", err);
        alert("Gagal memuat file PDF. Pastikan file tidak rusak.");
    }
}

async function refreshEditorUI() {
    await renderThumbnails();
    await renderActivePage();
    updateStatusBar();
}

async function renderThumbnails() {
    const list = editorState.container.querySelector('#editor-thumbnail-list');
    if (!list) return;
    list.innerHTML = '';

    for (let i = 0; i < editorState.pages.length; i++) {
        const pageIdx = editorState.pages[i].index;
        const pageNum = i + 1;
        
        const item = document.createElement('div');
        item.className = `thumbnail-item ${pageNum === editorState.currentPage ? 'active' : ''}`;
        item.onclick = () => {
            editorState.currentPage = pageNum;
            updateActiveThumbnail();
            renderActivePage();
            updateStatusBar();
        };

        const canvas = document.createElement('canvas');
        canvas.className = 'thumbnail-canvas';
        
        // Render small version
        const page = await editorState.pdfJsDoc.getPage(pageIdx + 1);
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        item.appendChild(canvas);
        item.innerHTML += `<span class="thumbnail-number">Halaman ${pageNum}</span>`;
        list.appendChild(item);
    }
}

function updateActiveThumbnail() {
    const items = editorState.container.querySelectorAll('.thumbnail-item');
    items.forEach((item, idx) => {
        if (idx + 1 === editorState.currentPage) item.classList.add('active');
        else item.classList.remove('active');
    });
}

async function renderActivePage() {
    const wrapper = editorState.container.querySelector('#editor-canvas-wrapper');
    const canvas = editorState.container.querySelector('#editor-main-canvas');
    if (!canvas || !editorState.pdfJsDoc) return;

    const pageIdx = editorState.pages[editorState.currentPage - 1].index;
    const page = await editorState.pdfJsDoc.getPage(pageIdx + 1);
    
    const viewport = page.getViewport({ scale: editorState.zoom });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderCtx = canvas.getContext('2d');
    await page.render({ canvasContext: renderCtx, viewport }).promise;
    
    // Update zoom display
    const zoomText = editorState.container.querySelector('#editor-zoom-level');
    if (zoomText) zoomText.textContent = `${Math.round(editorState.zoom * 100)}%`;
}

function updateStatusBar() {
    const status = editorState.container.querySelector('#editor-page-status');
    if (status) status.textContent = `Halaman ${editorState.currentPage} / ${editorState.pages.length}`;
}

async function rotateActivePage(degrees) {
    if (!editorState.pdfLibDoc) return;
    
    const idx = editorState.pages[editorState.currentPage - 1].index;
    const page = editorState.pdfLibDoc.getPage(idx);
    const currentRotation = page.getRotation().angle;
    page.setRotation(PDFLib.degrees(currentRotation + degrees));
    
    // We need to re-generate the pdfJsDoc to show rotation (or handle rotation in viewport)
    // For now, simpler: re-load the bytes
    await syncAndRefresh();
}

async function deleteActivePage() {
    if (editorState.pages.length <= 1) {
        alert("Dokumen harus memiliki setidaknya satu halaman.");
        return;
    }
    
    const confirmDelete = confirm("Hapus halaman ini?");
    if (!confirmDelete) return;

    // We don't delete from pdfLibDoc yet to keep indexing easy, 
    // we just remove from our local `pages` tracking.
    // Actually, it's better to recreate the document on export.
    editorState.pages.splice(editorState.currentPage - 1, 1);
    
    if (editorState.currentPage > editorState.pages.length) {
        editorState.currentPage = editorState.pages.length;
    }
    
    await refreshEditorUI();
}

async function syncAndRefresh() {
    const bytes = await editorState.pdfLibDoc.save();
    editorState.pdfJsDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
    await refreshEditorUI();
}

async function exportEditedPdf() {
    if (!editorState.pdfLibDoc) return;

    const btn = editorState.container.querySelector('#btn-editor-export');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i> Memproses...`;
    btn.disabled = true;

    try {
        // Create new doc based on our `pages` array (handles deletions and reordering)
        const newDoc = await PDFLib.PDFDocument.create();
        const indices = editorState.pages.map(p => p.index);
        const copiedPages = await newDoc.copyPages(editorState.pdfLibDoc, indices);
        
        copiedPages.forEach(p => newDoc.addPage(p));
        
        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `JagaDokumen_Edited_${new Date().getTime()}.pdf`;
        a.click();
        
    } catch (err) {
        console.error("Export failed:", err);
        alert("Gagal mengekspor PDF.");
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}
