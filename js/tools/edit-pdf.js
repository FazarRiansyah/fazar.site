/**
 * Super Editor PDF Logic - Advanced Version
 * Handles multi-file merging, batch page selection, and content insertion (Watermark/Page Numbers).
 */

let editorState = {
    pdfLibDoc: null,
    pdfJsDoc: null,
    currentPage: 1,
    zoom: 1.0,
    pages: [], // Array of page objects { id, originalIndex, rotation, isSelected, docIndex }
    docs: [], // Array of loaded pdfLibDocs
    container: null
};

async function initPdfEditor(container) {
    editorState.container = container;
    const fileInput = container.querySelector('#edit-pdf-input');
    const uploadArea = container.querySelector('#edit-upload-area');
    
    // Tab Switching
    setupRibbonTabs(container);

    // Initial Upload Logic
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
    
    // Setup Additional File Input (for Merge/Add File)
    const addFileInput = document.createElement('input');
    addFileInput.type = 'file';
    addFileInput.accept = 'application/pdf';
    addFileInput.id = 'editor-add-file-input';
    addFileInput.style.display = 'none';
    addFileInput.onchange = (e) => handleAddFile(e.target.files[0]);
    document.body.appendChild(addFileInput);
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
    // Organisir
    container.querySelector('#btn-editor-merge')?.addEventListener('click', () => document.getElementById('editor-add-file-input').click());
    container.querySelector('#btn-editor-rotate-cw')?.addEventListener('click', () => rotateActivePage(90));
    container.querySelector('#btn-editor-delete')?.addEventListener('click', () => deleteSelectedPages());
    container.querySelector('#btn-editor-split')?.addEventListener('click', () => extractSelectedPages());
    
    // Sisipkan
    container.querySelector('#btn-editor-page-nums')?.addEventListener('click', () => addPageNumbers());
    container.querySelector('#btn-editor-watermark')?.addEventListener('click', () => addWatermark());

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
        
        // Load for manipulation
        const doc = await PDFLib.PDFDocument.load(arrayBuffer);
        editorState.docs = [doc];
        
        // Initialize Page State
        const count = doc.getPageCount();
        editorState.pages = [];
        for (let i = 0; i < count; i++) {
            editorState.pages.push({ 
                id: Math.random().toString(36).substr(2, 9), 
                docIndex: 0, 
                index: i,
                isSelected: false 
            });
        }

        // Update UI
        if (uploadView) uploadView.style.display = 'none';
        if (editorView) editorView.style.display = 'flex';
        if (fileNameStatus) fileNameStatus.textContent = file.name;

        editorState.currentPage = 1;
        await syncAndRefresh();

    } catch (err) {
        console.error("Failed to load PDF:", err);
        alert("Gagal memuat file PDF.");
    }
}

async function handleAddFile(file) {
    if (!file || !editorState.docs.length) return;
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const newDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const docIndex = editorState.docs.length;
        editorState.docs.push(newDoc);
        
        const count = newDoc.getPageCount();
        for (let i = 0; i < count; i++) {
            editorState.pages.push({ 
                id: Math.random().toString(36).substr(2, 9), 
                docIndex: docIndex, 
                index: i,
                isSelected: false 
            });
        }
        
        await syncAndRefresh();
        alert(`${file.name} berhasil ditambahkan!`);
        
    } catch (err) {
        console.error("Add file failed:", err);
        alert("Gagal menambahkan file.");
    }
}

async function syncAndRefresh() {
    // Generate combined PDF for pdf.js to render
    const combinedDoc = await PDFLib.PDFDocument.create();
    for (const p of editorState.pages) {
        const [copiedPage] = await combinedDoc.copyPages(editorState.docs[p.docIndex], [p.index]);
        combinedDoc.addPage(copiedPage);
    }
    
    const bytes = await combinedDoc.save();
    editorState.pdfJsDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
    
    await refreshEditorUI();
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
        const pageNum = i + 1;
        const pageData = editorState.pages[i];
        
        const item = document.createElement('div');
        item.className = `thumbnail-item ${pageNum === editorState.currentPage ? 'active' : ''} ${pageData.isSelected ? 'selected' : ''}`;
        
        // Thumbnail Selection Checkbox Area
        const selectBadge = document.createElement('div');
        selectBadge.className = 'select-badge';
        selectBadge.style.cssText = `
            position: absolute; top: 5px; right: 5px; width: 20px; height: 20px;
            border-radius: 50%; border: 2px solid #fff; background: ${pageData.isSelected ? 'var(--primary-blue)' : 'rgba(0,0,0,0.2)'};
            z-index: 5; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;
        `;
        if (pageData.isSelected) selectBadge.innerHTML = '<i class="ph-bold ph-check"></i>';
        
        selectBadge.onclick = (e) => {
            e.stopPropagation();
            pageData.isSelected = !pageData.isSelected;
            renderThumbnails();
        };

        item.onclick = () => {
            editorState.currentPage = pageNum;
            updateActiveThumbnail();
            renderActivePage();
            updateStatusBar();
        };

        const canvas = document.createElement('canvas');
        canvas.className = 'thumbnail-canvas';
        
        // Render from combined pdfJsDoc
        const page = await editorState.pdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        item.appendChild(selectBadge);
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
    const canvas = editorState.container.querySelector('#editor-main-canvas');
    if (!canvas || !editorState.pdfJsDoc) return;

    const page = await editorState.pdfJsDoc.getPage(editorState.currentPage);
    const viewport = page.getViewport({ scale: editorState.zoom });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderCtx = canvas.getContext('2d');
    await page.render({ canvasContext: renderCtx, viewport }).promise;
    
    const zoomText = editorState.container.querySelector('#editor-zoom-level');
    if (zoomText) zoomText.textContent = `${Math.round(editorState.zoom * 100)}%`;
}

