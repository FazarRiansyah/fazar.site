/**
 * #JagaDokumen - Replace Pages Tool (ULTIMATE NITRO v5.1)
 * Fixed: Auto-adjust range, instant reset button
 */
function initReplacePages(container = document) {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }

    const q = (id) => container.querySelector('#' + id);

    /* ── DOM refs ───────────────────────────────────────────────── */
    const uploadArea  = q('replace-upload-area');
    const mainInput   = q('replace-file-input');
    const workspace   = q('replace-workspace');
    const mainGrid    = q('replace-main-grid');
    const subGrid     = q('replace-sub-grid');
    const btnRun      = q('btn-run-replace');

    if (!uploadArea || !mainInput) return;

    /* ── State ──────────────────────────────────────────────────── */
    let mainFile = null, mainPdf = null, mainTotal = 0;
    let subFile  = null, subPdf  = null, subTotal  = 0;
    
    let selectedIndices = new Set();
    let rotationStates = {}; 
    let lastSelectedIndex = -1;

    /* ── Upload Main File ───────────────────────────────────────── */
    uploadArea.onclick = () => { mainInput.value = ''; mainInput.click(); };
    mainInput.onchange = (e) => { if (e.target.files[0]) loadMain(e.target.files[0]); };

    async function loadMain(file) {
        uploadArea.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:220px;';
        uploadArea.innerHTML = `
            <div style="background: var(--color-blue-light); width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <i class="ph-fill ph-circle-notch animate-spin" style="font-size: 30px; color: var(--primary-blue);"></i>
            </div>
            <p style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; margin-bottom: 4px;">Membaca Dokumen Utama...</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${file.name}</p>
        `;
        try {
            const buf = await file.arrayBuffer();
            mainPdf   = await pdfjsLib.getDocument({ data: buf }).promise;
            mainFile  = file; mainTotal = mainPdf.numPages;

            uploadArea.style.display = 'none';
            workspace.style.display  = 'block';

            q('replace-main-name').textContent  = file.name;
            q('replace-main-pages').textContent = mainTotal + ' halaman';
            
            selectedIndices.clear();
            rotationStates = {};
            lastSelectedIndex = -1;

            await renderPdfGrid(mainPdf, mainGrid, 5, 'main');
            updateRangeInputs();
        } catch (err) {
            alert('Gagal: ' + err.message);
        }
    }

    /* ── Upload Sub File ────────────────────────────────────────── */
    const subInput = q('replace-sub-input');
    const btnBrowseSub = q('btn-browse-sub');
    if (btnBrowseSub) btnBrowseSub.onclick = () => { subInput.value = ''; subInput.click(); };
    if (subInput) subInput.onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const badge = q('replace-sub-badge');
        try {
            badge.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i>';
            const buf = await file.arrayBuffer();
            subPdf  = await pdfjsLib.getDocument({ data: buf }).promise;
            subFile = file; subTotal = subPdf.numPages;

            q('replace-sub-name').textContent = file.name;
            badge.textContent = subTotal + ' halaman';
            badge.style.cssText = 'background:var(--color-green-light);color:var(--color-green);padding:4px 12px;border-radius:10px;font-size:0.75rem;font-weight:800;';

            q('replace-sub-start').disabled = false;
            q('replace-sub-start').max = subTotal;
            q('replace-sub-start').value = 1;

            await renderPdfGrid(subPdf, subGrid, 3, 'sub');
            syncRanges();
        } catch (err) {
            badge.textContent = 'Error';
        }
    };

    /* ── Range Logic ────────────────────────────────────────────── */
    function syncRanges() {
        const s1 = parseInt(q('replace-start').value)  || 1;
        const e1 = parseInt(q('replace-end').value)    || 1;
        const s2 = parseInt(q('replace-sub-start').value) || 1;
        
        let count = Math.max(1, Math.abs(e1 - s1) + 1);
        let e2 = s2 + count - 1;
        
        // Auto-adjust main range if it would exceed sub file pages
        if (subTotal > 0 && e2 > subTotal) {
            const maxAllowedCount = subTotal - s2 + 1;
            const newE1 = s1 + maxAllowedCount - 1;
            if (newE1 <= mainTotal) {
                q('replace-end').value = newE1;
                count = maxAllowedCount;
                e2 = subTotal;
            }
        }

        const label = q('replace-sub-end-label');
        label.textContent = e2;
        label.style.color = (subTotal > 0 && e2 > subTotal) ? 'var(--color-red)' : 'var(--color-green)';

        updateRunBtn();
        highlightGrids();
    }

    ['replace-start','replace-end','replace-sub-start'].forEach(id => {
        const el = q(id); if (el) el.addEventListener('input', syncRanges);
    });

    function updateRangeInputs() {
        if (selectedIndices.size > 0) {
            const sorted = Array.from(selectedIndices).sort((a,b) => a-b);
            q('replace-start').value = sorted[0] + 1;
            q('replace-end').value   = sorted[sorted.length - 1] + 1;
        }
        syncRanges();
    }

    /* ── Grids & Rendering ──────────────────────────────────────── */
    async function renderPdfGrid(pdf, gridEl, cols, type) {
        gridEl.innerHTML = '';
        gridEl.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;`;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page     = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas   = document.createElement('canvas');
            const ctx      = canvas.getContext('2d');
            canvas.height  = viewport.height; canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport }).promise;

            const card = document.createElement('div');
            card.className = `rp-card rp-${type}-card`;
            card.dataset.index = i - 1;
            card.style.cssText = `
                background: var(--bg-card); 
                border: 2px solid var(--border-color); 
                border-radius: 20px; padding: 10px; text-align: center; 
                cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                position: relative; overflow: hidden;
            `;
            card.innerHTML = `
                <div class="rp-badge" style="display:none; position:absolute; top:-5px; left:50%; transform:translateX(-50%);
                    background:var(--primary-blue); color:white; font-size:0.6rem; font-weight:900; padding:2px 10px; border-radius:20px; z-index:10; box-shadow: 0 4px 10px rgba(37,99,235,0.3);">✓ TERPILIH</div>
                <div class="rp-rotate-btn" style="position:absolute; bottom:38px; right:15px; width:30px; height:30px; background:var(--bg-card); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-md); z-index:10; color:var(--text-main); border:1px solid var(--border-color);">
                    <i class="ph ph-arrows-clockwise"></i>
                </div>
                <div style="height:110px; display:flex; align-items:center; justify-content:center; background:var(--bg-main); border-radius:14px; overflow:hidden; margin-bottom:10px; border:1px solid var(--border-color);">
                    <img src="${canvas.toDataURL()}" class="rp-thumb" style="max-width:90%; max-height:90%; object-fit:contain; transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 5px 10px rgba(0,0,0,0.1));">
                </div>
                <div style="font-size:0.7rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Halaman ${i}</div>`;

            card.querySelector('.rp-rotate-btn').onclick = (e) => {
                e.stopPropagation();
                const idx = i - 1;
                rotationStates[idx] = ((rotationStates[idx] || 0) + 90) % 360;
                card.querySelector('.rp-thumb').style.transform = `rotate(${rotationStates[idx]}deg)`;
            };

            card.onclick = (e) => {
                if (type === 'main') {
                    const idx = i - 1;
                    if (e.shiftKey && lastSelectedIndex !== -1) {
                        const start = Math.min(lastSelectedIndex, idx);
                        const end   = Math.max(lastSelectedIndex, idx);
                        for (let j = start; j <= end; j++) selectedIndices.add(j);
                    } else {
                        if (selectedIndices.has(idx)) selectedIndices.delete(idx);
                        else selectedIndices.add(idx);
                        lastSelectedIndex = idx;
                    }
                    updateRangeInputs();
                } else {
                    q('replace-sub-start').value = i;
                    syncRanges();
                }
            };
            gridEl.appendChild(card);
        }
        highlightGrids();
    }

    function highlightGrids() {
        const s1 = parseInt(q('replace-start').value) || 1;
        const e1 = parseInt(q('replace-end').value)   || 1;
        const s2 = parseInt(q('replace-sub-start').value) || 1;
        const e2 = parseInt(q('replace-sub-end-label').textContent) || 1;

        mainGrid.querySelectorAll('.rp-main-card').forEach((card, idx) => {
            const pg = idx + 1;
            const isManualSel = selectedIndices.has(idx);
            const isInRange   = pg >= Math.min(s1,e1) && pg <= Math.max(s1,e1);
            const sel = isManualSel || isInRange;
            
            card.style.borderColor = sel ? 'var(--primary-blue)' : 'var(--border-color)';
            card.style.background  = sel ? 'var(--bg-main)' : 'var(--bg-card)';
            card.querySelector('.rp-badge').style.display = sel ? 'block' : 'none';
            card.style.transform = sel ? 'translateY(-5px)' : 'translateY(0)';
            if (sel) card.style.boxShadow = '0 12px 30px rgba(37,99,235,0.15)';
            else card.style.boxShadow = 'var(--shadow-sm)';
        });

        if (subGrid) {
            subGrid.querySelectorAll('.rp-sub-card').forEach((card, idx) => {
                const pg = idx + 1;
                const sel = pg >= Math.min(s2,e2) && pg <= Math.max(s2,e2) && pg <= subTotal;
                card.style.borderColor = sel ? 'var(--color-green)' : 'var(--border-color)';
                card.style.background  = sel ? 'var(--bg-main)' : 'var(--bg-card)';
                if (sel) card.style.boxShadow = '0 12px 30px rgba(16,185,129,0.1)';
                else card.style.boxShadow = 'var(--shadow-sm)';
            });
        }
    }

    /* ── Execution ──────────────────────────────────────────────── */
    function updateRunBtn() {
        const e2 = parseInt(q('replace-sub-end-label').textContent) || 0;
        const valid = subFile && (subTotal === 0 || e2 <= subTotal);
        btnRun.disabled = !valid;
        btnRun.style.opacity = valid ? '1' : '0.4';
        btnRun.style.pointerEvents = valid ? 'auto' : 'none';
    }

    btnRun.onclick = async () => {
        if (!mainFile || !subFile) return;
        const s1 = parseInt(q('replace-start').value);
        const e1 = parseInt(q('replace-end').value);
        const s2 = parseInt(q('replace-sub-start').value);
        const rangeCount = Math.max(1, Math.abs(e1 - s1) + 1);
        const subIndexEnd = (s2 - 1) + rangeCount;

        if (subIndexEnd > subTotal) {
            alert(`⚠️ Halaman Tidak Mencukupi: Anda ingin mengganti ${rangeCount} halaman, tapi file pengganti hanya punya ${subTotal - s2 + 1} halaman tersisa.`);
            return;
        }

        btnRun.disabled = true;
        btnRun.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Memproses...';

        try {
            const mainDoc = await PDFLib.PDFDocument.load(await mainFile.arrayBuffer());
            const subDoc  = await PDFLib.PDFDocument.load(await subFile.arrayBuffer());
            const result  = await PDFLib.PDFDocument.create();

            const rangeStart = Math.min(s1, e1) - 1;
            const rangeEnd   = Math.max(s1, e1) - 1;
            const subStart   = s2 - 1;

            for (let i = 0; i < mainDoc.getPageCount(); i++) {
                let page;
                if (i >= rangeStart && i <= rangeEnd) {
                    const subIndex = subStart + (i - rangeStart);
                    const [copied] = await result.copyPages(subDoc, [subIndex]);
                    page = copied;
                } else {
                    const [copied] = await result.copyPages(mainDoc, [i]);
                    page = copied;
                }

                const rot = rotationStates[i] || 0;
                if (rot !== 0) {
                    page.setRotation(PDFLib.degrees(page.getRotation().angle + rot));
                }
                result.addPage(page);
            }

            const bytes = await result.save();
            downloadFile(bytes, 'JagaDokumen_GantiHalaman.pdf', 'application/pdf');
        } catch (err) {
            alert('Gagal: ' + err.message);
        } finally {
            btnRun.disabled = false;
            btnRun.innerHTML = '<i class="ph-bold ph-check-circle"></i> Mulai Ganti Halaman';
        }
    };

    // Change Main File button - DIRECTLY open file explorer
    q('btn-replace-change-main').onclick = () => {
        mainInput.value = '';
        mainInput.click();
    };
}
