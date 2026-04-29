/**
 * Super Editor PDF Logic - Multi-Tab Professional Version
 */

let editorState = {
    docs: [], // Array of { name, pdfLibDoc, pdfJsDoc, pages, currentPage, zoom }
    activeDocIndex: -1,
    container: null
};

async function initPdfEditor(container) {
    editorState.container = container;
    const fileInput = container.querySelector('#edit-pdf-input');
    const uploadArea = container.querySelector('#edit-upload-area');
    
    setupRibbonTabs(container);
    setupEditorButtons(container);

    // Initial Upload
    if (uploadArea && fileInput) {
        uploadArea.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                await openNewDocument(file);
            }
        };
    }

    // New Tab Button
    container.querySelector('#btn-editor-new-tab')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => openNewDocument(e.target.files[0]);
        input.click();
    });
}

async function openNewDocument(file) {
    if (!file) return;
    
    const container = editorState.container;
    const uploadView = container.querySelector('#pdf-upload-view');
    const editorView = container.querySelector('#pdf-editor-view');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const pageCount = pdfLibDoc.getPageCount();
        const pages = [];
        for (let i = 0; i < pageCount; i++) {
            pages.push({ id: Math.random().toString(36).substr(2, 9), index: i, isSelected: false });
        }

        const newDoc = {
            name: file.name,
            pdfLibDoc,
            pdfJsDoc,
            pages,
            currentPage: 1,
            zoom: 1.0
        };

        editorState.docs.push(newDoc);
        editorState.activeDocIndex = editorState.docs.length - 1;

        if (uploadView) uploadView.style.display = 'none';
        if (editorView) editorView.style.display = 'flex';

        await refreshUI();

    } catch (err) {
        console.error("Open doc failed:", err);
        alert("Gagal membuka dokumen.");
    }
}

async function switchTab(index) {
    editorState.activeDocIndex = index;
    await refreshUI();
}

async function closeTab(index, e) {
    if (e) e.stopPropagation();
    
    editorState.docs.splice(index, 1);
    
    if (editorState.docs.length === 0) {
        editorState.activeDocIndex = -1;
        editorState.container.querySelector('#pdf-editor-view').style.display = 'none';
        editorState.container.querySelector('#pdf-upload-view').style.display = 'flex';
    } else {
        editorState.activeDocIndex = Math.max(0, index - 1);
        await refreshUI();
    }
}

async function refreshUI() {
    renderTabs();
    await renderThumbnails();
    await renderActivePage();
    updateStatusBar();
}

function renderTabs() {
    const container = editorState.container.querySelector('#editor-tabs-container');
    if (!container) return;
    container.innerHTML = '';

    editorState.docs.forEach((doc, index) => {
        const tab = document.createElement('div');
        tab.className = `editor-tab ${index === editorState.activeDocIndex ? 'active' : ''}`;
        tab.onclick = () => switchTab(index);
        
        tab.innerHTML = `
            <i class="ph-fill ph-file-pdf"></i>
            <span title="${doc.name}">${doc.name}</span>
            <div class="tab-close" onclick="closeTab(${index}, event)"><i class="ph ph-x"></i></div>
        `;
        container.appendChild(tab);
    });
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
    container.querySelector('#btn-editor-merge')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => openNewDocument(e.target.files[0]);
        input.click();
    });

    container.querySelector('#btn-editor-rotate-cw')?.addEventListener('click', () => rotatePage(90));
    container.querySelector('#btn-editor-delete')?.addEventListener('click', () => deletePages());
    container.querySelector('#btn-editor-split')?.addEventListener('click', () => extractPages());
    
    // Sisipkan
    container.querySelector('#btn-editor-page-nums')?.addEventListener('click', () => addPageNumbers());
    container.querySelector('#btn-editor-watermark')?.addEventListener('click', () => addWatermark());

    // Zoom
    container.querySelector('#btn-editor-zoom-in')?.addEventListener('click', () => {
        const doc = editorState.docs[editorState.activeDocIndex];
        doc.zoom += 0.1;
        renderActivePage();
    });
    container.querySelector('#btn-editor-zoom-out')?.addEventListener('click', () => {
        const doc = editorState.docs[editorState.activeDocIndex];
        doc.zoom = Math.max(0.5, doc.zoom - 0.1);
        renderActivePage();
    });

    // Export
    container.querySelector('#btn-editor-export')?.addEventListener('click', () => exportPdf());
}