function updateStatusBar() {
    const status = editorState.container.querySelector('#editor-page-status');
    if (status) status.textContent = `Halaman ${editorState.currentPage} / ${editorState.pages.length}`;
}

async function rotateActivePage(degrees) {
    const pageData = editorState.pages[editorState.currentPage - 1];
    const page = editorState.docs[pageData.docIndex].getPage(pageData.index);
    const currentRotation = page.getRotation().angle;
    page.setRotation(PDFLib.degrees(currentRotation + degrees));
    
    await syncAndRefresh();
}

async function deleteSelectedPages() {
    const selected = editorState.pages.filter(p => p.isSelected);
    if (!selected.length) {
        const confirmDelete = confirm(`Hapus halaman ${editorState.currentPage}?`);
        if (confirmDelete) {
            editorState.pages.splice(editorState.currentPage - 1, 1);
            if (editorState.currentPage > editorState.pages.length) editorState.currentPage = editorState.pages.length;
            await syncAndRefresh();
        }
        return;
    }

    if (confirm(`Hapus ${selected.length} halaman terpilih?`)) {
        editorState.pages = editorState.pages.filter(p => !p.isSelected);
        editorState.currentPage = 1;
        await syncAndRefresh();
    }
}

async function extractSelectedPages() {
    const selected = editorState.pages.filter(p => p.isSelected);
    if (!selected.length) {
        alert("Pilih halaman di sidebar (klik lingkaran kecil) untuk diekstrak.");
        return;
    }

    try {
        const newDoc = await PDFLib.PDFDocument.create();
        for (const p of selected) {
            const [copiedPage] = await newDoc.copyPages(editorState.docs[p.docIndex], [p.index]);
            newDoc.addPage(copiedPage);
        }
        const bytes = await newDoc.save();
        downloadBlob(bytes, `Extracted_Pages_${new Date().getTime()}.pdf`);
    } catch (err) {
        alert("Gagal mengekstrak halaman.");
    }
}

async function addPageNumbers() {
    if (!editorState.docs.length) return;
    
    const confirmNum = confirm("Tambahkan nomor halaman di bagian bawah setiap halaman?");
    if (!confirmNum) return;

    try {
        for (let i = 0; i < editorState.pages.length; i++) {
            const p = editorState.pages[i];
            const page = editorState.docs[p.docIndex].getPage(p.index);
            const { width, height } = page.getSize();
            const text = `Halaman ${i + 1} dari ${editorState.pages.length}`;
            
            page.drawText(text, {
                x: width / 2 - 40,
                y: 20,
                size: 10,
                color: PDFLib.rgb(0.5, 0.5, 0.5)
            });
        }
        await syncAndRefresh();
        alert("Nomor halaman berhasil ditambahkan!");
    } catch (err) {
        alert("Gagal menambahkan nomor halaman.");
    }
}

async function addWatermark() {
    const text = prompt("Masukkan teks untuk Watermark (Contoh: RAHASIA, DRAFT, MILIK NEGARA):", "RAHASIA");
    if (!text) return;

    try {
        for (let i = 0; i < editorState.pages.length; i++) {
            const p = editorState.pages[i];
            const page = editorState.docs[p.docIndex].getPage(p.index);
            const { width, height } = page.getSize();
            
            page.drawText(text, {
                x: width / 4,
                y: height / 2,
                size: 50,
                rotate: PDFLib.degrees(45),
                opacity: 0.2,
                color: PDFLib.rgb(0.7, 0, 0)
            });
        }
        await syncAndRefresh();
        alert("Watermark berhasil ditambahkan!");
    } catch (err) {
        alert("Gagal menambahkan watermark.");
    }
}

async function exportEditedPdf() {
    if (!editorState.pages.length) return;
    const btn = editorState.container.querySelector('#btn-editor-export');
    btn.disabled = true;

    try {
        const finalDoc = await PDFLib.PDFDocument.create();
        for (const p of editorState.pages) {
            const [copiedPage] = await finalDoc.copyPages(editorState.docs[p.docIndex], [p.index]);
            finalDoc.addPage(copiedPage);
        }
        const bytes = await finalDoc.save();
        downloadBlob(bytes, `JagaDokumen_Pro_${new Date().getTime()}.pdf`);
    } catch (err) {
        alert("Gagal menyimpan PDF.");
    } finally {
        btn.disabled = false;
    }
}

function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}
