'use strict';

(function () {

    // DOM refs
    const contentInput   = document.getElementById('qr-content');
    const generateBtn    = document.getElementById('generate-btn');
    const btnText        = generateBtn.querySelector('.btn__text');
    const btnSpinner     = generateBtn.querySelector('.btn__spinner');
    const contentError   = document.getElementById('content-error');

    const sizeSlider     = document.getElementById('qr-size');
    const sizeLabel      = document.getElementById('size-label');
    const eccSelect      = document.getElementById('ecc-level');

    const uploadZone     = document.getElementById('upload-zone');
    const uploadInner    = document.getElementById('upload-inner');
    const logoFileInput  = document.getElementById('logo-file');
    const logoPreview    = document.getElementById('logo-preview');
    const removeLogo     = document.getElementById('remove-logo');
    const logoSizeRow    = document.getElementById('logo-size-row');
    const logoSizeSlider = document.getElementById('logo-size');
    const logoSizeLabel  = document.getElementById('logo-size-label');

    const outputPlaceholder = document.getElementById('output-placeholder');
    const outputResult      = document.getElementById('output-result');
    const outputError       = document.getElementById('output-error');
    const qrImage           = document.getElementById('qr-image');
    const qrMetaUrl         = document.getElementById('qr-meta-url');
    const qrMetaEcc         = document.getElementById('qr-meta-ecc');
    const downloadBtn       = document.getElementById('download-png');
    const copyBtn           = document.getElementById('copy-btn');
    const errorText         = document.getElementById('error-text');

    let logoBase64 = null;

    // Helpers 

    function setLoading(on) {
        generateBtn.disabled = on;
        btnText.hidden        = on;
        btnSpinner.hidden     = !on;
    }

    function showSection(name) {
        outputPlaceholder.hidden = name !== 'placeholder';
        outputResult.hidden      = name !== 'result';
        outputError.hidden       = name !== 'error';
    }

    function showError(msg) {
        errorText.textContent = msg;
        showSection('error');
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function truncateUrl(url, max = 38) {
        try {
            const u = new URL(url);
            const short = u.hostname + (u.pathname !== '/' ? u.pathname : '');
            return short.length > max ? short.slice(0, max) + '…' : short;
        } catch {
            return url.length > max ? url.slice(0, max) + '…' : url;
        }
    }

    // Color pickers 

    document.querySelectorAll('.color-picker-wrap').forEach((wrap) => {
        const inp    = wrap.querySelector('.color-input');
        const swatch = wrap.querySelector('.color-swatch');
        const hex    = wrap.querySelector('.color-hex');

        const sync = () => {
            swatch.style.background = inp.value;
            hex.textContent = inp.value.toUpperCase();
        };

        sync();
        wrap.addEventListener('click', () => inp.click());
        wrap.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') inp.click(); });
        inp.addEventListener('input', sync);
    });

    // Sliders 

    sizeSlider.addEventListener('input', () => {
        sizeLabel.textContent = sizeSlider.value + ' px';
    });

    logoSizeSlider.addEventListener('input', () => {
        logoSizeLabel.textContent = logoSizeSlider.value + '%';
    });

    // Logo upload

    async function handleLogoFile(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (PNG, JPG, SVG, etc.).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2 MB.');
            return;
        }

        const dataUrl = await fileToBase64(file);
        logoBase64 = dataUrl;

        logoPreview.src          = dataUrl;
        logoPreview.hidden       = false;
        uploadInner.hidden       = true;
        removeLogo.hidden        = false;
        logoSizeRow.classList.add('visible');
    }

    logoFileInput.addEventListener('change', () => {
        if (logoFileInput.files[0]) handleLogoFile(logoFileInput.files[0]);
    });

    removeLogo.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        logoBase64               = null;
        logoPreview.hidden       = true;
        uploadInner.hidden       = false;
        removeLogo.hidden        = true;
        logoSizeRow.classList.remove('visible');
        logoFileInput.value      = '';
    });

    uploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer?.files[0];
        if (file) handleLogoFile(file);
    });

    // Generate 

    async function generate() {
        contentError.hidden = true;

        const content = contentInput.value.trim();
        if (!content) {
            contentError.textContent = 'Please enter a URL or text.';
            contentError.hidden = false;
            contentInput.focus();
            return;
        }

        setLoading(true);

        const darkInput  = document.getElementById('dark-color');
        const lightInput = document.getElementById('light-color');
        const eccValue   = eccSelect.value;

        const payload = {
            content,
            pixelsPerModule:      parseInt(sizeSlider.value, 10),
            darkColor:            darkInput.value,
            lightColor:           lightInput.value,
            errorCorrectionLevel: eccValue,
            logoBase64:           logoBase64 ?? null,
            logoSizeRatio:        logoBase64
                ? parseInt(logoSizeSlider.value, 10) / 100
                : 0.22,
        };

        try {
            const resp = await fetch('/api/qr/generate', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });

            const data = await resp.json();

            if (!resp.ok || !data.success) {
                showError(data.errorMessage || 'Something went wrong. Please try again.');
                return;
            }

            const src = 'data:image/png;base64,' + data.imageBase64;
            qrImage.src = src;

            // Update meta strip
            qrMetaUrl.textContent = truncateUrl(content);
            const eccMap = { L: 'ECC L', M: 'ECC M', Q: 'ECC Q', H: 'ECC H' };
            qrMetaEcc.textContent = eccMap[eccValue] ?? 'ECC H';

            showSection('result');

            // Download
            downloadBtn.onclick = () => {
                Object.assign(document.createElement('a'), {
                    href: src, download: 'qr-studio.png',
                }).click();
            };

            // Copy
            copyBtn.onclick = async () => {
                try {
                    const blob = await (await fetch(src)).blob();
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    const saved = copyBtn.innerHTML;
                    copyBtn.textContent = '✓ Copied';
                    setTimeout(() => { copyBtn.innerHTML = saved; }, 2000);
                } catch {
                    alert('Clipboard write is not supported in this browser. Please use Download instead.');
                }
            };

        } catch {
            showError('Network error — please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    generateBtn.addEventListener('click', generate);
    contentInput.addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });

})();
