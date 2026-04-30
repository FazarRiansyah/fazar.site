/**
 * #JagaDokumen - PDF to Image Tool (ULTIMATE NITRO v5)
 * Added: Rotation support (per-page & Rotate All), Keyboard Shortcuts (R)
 */
function initPdfToImg(container = document) {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }

    const q = (id) => container.querySelector('#' + id);

    const fileInput   = q('pdf-to-img-file-input');
    const uploadArea  = q('pdf-to-img-upload-area');
    const workspace   = q('pdf-to-img-workspace');
    const grid        = q('pdf-to-img-grid');
    const btnExecute  = q('btn-pdf-to-img-execute');
    const btnChange   = q('btn-p2i-change-file');
    const btnToggle   = q('btn-p2i-toggle-all');
    const btnRotateAll = q('btn-p2i-rotate-all');

    if (!fileInput || !uploadArea) return;

    let pdfDoc = null;
    let selectedIndices = new Set();
    let rotationStates = {}; // idx -> degrees
    let lastSelectedIndex = -1;
    let thumbnails = []; 

    // ─── Upload Logic ────────────────────────────────────────────────
    const triggerSelect = () => { fileInput.value = ''; fileInput.click(); };
    uploadArea.onclick = (e) => { if (e.target !== fileInput) triggerSelect(); };
    btnChange.onclick = triggerSelect;

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') handleFile(file);
    };

    async function handleFile(file) {
        if (workspace) workspace.style.display = 'none';
        uploadArea.style.display = 'flex';
        uploadArea.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:220px;';
        uploadArea.innerHTML = `
            <div style="background: var(--color-blue-light); width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <i class="ph-fill ph-circle-notch animate-spin" style="font-size: 30px; color: var(--primary-blue);"></i>
            </div>
            <p style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; margin-bottom: 4px;">Membaca Dokumen PDF...</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${file.name}</p>
        `;

        try {
            const buf = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
            selectedIndices.clear();
            rotationStates = {};
            thumbnails = [];
            lastSelectedIndex = -1;

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height; canvas.width = viewport.width;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                thumbnails.push(canvas.toDataURL());
                selectedIndices.add(i - 1);
            }

            uploadArea.style.display = 'none';
            workspace.style.display  = 'block';
            q('pdf-to-img-name').textContent = file.name;

            renderInitialGrid();
        } catch (err) {
            alert('Gagal: ' + err.message);
        }
    }

    // ─── Rotation & Shortcuts ────────────────────────────────────────
    function rotateAll() {
        for (let i = 0; i < pdfDoc.numPages; i++) {
            rotationStates[i] = ((rotationStates[i] || 0) + 90) % 360;
        }
        updateVisualState();
    }
    if (btnRotateAll) btnRotateAll.onclick = rotateAll;

    window.addEventListener('keydown', (e) => {
        if (workspace.style.display === 'none') return;
        if (e.key.toLowerCase() === 'r') {
            e.preventDefault();
            rotateAll();
        }
    });

    // ─── Rendering ───────────────────────────────────────────────────
    function renderInitialGrid() {
        if (!grid) return;
        grid.innerHTML = '';
        
        thumbnails.forEach((thumb, idx) => {
            const el = document.createElement('div');
            el.className = 'p2i-card';
            el.dataset.index = idx;
            el.style.cssText = `
                background: var(--bg-card); 
                border: 2px solid var(--border-color); 
                border-radius: 24px; padding: 14px; text-align: center; 
                position: relative; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            `;

            el.innerHTML = `
                <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: var(--bg-main); border-radius: 16px; overflow: hidden; margin-bottom: 12px; position: relative; border: 1px solid var(--border-color);">
                    <img src="${thumb}" class="p2i-thumb" style="max-width: 90%; max-height: 90%; object-fit: contain; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 8px 15px rgba(0,0,0,0.1));">
                    <div class="p2i-overlay" style="display: none; position: absolute; inset: 0; background: rgba(37, 99, 235, 0.08); align-items: center; justify-content: center; backdrop-filter: blur(2px);">
                        <div style="background: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);">
                            <i class="ph-fill ph-check-circle" style="color: var(--primary-blue); font-size: 1.8rem;"></i>
                        </div>
                    </div>
                    <button class="p2i-rotate-btn" style="position: absolute; bottom: 10px; right: 10px; width: 32px; height: 32px; background: var(--bg-card); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); z-index: 10; color: var(--text-main); border: 1px solid var(--border-color); cursor: pointer; transition: 0.2s;">
                        <i class="ph ph-arrows-clockwise"></i>
                    </button>
                </div>
                <div class="p2i-label" style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Halaman ${idx + 1}</div>
            `;

            el.querySelector('.p2i-rotate-btn').onclick = (e) => {
                e.stopPropagation();
                rotationStates[idx] = ((rotationStates[idx] || 0) + 90) % 360;
                updateVisualState();
            };

            el.onclick = (e) => {
                const i = parseInt(el.dataset.index);
                if (e.shiftKey && lastSelectedIndex !== -1) {
                    const start = Math.min(lastSelectedIndex, i);
                    const end = Math.max(lastSelectedIndex, i);
                    for (let j = start; j <= end; j++) selectedIndices.add(j);
                } else {
                    if (selectedIndices.has(i)) selectedIndices.delete(i);
                    else selectedIndices.add(i);
                    lastSelectedIndex = i;
                }
                updateVisualState();
            };

            grid.appendChild(el);
        });
        updateVisualState();
    }

    function updateVisualState() {
        if (!pdfDoc) return;
        const cards = grid.querySelectorAll('.p2i-card');
        cards.forEach((card, idx) => {
            const selected = selectedIndices.has(idx);
            const rot = rotationStates[idx] || 0;
            
            card.style.borderColor = selected ? 'var(--primary-blue)' : 'var(--border-color)';
            card.style.background  = selected ? 'var(--bg-main)' : 'var(--bg-card)';
            card.querySelector('.p2i-overlay').style.display = selected ? 'flex' : 'none';
            card.querySelector('.p2i-label').style.color = selected ? 'var(--primary-blue)' : 'var(--text-muted)';
            card.querySelector('.p2i-thumb').style.transform = `rotate(${rot}deg)`;
            
            if (selected) {
                card.style.boxShadow = '0 15px 35px rgba(37,99,235,0.15)';
                card.style.transform = 'translateY(-5px)';
            } else {
                card.style.boxShadow = 'var(--shadow-sm)';
                card.style.transform = 'translateY(0)';
            }
        });

        const count = selectedIndices.size;
        const toggleText = q('p2i-toggle-text');
        if (count === pdfDoc.numPages) {
            toggleText.textContent = 'Batal Pilih';
            btnToggle.querySelector('i').className = 'ph-bold ph-x-square';
        } else {
            toggleText.textContent = 'Pilih Semua';
            btnToggle.querySelector('i').className = 'ph-bold ph-check-square';
        }

        q('pdf-to-img-status').textContent = count > 0 ? `${count} halaman terpilih` : 'Pilih halaman untuk dikonversi';
        btnExecute.disabled = count === 0;
        btnExecute.style.opacity = count === 0 ? '0.5' : '1';
    }

    if (btnToggle) {
        btnToggle.onclick = () => {
            if (!pdfDoc) return;
            if (selectedIndices.size === pdfDoc.numPages) selectedIndices.clear();
            else for (let i = 0; i < pdfDoc.numPages; i++) selectedIndices.add(i);
            updateVisualState();
        };
    }

    // ─── Final Conversion ─────────────────────────────────────────────
    if (btnExecute) {
        btnExecute.onclick = async () => {
            if (selectedIndices.size === 0) return;
            btnExecute.disabled = true;
            btnExecute.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Memproses...';

            try {
                const zip = new JSZip();
                const format = q('p2i-format').value;
                const scale = parseInt(q('p2i-quality').value) || 2;
                const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                const ext = format === 'jpeg' ? 'jpg' : 'png';

                const sortedIndices = Array.from(selectedIndices).sort((a,b) => a - b);
                
                for (const idx of sortedIndices) {
                    const page = await pdfDoc.getPage(idx + 1);
                    const rot  = rotationStates[idx] || 0;
                    
                    // PDF.js internal rotation + our custom rotation
                    const viewport = page.getViewport({ scale: scale, rotation: page.rotate + rot });
                    
                    const canvas = document.createElement('canvas');
                    canvas.height = viewport.height; canvas.width = viewport.width;
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                    
                    const dataUrl = canvas.toDataURL(mime, 0.9);
                    const base64 = dataUrl.split(',')[1];
                    zip.file(`Halaman_${idx + 1}.${ext}`, base64, { base64: true });
                }

                const content = await zip.generateAsync({ type: 'blob' });
                downloadFile(content, `JagaDokumen_Images.zip`, 'application/zip');
            } catch (err) {
                alert('Gagal: ' + err.message);
            } finally {
                btnExecute.disabled = false;
                btnExecute.innerHTML = '<i class="ph-bold ph-download-simple"></i> Konversi & Unduh ZIP';
            }
        };
    }
}
