/**
 * #JagaDokumen - PDF Page Numbers Tool (PREMIUM v4)
 * Features: Visual preview, multi-format, color/font control, smart placement.
 */
async function initPageNumbers(container = document) {
    const el = (id) => container.querySelector(id.startsWith('#') ? id : `#${id}`);

    const fileInput = el('pnum-file-input');
    const uploadArea = el('pnum-upload-area');
    const workspace = el('pnum-workspace');
    const previewContainer = el('pnum-preview-container');
    const visualMarker = el('pnum-visual-marker');
    const btnRun = el('btn-run-pnum');
    const btnReset = el('btn-pnum-reset');

    let originalFile = null;
    let pdfDoc = null;
    let currentPos = 'bl';
    let markerX = 5, markerY = 5; // Global percentage coordinates
    let isDragging = false;

    // Position mapping (percentage from bottom-left)
    const posMap = {
        'tl': { x: 5, y: 95, align: 'left' },
        'tc': { x: 50, y: 95, align: 'center' },
        'tr': { x: 95, y: 95, align: 'right' },
        'bl': { x: 5, y: 5, align: 'left' },
        'bc': { x: 50, y: 5, align: 'center' },
        'br': { x: 95, y: 5, align: 'right' }
    };

    if (!fileInput || !uploadArea) return;

    uploadArea.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') handleFile(file);
    };

    if (btnReset) btnReset.onclick = () => {
        workspace.style.display = 'none';
        uploadArea.style.display = 'flex';
        fileInput.value = '';
    };

    async function handleFile(file) {
        originalFile = file;
        
        // Show loading in upload area
        uploadArea.innerHTML = `
            <i class="ph ph-circle-notch animate-spin" style="font-size:3rem;color:var(--primary-blue);"></i>
            <p style="font-weight:700;color:var(--text-main);font-size:0.95rem;margin-top:10px;">Menyiapkan Pratinjau...</p>`;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            uploadArea.style.display = 'none';
            workspace.style.display = 'block';
            
            el('pnum-filename').textContent = file.name;
            el('pnum-meta').textContent = `${pdfDoc.numPages} Halaman`;

            // Restore original upload area content for next time
            resetUploadAreaHTML();
            
            renderPreview(parseInt(el('pnum-start-page').value) || 1);
        } catch (err) {
            alert('Gagal memuat PDF: ' + err.message);
            resetUploadAreaHTML();
        }
    }

    function resetUploadAreaHTML() {
        uploadArea.innerHTML = `
            <i class="ph-fill ph-list-numbers" style="font-size: 80px; color: var(--primary-blue); margin-bottom: 20px;"></i>
            <div class="upload-text">
                <h3>Tambah Nomor Halaman</h3>
                <p>Bubuhkan penomoran otomatis pada dokumen PDF Anda dengan rapi</p>
            </div>
            <div class="btn btn-primary">Pilih File PDF</div>
        `;
    }

    async function renderPreview(pageIdx) {
        if (!pdfDoc) return;
        
        // Safety check for page range
        const totalPages = pdfDoc.numPages;
        const targetPage = Math.max(1, Math.min(pageIdx, totalPages));
        
        const page = await pdfDoc.getPage(targetPage);
        const viewport = page.getViewport({ scale: 0.8 });
        
        previewContainer.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.boxShadow = 'var(--shadow-lg)';
        canvas.style.background = 'var(--bg-card)';
        canvas.style.borderRadius = '8px';
        canvas.style.border = '1px solid var(--border-color)';
        
        previewContainer.appendChild(canvas);
        previewContainer.appendChild(visualMarker); // Put marker back

        // Update indicator
        el('pnum-preview-indicator').textContent = `Halaman ${targetPage}`;

        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        updateMarkerPosition(viewport.width, viewport.height, targetPage);
    }

    function updateMarkerPosition(w, h, previewPageNum = 1) {
        // Calculate based on canvas size
        const left = (markerX / 100) * w;
        const top = ((100 - markerY) / 100) * h;
        
        visualMarker.style.left = `calc(50% - ${w/2}px + ${left}px)`;
        visualMarker.style.top = `calc(50% - ${h/2}px + ${top}px)`;
        
        // Auto-alignment based on quadrant
        if (markerX > 33 && markerX < 66) visualMarker.style.transform = 'translate(-50%, -50%)';
        else if (markerX >= 66) visualMarker.style.transform = 'translate(-100%, -50%)';
        else visualMarker.style.transform = 'translate(0, -50%)';
        
        // Update format preview
        const format = el('pnum-format').value;
        const startPage = parseInt(el('pnum-start-page').value) || 1;
        const startNum = parseInt(el('pnum-start-num').value) || 1;
        const fontKey = el('pnum-font').value;
        
        // Calculate actual number for this specific preview page
        let currentNum = (previewPageNum - startPage) + startNum;
        
        // If the page is before the start page, it shouldn't have a number
        if (previewPageNum < startPage) {
            visualMarker.style.opacity = '0.3';
            visualMarker.textContent = 'N/A';
            visualMarker.title = 'Halaman ini tidak akan diberi nomor';
        } else {
            visualMarker.style.opacity = '1';
            visualMarker.textContent = format.replace('{n}', currentNum).replace('{total}', pdfDoc.numPages);
            visualMarker.title = '';
        }
        
        // CSS Font Preview
        if (fontKey.includes('Times')) visualMarker.style.fontFamily = '"Times New Roman", Times, serif';
        else if (fontKey.includes('Courier')) visualMarker.style.fontFamily = '"Courier New", Courier, monospace';
        else visualMarker.style.fontFamily = 'Arial, Helvetica, sans-serif';
        
        visualMarker.style.color = el('pnum-color').value;
        visualMarker.style.fontSize = el('pnum-size').value + 'px';
    }

    // Drag Logic
    let startX, startY;
    visualMarker.style.cursor = 'move';
    visualMarker.onmousedown = (e) => {
        isDragging = true;
        visualMarker.style.transition = 'none';
        visualMarker.style.borderColor = 'var(--color-green)';
        visualMarker.style.background = 'rgba(34, 197, 94, 0.2)';
        const rect = visualMarker.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        e.preventDefault();
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        const canvas = previewContainer.querySelector('canvas');
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        
        let x = e.clientX - canvasRect.left - startX;
        let y = e.clientY - canvasRect.top - startY;
        
        x = Math.max(0, Math.min(x, canvasRect.width - visualMarker.offsetWidth));
        y = Math.max(0, Math.min(y, canvasRect.height - visualMarker.offsetHeight));
        
        visualMarker.style.left = `${x + canvasRect.left - containerRect.left}px`;
        visualMarker.style.top = `${y + canvasRect.top - containerRect.top}px`;
        visualMarker.style.transform = 'none';

        markerX = (x / canvasRect.width) * 100;
        markerY = 100 - (y / canvasRect.height) * 100;

        container.querySelectorAll('.pos-btn').forEach(b => {
            b.classList.remove('active');
            b.style.borderColor = 'var(--border-color)';
            b.style.color = 'var(--text-main)';
        });
    };

    window.onmouseup = () => {
        if (isDragging) {
            isDragging = false;
            visualMarker.style.transition = 'all 0.2s';
            visualMarker.style.borderColor = 'var(--primary-blue)';
            visualMarker.style.background = 'rgba(37, 99, 235, 0.2)';
            const canvas = previewContainer.querySelector('canvas');
            if (canvas) updateMarkerPosition(canvas.width, canvas.height);
        }
    };

    // UI Listeners
    container.querySelectorAll('.pos-btn').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.pos-btn').forEach(b => {
                b.classList.remove('active');
                b.style.borderColor = 'var(--border-color)';
                b.style.color = 'var(--text-main)';
            });
            btn.classList.add('active');
            btn.style.borderColor = 'var(--primary-blue)';
            btn.style.color = 'var(--primary-blue)';
            currentPos = btn.dataset.pos;
            
            const pos = posMap[currentPos];
            markerX = pos.x;
            markerY = pos.y;
            
            const canvas = previewContainer.querySelector('canvas');
            if (canvas) updateMarkerPosition(canvas.width, canvas.height);
        };
    });

    el('pnum-font').onchange = () => {
        const canvas = previewContainer.querySelector('canvas');
        if (canvas) updateMarkerPosition(canvas.width, canvas.height);
    };

    el('pnum-color').oninput = () => {
        const canvas = previewContainer.querySelector('canvas');
        if (canvas) updateMarkerPosition(canvas.width, canvas.height);
    };

    el('pnum-size').onchange = () => {
        const canvas = previewContainer.querySelector('canvas');
        if (canvas) updateMarkerPosition(canvas.width, canvas.height);
    };

    el('pnum-format').onchange = () => {
        const canvas = previewContainer.querySelector('canvas');
        if (canvas) updateMarkerPosition(canvas.width, canvas.height);
    };
    
    el('pnum-start-page').oninput = () => {
        const pageNum = parseInt(el('pnum-start-page').value);
        if (pageNum > 0 && pdfDoc && pageNum <= pdfDoc.numPages) {
            renderPreview(pageNum);
        }
    };

    el('pnum-start-num').oninput = () => {
        const canvas = previewContainer.querySelector('canvas');
        if (canvas) {
            const pageNum = parseInt(el('pnum-preview-indicator').textContent.replace('Halaman ', ''));
            updateMarkerPosition(canvas.width, canvas.height, pageNum);
        }
    };

    btnRun.onclick = async () => {
        if (!originalFile) return;
        btnRun.disabled = true;
        const originalText = btnRun.innerHTML;
        btnRun.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> Memproses...';

        try {
            const arrayBuffer = await originalFile.arrayBuffer();
            const libDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = libDoc.getPages();
            
            const format = el('pnum-format').value;
            const startPage = parseInt(el('pnum-start-page').value) || 1;
            const startNum = parseInt(el('pnum-start-num').value) || 1;
            const size = parseInt(el('pnum-size').value) || 12;
            const colorHex = el('pnum-color').value;
            const selectedFont = el('pnum-font').value;
            
            const { r, g, b } = hexToRgb(colorHex);
            const color = PDFLib.rgb(r/255, g/255, b/255);
            
            // Map font string to PDFLib StandardFonts
            const fontName = PDFLib.StandardFonts[selectedFont] || PDFLib.StandardFonts.HelveticaBold;
            const font = await libDoc.embedFont(fontName);

            for (let i = startPage - 1; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                const pageNum = (i - (startPage - 1)) + startNum;
                
                const text = format.replace('{n}', pageNum).replace('{total}', pages.length);
                const textWidth = font.widthOfTextAtSize(text, size);
                
                let x = (markerX / 100) * width;
                let y = (markerY / 100) * height;
                
                // Adjust for alignment based on X position
                if (markerX > 33 && markerX < 66) x -= textWidth / 2;
                else if (markerX >= 66) x -= textWidth + 30; // padding
                else x += 30; // padding
                
                // Adjust vertical padding based on Y position
                if (markerY > 50) y -= 30 + size; // top area
                else y += 30; // bottom area

                page.drawText(text, { x, y, size, font, color });
            }

            const pdfBytes = await libDoc.save();
            downloadFile(pdfBytes, originalFile.name.replace('.pdf', '_Bernomor.pdf'), 'application/pdf');
            if (typeof showToast === 'function') showToast('Nomor halaman berhasil ditambahkan!', 'success');
        } catch (err) {
            console.error(err);
            alert('Gagal memproses: ' + err.message);
        } finally {
            btnRun.disabled = false;
            btnRun.innerHTML = originalText;
        }
    };

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}
