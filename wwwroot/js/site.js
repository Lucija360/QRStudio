'use strict';

(function () {

    // DOM refs
    const contentInput   = document.getElementById('qr-content');
    const generateBtn    = document.getElementById('generate-btn');
    const btnIcon        = generateBtn.querySelector('.btn__icon');
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

    // Share DOM refs
    const shareBtn          = document.getElementById('share-btn');
    const sharePanel        = document.getElementById('share-panel');
    const sharePanelClose   = document.getElementById('share-panel-close');
    const shareChannels     = sharePanel.querySelectorAll('.share-channel');

    let logoBase64 = null;
    let shareInProgress = false;
    let currentMode = 'url';

    // Photo upload state
    let photoBase64 = null;
    let includePhoto = true;

    // Photo upload DOM refs
    const photoUploadZone  = document.getElementById('photo-upload-zone');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoPreview     = document.getElementById('photo-preview');
    const removePhotoBtn   = document.getElementById('remove-photo');
    const photoFileInput   = document.getElementById('photo-file');
    const photoError       = document.getElementById('photo-error');
    const photoOptions     = document.getElementById('photo-options');
    const includePhotoCheckbox = document.getElementById('include-photo');

    // Mode selector
    const modeUrl     = document.getElementById('mode-url');
    const modeContact = document.getElementById('mode-contact');
    const modeOptions = document.querySelectorAll('.mode-selector__option');
    const urlBlock    = document.querySelector('.url-block');
    const contactBlock = document.querySelector('.contact-block');
    const phLabel     = document.querySelector('.ph-label');

    function switchMode(mode) {
        currentMode = mode;
        urlBlock.hidden     = mode !== 'url';
        contactBlock.hidden = mode !== 'contact';
        modeOptions.forEach(opt => {
            opt.classList.toggle('mode-selector__option--active',
                opt.getAttribute('for') === 'mode-' + mode);
        });
        phLabel.textContent = mode === 'contact'
            ? 'Fill in contact details and generate'
            : 'Enter a URL and generate';
        showSection('placeholder');
    }

    modeUrl.addEventListener('change', () => switchMode('url'));
    modeContact.addEventListener('change', () => switchMode('contact'));

    // Contact form DOM refs
    const contactFirstName = document.getElementById('contact-first-name');
    const contactLastName  = document.getElementById('contact-last-name');
    const contactPhone     = document.getElementById('contact-phone');
    const contactEmail     = document.getElementById('contact-email');
    const contactOrg       = document.getElementById('contact-org');
    const contactTitle     = document.getElementById('contact-title');
    const contactWebsite   = document.getElementById('contact-website');
    const generateContactBtn = document.getElementById('generate-contact-btn');
    const firstNameError   = document.getElementById('first-name-error');
    const lastNameError    = document.getElementById('last-name-error');
    const phoneError       = document.getElementById('phone-error');
    const emailError       = document.getElementById('email-error');
    const vcardLengthError = document.getElementById('vcard-length-error');

    // Helpers 

    function setLoading(on) {
        generateBtn.disabled = on;
        generateContactBtn.disabled = on;
        btnIcon.hidden        = on;
        btnSpinner.hidden     = !on;
    }

    function showSection(name) {
        outputPlaceholder.hidden = name !== 'placeholder';
        outputResult.hidden      = name !== 'result';
        outputError.hidden       = name !== 'error';
        shareBtn.hidden          = name !== 'result';
        if (name !== 'result') hideSharePanel();
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

    // Photo upload (T009–T012, T013–T015)

    function showPhotoError(msg) {
        photoError.textContent = msg;
        photoError.hidden = false;
    }

    function clearPhotoError() {
        photoError.hidden = true;
    }

    async function handlePhotoFile(file) {
        if (!file) return;
        clearPhotoError();

        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showPhotoError('Please select a valid image file (PNG, JPG, or WebP).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showPhotoError('Image must be smaller than 2 MB.');
            return;
        }

        const dataUrl = await fileToBase64(file);
        photoBase64 = dataUrl;

        photoPreview.src    = dataUrl;
        photoPreview.hidden = false;
        photoPlaceholder.hidden = true;
        removePhotoBtn.hidden   = false;
        photoOptions.hidden     = false;
    }

    // Click-to-browse
    photoUploadZone.addEventListener('click', (e) => {
        if (e.target === removePhotoBtn || removePhotoBtn.contains(e.target)) return;
        photoFileInput.click();
    });
    photoFileInput.addEventListener('change', () => {
        if (photoFileInput.files[0]) handlePhotoFile(photoFileInput.files[0]);
    });

    // Drag-and-drop
    photoUploadZone.addEventListener('dragover', e => {
        e.preventDefault();
        photoUploadZone.classList.add('drag-over');
    });
    photoUploadZone.addEventListener('dragleave', () => photoUploadZone.classList.remove('drag-over'));
    photoUploadZone.addEventListener('drop', e => {
        e.preventDefault();
        photoUploadZone.classList.remove('drag-over');
        const file = e.dataTransfer?.files[0];
        if (file) handlePhotoFile(file);
    });

    // Remove photo
    removePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        photoBase64 = null;
        photoPreview.hidden     = true;
        photoPlaceholder.hidden = false;
        removePhotoBtn.hidden   = true;
        photoOptions.hidden     = true;
        photoFileInput.value    = '';
        clearPhotoError();
    });

    // Include-photo checkbox
    includePhotoCheckbox.addEventListener('change', () => {
        includePhoto = includePhotoCheckbox.checked;
    });

    // vCard assembly & validation

    function escapeVCard(str) {
        return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    // Compress an image source to a JPEG Base64 string at given dimensions and quality
    function compressPhotoToBase64(imageSrc, size, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // Cover/centre crop: draw the largest centred square from the source
                const srcMin = Math.min(img.width, img.height);
                const sx = (img.width - srcMin) / 2;
                const sy = (img.height - srcMin) / 2;
                ctx.drawImage(img, sx, sy, srcMin, srcMin, 0, 0, size, size);

                canvas.toBlob(blob => {
                    if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
                    const reader = new FileReader();
                    reader.onload = () => {
                        // Strip the data:image/jpeg;base64, prefix
                        const dataUrl = reader.result;
                        const raw = dataUrl.substring(dataUrl.indexOf(',') + 1);
                        resolve(raw);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = imageSrc;
        });
    }

    function assembleVCard(photoBase64Raw) {
        const fn = contactFirstName.value.trim();
        const ln = contactLastName.value.trim();
        const phone = contactPhone.value.trim();
        const email = contactEmail.value.trim();
        const org = contactOrg.value.trim();
        const title = contactTitle.value.trim();
        const website = contactWebsite.value.trim();

        const displayName = [fn, ln].filter(Boolean).join(' ');
        const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'N:' + escapeVCard(ln) + ';' + escapeVCard(fn) + ';;;',
            'FN:' + escapeVCard(displayName),
        ];
        if (phone)   lines.push('TEL;TYPE=CELL:' + escapeVCard(phone));
        if (email)   lines.push('EMAIL:' + escapeVCard(email));
        if (org)     lines.push('ORG:' + escapeVCard(org));
        if (title)   lines.push('TITLE:' + escapeVCard(title));
        if (website) lines.push('URL:' + escapeVCard(website));
        if (photoBase64Raw) lines.push('PHOTO;ENCODING=b;TYPE=JPEG:' + photoBase64Raw);
        lines.push('END:VCARD');
        return lines.join('\r\n');
    }

    const maxBytesForEcc = { L: 2953, M: 2331, Q: 1663, H: 1273 };

    function validateVCardLength(vcardString, eccLevel) {
        const byteLen = new TextEncoder().encode(vcardString).length;
        const max = maxBytesForEcc[eccLevel] || maxBytesForEcc.H;
        if (byteLen > max) {
            vcardLengthError.textContent = 'Contact data is too long for the selected error correction level. Try removing some fields or lowering the error correction level.';
            vcardLengthError.hidden = false;
            return false;
        }
        return true;
    }

    // Progressive photo compression for QR capacity (T019)
    async function tryCompressPhotoForQR(imageSrc, eccLevel) {
        const sizes = [96, 64, 48];
        const qualities = [0.7, 0.5, 0.3, 0.1];
        const max = maxBytesForEcc[eccLevel] || maxBytesForEcc.H;

        for (const size of sizes) {
            for (const quality of qualities) {
                const raw = await compressPhotoToBase64(imageSrc, size, quality);
                const vcard = assembleVCard(raw);
                const byteLen = new TextEncoder().encode(vcard).length;
                if (byteLen <= max) {
                    return { success: true, vcard };
                }
            }
        }
        return { success: false };
    }

    // Contact form validation

    function validateContactForm() {
        // Clear all field errors
        firstNameError.hidden = true;
        lastNameError.hidden = true;
        phoneError.hidden = true;
        emailError.hidden = true;
        vcardLengthError.hidden = true;

        contactFirstName.classList.remove('input--error');
        contactLastName.classList.remove('input--error');
        contactPhone.classList.remove('input--error');
        contactEmail.classList.remove('input--error');

        let valid = true;
        const fn = contactFirstName.value.trim();
        const ln = contactLastName.value.trim();

        if (!fn && !ln) {
            firstNameError.textContent = 'Please enter a first name or last name.';
            firstNameError.hidden = false;
            contactFirstName.classList.add('input--error');
            contactLastName.classList.add('input--error');
            valid = false;
        }

        const phone = contactPhone.value.trim();
        if (phone && !/^[+\d\s\-()]+$/.test(phone)) {
            phoneError.textContent = 'Phone may only contain digits, spaces, dashes, and +.';
            phoneError.hidden = false;
            contactPhone.classList.add('input--error');
            valid = false;
        }

        const email = contactEmail.value.trim();
        if (email && !email.includes('@')) {
            emailError.textContent = 'Please enter a valid email address.';
            emailError.hidden = false;
            contactEmail.classList.add('input--error');
            valid = false;
        }

        return valid;
    }

    // Generate 

    async function generate() {
        contentError.hidden = true;
        clearPhotoError();

        let content;

        if (currentMode === 'contact') {
            if (!validateContactForm()) return;
            const eccValue = eccSelect.value;

            if (photoBase64 && includePhoto) {
                // Progressive photo compression (T019)
                const result = await tryCompressPhotoForQR(photoBase64, eccValue);
                if (!result.success) {
                    showPhotoError('Photo is too large to include at the current error correction level. Try unchecking \'Include photo\' or lowering the error correction level.');
                    return;
                }
                content = result.vcard;
            } else {
                content = assembleVCard();
                if (!validateVCardLength(content, eccValue)) return;
            }
        } else {
            content = contentInput.value.trim();
            if (!content) {
                contentError.textContent = 'Please enter a URL or text.';
                contentError.hidden = false;
                contentInput.focus();
                return;
            }
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
            if (currentMode === 'contact') {
                const fn = contactFirstName.value.trim();
                const ln = contactLastName.value.trim();
                qrMetaUrl.textContent = [fn, ln].filter(Boolean).join(' ');
            } else {
                qrMetaUrl.textContent = truncateUrl(content);
            }
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
    generateContactBtn.addEventListener('click', generate);
    contentInput.addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });

    // Share logic

    function dataUriToBlob(dataUri) {
        const parts = dataUri.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bytes = atob(parts[1]);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    function showSharePanel() {
        sharePanel.hidden = false;
    }

    function hideSharePanel() {
        sharePanel.hidden = true;
    }

    async function handleShare() {
        if (shareInProgress) return;
        shareInProgress = true;

        try {
            const dataUri = qrImage.src;
            const pageUrl = window.location.href;
            const title = 'QR Code — daenet QR Studio';

            // Try native Web Share API with file
            if (navigator.share) {
                try {
                    const blob = dataUriToBlob(dataUri);
                    const file = new File([blob], 'qr-code.png', { type: 'image/png' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: title, text: pageUrl });
                        return;
                    }
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }

                // Fallback: share URL only
                try {
                    await navigator.share({ title: title, text: pageUrl, url: pageUrl });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            // No native share — show fallback panel
            showSharePanel();
        } finally {
            shareInProgress = false;
        }
    }

    // Channel handlers
    function getShareText() {
        return 'Check out this QR code: ' + window.location.href;
    }

    const channelHandlers = {
        email() {
            const subject = encodeURIComponent('QR Code — daenet QR Studio');
            const body = encodeURIComponent(getShareText());
            window.open('mailto:?subject=' + subject + '&body=' + body, '_self');
        },
        whatsapp() {
            const text = encodeURIComponent(getShareText());
            window.open('https://wa.me/?text=' + text, '_blank', 'noopener');
        },
        telegram() {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent('QR Code — daenet QR Studio');
            window.open('https://t.me/share/url?url=' + url + '&text=' + text, '_blank', 'noopener');
        },
        instagram() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const btn = sharePanel.querySelector('[data-channel="instagram"] span');
                const orig = btn.textContent;
                btn.textContent = 'Link copied!';
                setTimeout(() => { btn.textContent = orig; }, 2000);
            }).catch(() => {
                alert('Could not copy link. Please copy manually: ' + window.location.href);
            });
        },
        x() {
            const text = encodeURIComponent('QR Code — daenet QR Studio');
            const url = encodeURIComponent(window.location.href);
            window.open('https://x.com/intent/tweet?text=' + text + '&url=' + url, '_blank', 'noopener');
        },
        facebook() {
            const url = encodeURIComponent(window.location.href);
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank', 'noopener');
        },
        linkedin() {
            const url = encodeURIComponent(window.location.href);
            window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + url, '_blank', 'noopener');
        },
        threema() {
            const text = encodeURIComponent(getShareText());
            window.open('https://threema.id/compose?text=' + text, '_blank', 'noopener');
        },
        copy() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const btn = sharePanel.querySelector('[data-channel="copy"] span');
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 2000);
            }).catch(() => {
                alert('Could not copy link. Please copy manually: ' + window.location.href);
            });
        }
    };

    // Wire up channel clicks
    shareChannels.forEach(btn => {
        btn.addEventListener('click', () => {
            const channel = btn.dataset.channel;
            if (channelHandlers[channel]) channelHandlers[channel]();
            if (channel !== 'instagram' && channel !== 'copy') hideSharePanel();
        });
    });

    // Dismiss logic
    sharePanelClose.addEventListener('click', hideSharePanel);

    document.addEventListener('click', (e) => {
        if (!sharePanel.hidden && !sharePanel.contains(e.target) && e.target !== shareBtn && !shareBtn.contains(e.target)) {
            hideSharePanel();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sharePanel.hidden) {
            hideSharePanel();
        }
    });

    // Wire up Share button
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleShare();
    });

})();