async function renderThumbnails() {
    const list = editorState.container.querySelector('#editor-thumbnail-list');
    const doc = editorState.docs[editorState.activeDocIndex];
    if (!list || !doc) return;
    list.innerHTML = '';

    for (let i = 0; i < doc.pages.length; i++) {
        const pageNum = i + 1;
        const pageData = doc.pages[i];
        
        const item = document.createElement('div');
        item.className = `thumbnail-item ${pageNum === doc.currentPage ? 'active' : ''} ${pageData.isSelected ? 'selected' : ''}`;
        
        const selectBadge = document.createElement('div');
        selectBadge.style.cssText = `position:absolute; top:5px; right:5px; width:20px; height:20px; border-radius:50%; border:2px solid #fff; background:${pageData.isSelected ? 'var(--primary-blue)' : 'rgba(0,0,0,0.2)'}; z-index:5; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;`;
        if (pageData.isSelected) selectBadge.innerHTML = '<i class="ph-bold ph-check"></i>';
        
        selectBadge.onclick = (e) => {
            e.stopPropagation();
            pageData.isSelected = !pageData.isSelected;
            renderThumbnails();
        };

        item.onclick = () => {
            doc.currentPage = pageNum;
            updateActiveThumbnail();
            renderActivePage();
            updateStatusBar();
        };

        const canvas = document.createElement('canvas');
        canvas.className = 'thumbnail-canvas';
        const page = await doc.pdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        item.appendChild(selectBadge);
        item.appendChild(canvas);
        item.innerHTML += `<span class="thumbnail-number">Halaman ${pageNum}</span>`;
        list.appendChild(item);
    }
}

function updateActiveThumbnail() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const items = editorState.container.querySelectorAll('.thumbnail-item');
    items.forEach((item, idx) => {
        if (idx + 1 === doc.currentPage) item.classList.add('active');
        else item.classList.remove('active');
    });
}

async function renderActivePage() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const canvas = editorState.container.querySelector('#editor-main-canvas');
    if (!canvas || !doc) return;

    const page = await doc.pdfJsDoc.getPage(doc.currentPage);
    const viewport = page.getViewport({ scale: doc.zoom });
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    
    const zoomText = editorState.container.querySelector('#editor-zoom-level');
    if (zoomText) zoomText.textContent = `${Math.round(doc.zoom * 100)}%`;
    
    const fileNameStatus = editorState.container.querySelector('#editor-filename-status');
    if (fileNameStatus) fileNameStatus.textContent = doc.name;
}

function updateStatusBar() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const status = editorState.container.querySelector('#editor-page-status');
    if (status && doc) status.textContent = `Halaman ${doc.currentPage} / ${doc.pages.length}`;
}

async function rotatePage(degrees) {
    const doc = editorState.docs[editorState.activeDocIndex];
    const pageData = doc.pages[doc.currentPage - 1];
    const page = doc.pdfLibDoc.getPage(pageData.index);
    page.setRotation(PDFLib.degrees(page.getRotation().angle + degrees));
    await syncDoc(doc);
}

async function deletePages() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const selected = doc.pages.filter(p => p.isSelected);
    
    if (selected.length === 0) {
        if (confirm(`Hapus halaman ${doc.currentPage}?`)) {
            doc.pages.splice(doc.currentPage - 1, 1);
            doc.currentPage = Math.max(1, doc.currentPage - 1);
            await syncDoc(doc);
        }
    } else {
        if (confirm(`Hapus ${selected.length} halaman terpilih?`)) {
            doc.pages = doc.pages.filter(p => !p.isSelected);
            doc.currentPage = 1;
            await syncDoc(doc);
        }
    }
}

async function extractPages() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const selected = doc.pages.filter(p => p.isSelected);
    if (!selected.length) { alert("Pilih halaman dulu!"); return; }

    try {
        const newDoc = await PDFLib.PDFDocument.create();
        const indices = selected.map(p => p.index);
        const copiedPages = await newDoc.copyPages(doc.pdfLibDoc, indices);
        copiedPages.forEach(p => newDoc.addPage(p));
        downloadBlob(await newDoc.save(), `Extracted_${doc.name}`);
    } catch (err) { alert("Gagal!"); }
}

async function addPageNumbers() {
    const doc = editorState.docs[editorState.activeDocIndex];
    for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pdfLibDoc.getPage(doc.pages[i].index);
        page.drawText(`Hal ${i + 1}`, { x: page.getSize().width/2 - 20, y: 20, size: 10 });
    }
    await syncDoc(doc);
}

async function addWatermark() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const text = prompt("Teks Watermark:", "RAHASIA");
    if (!text) return;
    for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pdfLibDoc.getPage(doc.pages[i].index);
        page.drawText(text, { x: 100, y: 400, size: 50, rotate: PDFLib.degrees(45), opacity: 0.2 });
    }
    await syncDoc(doc);
}

async function syncDoc(doc) {
    // We recreate pdfJsDoc from current pdfLibDoc state for rendering
    // This is simplified: in reality we'd create a temporary doc based on `doc.pages`
    const tempDoc = await PDFLib.PDFDocument.create();
    for (const p of doc.pages) {
        const [copied] = await tempDoc.copyPages(doc.pdfLibDoc, [p.index]);
        tempDoc.addPage(copied);
    }
    const bytes = await tempDoc.save();
    doc.pdfJsDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
    await refreshUI();
}

async function exportPdf() {
    const doc = editorState.docs[editorState.activeDocIndex];
    const finalDoc = await PDFLib.PDFDocument.create();
    for (const p of doc.pages) {
        const [copied] = await finalDoc.copyPages(doc.pdfLibDoc, [p.index]);
        finalDoc.addPage(copied);
    }
    downloadBlob(await finalDoc.save(), `Edited_${doc.name}`);
}

function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
