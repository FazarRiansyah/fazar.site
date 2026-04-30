/**
 * #JagaDokumen - Image to PDF Tool (ULTIMATE NITRO v5.2)
 * Features: Uniform cards, Rotate All, Shortcuts (R)
 */
function initImageToPdf(container = document) {
    const q = (id) => container.querySelector('#' + id);

    const fileInput   = q('img-to-pdf-file-input');
    const uploadArea  = q('img-to-pdf-upload-area');
    const workspace   = q('img-to-pdf-workspace');
    const grid        = q('img-to-pdf-grid');
    const btnExecute  = q('btn-img-to-pdf-execute');
    const btnRotateAll = q('btn-i2p-rotate-all');

    if (!fileInput || !uploadArea) return;

    let imageItems = []; 
    let sortable = null;

    const triggerSelect = () => { fileInput.value = ''; fileInput.click(); };
    uploadArea.onclick = (e) => { if (e.target !== fileInput) triggerSelect(); };

    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) handleFiles(files);
    };

    async function handleFiles(files) {
        if (imageItems.length === 0) {
            uploadArea.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:220px;';
            uploadArea.innerHTML = `
                <div style="background: var(--color-blue-light); width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <i class="ph-fill ph-circle-notch animate-spin" style="font-size: 30px; color: var(--primary-blue);"></i>
                </div>
                <p style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; margin-bottom: 4px;">Membaca Gambar...</p>
                <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${files.length} File dipilih</p>
            `;
        }

        for (const file of files) {
            const src = await fileToDataURL(file);
            imageItems.push({
                id: Math.random().toString(36).substr(2, 9),
                file,
                src,
                rotation: 0,
                name: file.name
            });
        }

        uploadArea.style.display = 'none';
        workspace.style.display  = 'block';
        renderGrid();
    }

    function fileToDataURL(file) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    // ─── Rotate All Logic ────────────────────────────────────────────
    function rotateAll() {
        imageItems.forEach(item => {
            item.rotation = (item.rotation + 90) % 360;
        });
        renderGrid();
    }
    if (btnRotateAll) btnRotateAll.onclick = rotateAll;

    window.addEventListener('keydown', (e) => {
        if (workspace && workspace.style.display === 'block' && e.key.toLowerCase() === 'r') {
            e.preventDefault();
            rotateAll();
        }
    });

    // ─── Rendering ───────────────────────────────────────────────────
    function renderGrid() {
        if (!grid) return;
        grid.innerHTML = '';
        
        imageItems.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'img-nitro-item';
            el.dataset.id = item.id;
            el.style.cssText = `
                background: var(--bg-card); 
                border: 2px solid var(--border-color); 
                border-radius: 24px; padding: 14px;
                text-align: center; position: relative; cursor: grab; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                min-width: 0; display: flex; flex-direction: column;
                box-shadow: var(--shadow-sm);
            `;

            el.innerHTML = `
                <div style="height: 130px; display: flex; align-items: center; justify-content: center; background: var(--bg-main); border-radius: 16px; overflow: hidden; margin-bottom: 12px; position: relative; border: 1px solid var(--border-color);">
                    <img src="${item.src}" style="max-width: 90%; max-height: 90%; object-fit: contain; transform: rotate(${item.rotation}deg); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 8px 15px rgba(0,0,0,0.1));">
                    <div style="position: absolute; top: 10px; left: 10px; background: var(--primary-blue); color: white; font-size: 0.7rem; font-weight: 900; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 4px 10px rgba(37,99,235,0.3); border: 2px solid var(--bg-card);">${index + 1}</div>
                </div>
                <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-main); margin-bottom: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 4px; width: 100%;">${item.name}</div>
                <div style="display: flex; gap: 8px; margin-top: auto;">
                    <button class="btn-rotate" title="Putar (R)" style="flex: 1; height: 36px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); cursor: pointer; transition: 0.2s;"><i class="ph ph-arrows-clockwise"></i></button>
                    <button class="btn-remove" title="Hapus" style="flex: 1; height: 36px; border-radius: 10px; border: 1px solid var(--color-red-light); background: var(--color-red-light); color: var(--color-red); cursor: pointer; transition: 0.2s;"><i class="ph ph-trash"></i></button>
                </div>
            `;

            el.querySelector('.btn-rotate').onclick = (e) => {
                e.stopPropagation();
                item.rotation = (item.rotation + 90) % 360;
                renderGrid();
            };

            el.querySelector('.btn-remove').onclick = (e) => {
                e.stopPropagation();
                imageItems = imageItems.filter(i => i.id !== item.id);
                if (imageItems.length === 0) location.reload();
                else renderGrid();
            };

            grid.appendChild(el);
        });

        const addCard = document.createElement('div');
        addCard.style.cssText = `
            border: 2px dashed var(--border-color); border-radius: 24px; padding: 14px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; background: var(--bg-main); color: var(--text-muted); transition: all 0.3s; min-height: 220px;
            min-width: 0; box-shadow: var(--shadow-sm);
        `;
        addCard.onmouseover = () => { addCard.style.borderColor = 'var(--primary-blue)'; addCard.style.color = 'var(--primary-blue)'; addCard.style.transform = 'scale(1.02)'; };
        addCard.onmouseout  = () => { addCard.style.borderColor = 'var(--border-color)'; addCard.style.color = 'var(--text-muted)'; addCard.style.transform = 'scale(1)'; };
        addCard.onclick     = triggerSelect;
        addCard.innerHTML = `
            <i class="ph-fill ph-plus-circle" style="font-size: 2.8rem; margin-bottom: 12px; color: var(--primary-blue); opacity: 0.8;"></i>
            <span style="font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Tambah Gambar</span>
        `;
        grid.appendChild(addCard);

        q('img-to-pdf-counter').textContent = `${imageItems.length} Gambar`;
        initSortable();
    }

    function initSortable() {
        if (sortable) sortable.destroy();
        if (typeof Sortable === 'undefined') return;
        sortable = Sortable.create(grid, {
            animation: 150,
            draggable: '.img-nitro-item',
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                const newOrderIds = Array.from(grid.querySelectorAll('.img-nitro-item')).map(el => el.dataset.id);
                const newItems = [];
                newOrderIds.forEach(id => {
                    const found = imageItems.find(item => item.id === id);
                    if (found) newItems.push(found);
                });
                imageItems = newItems;
                renderGrid();
            }
        });
    }

    if (btnExecute) {
        btnExecute.onclick = async () => {
            if (imageItems.length === 0) return;
            btnExecute.disabled = true;
            btnExecute.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Memproses...';

            try {
                const pdfDoc = await PDFLib.PDFDocument.create();
                const pageSizeType = q('i2p-page-size').value;
                const margin = parseInt(q('i2p-margin').value) || 0;

                for (const item of imageItems) {
                    const imgBytes = await fetch(item.src).then(res => res.arrayBuffer());
                    let pdfImg;
                    if (item.file.type === 'image/png') pdfImg = await pdfDoc.embedPng(imgBytes);
                    else pdfImg = await pdfDoc.embedJpg(imgBytes);

                    const sizes = {
                        a4: [595.28, 841.89],
                        a3: [841.89, 1190.55],
                        a5: [419.53, 595.28],
                        letter: [612, 792],
                        legal: [612, 1008]
                    };

                    let w, h;
                    if (pageSizeType === 'fit') {
                        w = pdfImg.width + (margin * 2);
                        h = pdfImg.height + (margin * 2);
                    } else {
                        [w, h] = sizes[pageSizeType] || sizes.a4;
                    }

                    const page = pdfDoc.addPage([w, h]);
                    const safeW = w - (margin * 2);
                    const safeH = h - (margin * 2);

                    const imgAspectRatio = pdfImg.width / pdfImg.height;
                    const safeAspectRatio = safeW / safeH;
                    
                    let drawW = safeW;
                    let drawH = safeH;

                    if (imgAspectRatio > safeAspectRatio) {
                        drawH = safeW / imgAspectRatio;
                    } else {
                        drawW = safeH * imgAspectRatio;
                    }

                    page.drawImage(pdfImg, {
                        x: margin + (safeW - drawW) / 2,
                        y: margin + (safeH - drawH) / 2,
                        width: drawW,
                        height: drawH,
                        rotate: PDFLib.degrees(item.rotation)
                    });
                }

                const pdfBytes = await pdfDoc.save();
                downloadFile(pdfBytes, 'JagaDokumen_Images.pdf', 'application/pdf');
            } catch (err) {
                alert('Gagal: ' + err.message);
            } finally {
                btnExecute.disabled = false;
                btnExecute.innerHTML = '<i class="ph-bold ph-file-pdf"></i> Buat PDF';
            }
        };
    }
}
