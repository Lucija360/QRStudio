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

    // Single QR card and QR grid
    const singleQRCard = document.getElementById('single-qr-card');
    const qrGrid       = document.getElementById('qr-grid');

    // Save/Drop/Delete/Share link refs
    const savePrompt       = document.getElementById('save-prompt');
    const accessCodeInput  = document.getElementById('access-code-input');
    const accessCodeError  = document.getElementById('access-code-error');
    const saveBlobBtn      = document.getElementById('save-blob-btn');
    const dropBlobBtn      = document.getElementById('drop-blob-btn');
    const saveStatus       = document.getElementById('save-status');
    const downloadTxtBtn   = document.getElementById('download-txt-btn');
    const shareVcfBtn      = document.getElementById('share-vcf-btn');
    const shareLinkBtn     = document.getElementById('share-link-btn');
    const deleteBlobBtn    = document.getElementById('delete-blob-btn');
    const retentionSelect  = document.getElementById('retention-period');

    // Upload/Restore refs
    const uploadRestoreSection = document.getElementById('upload-restore-section');
    const uploadTxtBtn    = document.getElementById('upload-txt-btn');
    const uploadTxtFile   = document.getElementById('upload-txt-file');
    const uploadTxtError  = document.getElementById('upload-txt-error');

    let logoBase64 = null;
    let shareInProgress = false;
    let currentMode = 'url';

    // Photo upload state
    let photoBase64 = null;
    let includePhoto = true;

    // Blob state
    let currentFileName = null;
    let currentDeleteToken = null;
    let currentViewUrl = null;
    let lastContactData = null;
    let blobStorageAvailable = true;

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

    // Social media DOM refs
    const socialCheckboxes = document.querySelectorAll('.social-checkbox');
    const socialUrls       = document.querySelectorAll('.social-url');

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

    // Social media: auto-check on URL entry, auto-uncheck on empty (T016)
    socialUrls.forEach(input => {
        input.addEventListener('input', () => {
            const platform = input.dataset.platform;
            const checkbox = document.querySelector(`.social-checkbox[data-platform="${platform}"]`);
            if (checkbox) {
                checkbox.checked = input.value.trim().length > 0;
            }
            // Auto-prepend https:// on blur
        });
        input.addEventListener('blur', () => {
            const val = input.value.trim();
            if (val && !val.match(/^https?:\/\//i)) {
                input.value = 'https://' + val;
            }
        });
    });

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
        if (name !== 'result') {
            hideSharePanel();
            hideSavePrompt();
            hideContactActions();
        }
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

    function hideSavePrompt() {
        if (savePrompt) savePrompt.hidden = true;
        if (saveStatus) saveStatus.hidden = true;
        if (accessCodeError) accessCodeError.hidden = true;
    }

    function hideContactActions() {
        downloadTxtBtn.hidden = true;
        shareVcfBtn.hidden = true;
        shareLinkBtn.hidden = true;
        deleteBlobBtn.hidden = true;
        if (uploadRestoreSection) uploadRestoreSection.hidden = true;
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

    // Photo upload

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

    photoUploadZone.addEventListener('click', (e) => {
        if (e.target === removePhotoBtn || removePhotoBtn.contains(e.target)) return;
        photoFileInput.click();
    });
    photoFileInput.addEventListener('change', () => {
        if (photoFileInput.files[0]) handlePhotoFile(photoFileInput.files[0]);
    });

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

    includePhotoCheckbox.addEventListener('change', () => {
        includePhoto = includePhotoCheckbox.checked;
    });

    // vCard assembly & validation

    function escapeVCard(str) {
        return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    function compressPhotoToBase64(imageSrc, size, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                const srcMin = Math.min(img.width, img.height);
                const sx = (img.width - srcMin) / 2;
                const sy = (img.height - srcMin) / 2;
                ctx.drawImage(img, sx, sy, srcMin, srcMin, 0, 0, size, size);

                canvas.toBlob(blob => {
                    if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
                    const reader = new FileReader();
                    reader.onload = () => {
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

    // Social media URL validation (T018)
    function validateSocialUrls() {
        let valid = true;
        socialUrls.forEach(input => {
            const errorEl = input.parentElement.querySelector('.social-url-error');
            if (errorEl) errorEl.hidden = true;
            input.classList.remove('input--error');

            const checkbox = document.querySelector(`.social-checkbox[data-platform="${input.dataset.platform}"]`);
            if (checkbox && checkbox.checked && input.value.trim()) {
                try {
                    new URL(input.value.trim());
                } catch {
                    if (errorEl) {
                        errorEl.textContent = 'Please enter a valid URL.';
                        errorEl.hidden = false;
                    }
                    input.classList.add('input--error');
                    valid = false;
                }
            }
        });
        return valid;
    }

    // Collect social media data from form
    function collectSocialMedia() {
        const entries = [];
        socialUrls.forEach(input => {
            const platform = input.dataset.platform;
            const checkbox = document.querySelector(`.social-checkbox[data-platform="${platform}"]`);
            entries.push({
                platform: platform,
                url: input.value.trim(),
                enabled: checkbox ? checkbox.checked : false
            });
        });
        return entries;
    }

    // Build ContactDataPayload from current form state
    function buildContactDataPayload() {
        return {
            firstName:  contactFirstName.value.trim(),
            lastName:   contactLastName.value.trim(),
            phone:      contactPhone.value.trim() || null,
            email:      contactEmail.value.trim() || null,
            organisation: contactOrg.value.trim() || null,
            jobTitle:   contactTitle.value.trim() || null,
            website:    contactWebsite.value.trim() || null,
            photoBase64: (photoBase64 && includePhoto) ? photoBase64 : null,
            socialMedia: collectSocialMedia(),
            pixelsPerModule:      parseInt(sizeSlider.value, 10),
            darkColor:            document.getElementById('dark-color').value,
            lightColor:           document.getElementById('light-color').value,
            errorCorrectionLevel: eccSelect.value,
            logoBase64:           logoBase64 ?? null,
            logoSizeRatio:        logoBase64 ? parseInt(logoSizeSlider.value, 10) / 100 : 0.22,
            retentionPeriod:      retentionSelect.value
        };
    }

    // Render QR grid for contact mode (T017, T019)
    function renderQRGrid(data) {
        qrGrid.innerHTML = '';

        // vCard card first
        if (data.vCardImageBase64) {
            const card = document.createElement('div');
            card.className = 'qr-grid-card qr-grid-card--vcard';
            card.innerHTML = `
                <div class="qr-grid-card__label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    vCard
                </div>
                <img src="data:image/png;base64,${data.vCardImageBase64}" alt="vCard QR code" />
            `;
            qrGrid.appendChild(card);
        }

        // Social media cards
        if (data.socialMediaQRCodes) {
            data.socialMediaQRCodes.forEach(sm => {
                const card = document.createElement('div');
                card.className = 'qr-grid-card';
                card.innerHTML = `
                    <div class="qr-grid-card__label">
                        ${getPlatformIcon(sm.platform)}
                        ${escapeHtml(sm.platform)}
                    </div>
                    <img src="data:image/png;base64,${sm.imageBase64}" alt="${escapeHtml(sm.platform)} QR code" />
                `;
                qrGrid.appendChild(card);
            });
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Platform icons (T049-T051)
    function getPlatformIcon(platform) {
        const icons = {
            'LinkedIn': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
            'Instagram': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
            'Facebook': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
            'X/Twitter': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
            'YouTube': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>',
            'GitHub': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
            'TikTok': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.01a6.35 6.35 0 0 0-1 0 6.34 6.34 0 0 0 .12 12.68A6.34 6.34 0 0 0 15.83 15.5V8.74a8.16 8.16 0 0 0 4.77 1.52V6.79a4.85 4.85 0 0 1-1.01-.1z"/></svg>'
        };
        return icons[platform] || '';
    }

    // Contact form validation

    function validateContactForm() {
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

    // Auto-delete previous blob on re-generate (T025)
    async function autoDeletePrevious() {
        if (currentFileName && currentDeleteToken) {
            try {
                await fetch('/api/blob/' + encodeURIComponent(currentFileName), {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deleteToken: currentDeleteToken })
                });
            } catch { /* ignore — best effort */ }
            currentFileName = null;
            currentDeleteToken = null;
            currentViewUrl = null;
        }
    }

    // Generate

    async function generate() {
        contentError.hidden = true;
        clearPhotoError();

        if (currentMode === 'contact') {
            if (!validateContactForm()) return;
            if (!validateSocialUrls()) return;

            // Auto-delete previous blob (T025)
            await autoDeletePrevious();

            setLoading(true);

            const payload = buildContactDataPayload();

            // Also build the request body for generate-contact
            const contactReq = {
                firstName:            payload.firstName,
                lastName:             payload.lastName,
                phone:                payload.phone,
                email:                payload.email,
                organisation:         payload.organisation,
                jobTitle:             payload.jobTitle,
                website:              payload.website,
                photoBase64:          payload.photoBase64,
                socialMedia:          payload.socialMedia,
                pixelsPerModule:      payload.pixelsPerModule,
                darkColor:            payload.darkColor,
                lightColor:           payload.lightColor,
                errorCorrectionLevel: payload.errorCorrectionLevel,
                logoBase64:           payload.logoBase64,
                logoSizeRatio:        payload.logoSizeRatio
            };

            try {
                const resp = await fetch('/api/qr/generate-contact', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(contactReq),
                });

                const data = await resp.json();

                if (!resp.ok || !data.success) {
                    showError(data.errorMessage || 'Something went wrong. Please try again.');
                    return;
                }

                lastContactData = payload;

                // Show QR grid
                singleQRCard.hidden = true;
                qrGrid.hidden = false;
                renderQRGrid(data);

                showSection('result');

                // Show save prompt (T022, T023)
                savePrompt.hidden = false;
                accessCodeInput.value = '';
                saveBlobBtn.disabled = true;
                accessCodeError.hidden = true;
                saveStatus.hidden = true;

                // Show download TXT (available even before save — FR-014)
                downloadTxtBtn.hidden = false;

                // Show Share as VCF (always available per FR-033)
                shareVcfBtn.hidden = false;

                // Show upload section in contact mode
                if (uploadRestoreSection) uploadRestoreSection.hidden = false;

                // Configure download for first QR image (vCard)
                if (data.vCardImageBase64) {
                    const src = 'data:image/png;base64,' + data.vCardImageBase64;
                    qrImage.src = src;
                    downloadBtn.onclick = () => {
                        Object.assign(document.createElement('a'), {
                            href: src, download: 'qr-studio-vcard.png',
                        }).click();
                    };
                    copyBtn.onclick = async () => {
                        try {
                            const blob = await (await fetch(src)).blob();
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                            const saved = copyBtn.innerHTML;
                            copyBtn.textContent = '✓ Copied';
                            setTimeout(() => { copyBtn.innerHTML = saved; }, 2000);
                        } catch {
                            alert('Clipboard write is not supported in this browser.');
                        }
                    };
                }

            } catch {
                showError('Network error — please check your connection and try again.');
            } finally {
                setLoading(false);
            }

        } else {
            // URL mode — original behavior
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

                // Show single QR card, hide grid
                singleQRCard.hidden = false;
                qrGrid.hidden = true;

                qrMetaUrl.textContent = truncateUrl(content);
                const eccMap = { L: 'ECC L', M: 'ECC M', Q: 'ECC Q', H: 'ECC H' };
                qrMetaEcc.textContent = eccMap[eccValue] ?? 'ECC H';

                showSection('result');

                downloadBtn.onclick = () => {
                    Object.assign(document.createElement('a'), {
                        href: src, download: 'qr-studio.png',
                    }).click();
                };

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
    }

    generateBtn.addEventListener('click', generate);
    generateContactBtn.addEventListener('click', generate);
    contentInput.addEventListener('keydown', e => { if (e.key === 'Enter') generate(); });

    // Save blob (T023)
    accessCodeInput.addEventListener('input', () => {
        const len = accessCodeInput.value.length;
        saveBlobBtn.disabled = len < 4 || len > 6;
        if (len >= 4 && len <= 6) accessCodeError.hidden = true;
    });

    saveBlobBtn.addEventListener('click', async () => {
        const code = accessCodeInput.value;
        if (!code || code.length < 4) {
            accessCodeError.textContent = 'Access code must be at least 4 characters.';
            accessCodeError.hidden = false;
            return;
        }
        if (code.length > 6) {
            accessCodeError.textContent = 'Access code must not exceed 6 characters.';
            accessCodeError.hidden = false;
            return;
        }
        accessCodeError.hidden = true;

        if (!lastContactData) return;

        saveBlobBtn.disabled = true;
        saveStatus.hidden = true;

        try {
            const resp = await fetch('/api/blob/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactData: lastContactData,
                    accessCode: code
                })
            });

            const data = await resp.json();

            if (data.success) {
                currentFileName = data.fileName;
                currentDeleteToken = data.deleteToken;
                currentViewUrl = data.viewUrl;

                saveStatus.textContent = 'Saved successfully!';
                saveStatus.className = 'save-prompt__status save-prompt__status--success';
                saveStatus.hidden = false;

                // Hide save prompt after success
                setTimeout(() => { savePrompt.hidden = true; }, 1500);

                // Show share link and delete buttons
                shareLinkBtn.hidden = false;
                deleteBlobBtn.hidden = false;
                blobStorageAvailable = true;
            } else {
                saveStatus.textContent = data.errorMessage || 'Failed to save.';
                saveStatus.className = 'save-prompt__status save-prompt__status--error';
                saveStatus.hidden = false;
            }
        } catch {
            saveStatus.textContent = 'Network error — could not save.';
            saveStatus.className = 'save-prompt__status save-prompt__status--error';
            saveStatus.hidden = false;

            // Graceful degradation (T026)
            blobStorageAvailable = false;
        } finally {
            saveBlobBtn.disabled = false;
        }
    });

    // Drop blob (T023)
    dropBlobBtn.addEventListener('click', () => {
        savePrompt.hidden = true;
        // TXT download still available after drop (FR-014)
    });

    // Download TXT (T037, T038)
    downloadTxtBtn.addEventListener('click', () => {
        if (!lastContactData) return;
        downloadContactTxt(lastContactData);
    });

    function downloadContactTxt(data) {
        // Exclude security fields — just ContactDataPayload
        const exportData = {
            firstName:            data.firstName,
            lastName:             data.lastName,
            phone:                data.phone,
            email:                data.email,
            organisation:         data.organisation,
            jobTitle:             data.jobTitle,
            website:              data.website,
            photoBase64:          data.photoBase64,
            socialMedia:          data.socialMedia,
            pixelsPerModule:      data.pixelsPerModule,
            darkColor:            data.darkColor,
            lightColor:           data.lightColor,
            errorCorrectionLevel: data.errorCorrectionLevel,
            logoBase64:           data.logoBase64,
            logoSizeRatio:        data.logoSizeRatio,
            retentionPeriod:      data.retentionPeriod
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'text/plain' });
        const name = [data.firstName, data.lastName].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'contact';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Share Link (T040, T041)
    shareLinkBtn.addEventListener('click', async () => {
        if (!currentViewUrl) return;
        const fullUrl = window.location.origin + currentViewUrl;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'QR Studio Contact', url: fullUrl });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        try {
            await navigator.clipboard.writeText(fullUrl);
            const saved = shareLinkBtn.textContent;
            shareLinkBtn.textContent = '✓ Link copied!';
            setTimeout(() => { shareLinkBtn.textContent = saved; }, 2000);
        } catch {
            alert('Could not copy link. View URL: ' + fullUrl);
        }
    });

    // Share as VCF (T045-T046)
    function generateVcfBlob() {
        if (!lastContactData) return null;
        const d = lastContactData;
        const fn = d.firstName || '';
        const ln = d.lastName || '';
        const displayName = [fn, ln].filter(Boolean).join(' ');
        const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

        const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
        lines.push('N:' + esc(ln) + ';' + esc(fn) + ';;;');
        lines.push('FN:' + esc(displayName));
        if (d.phone) lines.push('TEL;TYPE=CELL:' + esc(d.phone));
        if (d.email) lines.push('EMAIL:' + esc(d.email));
        if (d.organisation) lines.push('ORG:' + esc(d.organisation));
        if (d.jobTitle) lines.push('TITLE:' + esc(d.jobTitle));
        if (d.website) lines.push('URL:' + esc(d.website));
        lines.push('END:VCARD');

        const vcf = lines.join('\r\n');
        return new Blob([vcf], { type: 'text/vcard' });
    }

    shareVcfBtn.addEventListener('click', async () => {
        const vcfBlob = generateVcfBlob();
        if (!vcfBlob) return;

        const d = lastContactData;
        const name = [d.firstName, d.lastName].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'contact';
        const fileName = name + '.vcf';

        if (navigator.share) {
            try {
                const file = new File([vcfBlob], fileName, { type: 'text/vcard' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Contact Card' });
                    return;
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        // Fallback: direct download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(vcfBlob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // Delete blob (T045-T048)
    deleteBlobBtn.addEventListener('click', async () => {
        if (!currentFileName || !currentDeleteToken) return;

        if (!confirm('Permanently delete your saved contact data? This cannot be undone.')) return;

        deleteBlobBtn.disabled = true;

        try {
            const resp = await fetch('/api/blob/' + encodeURIComponent(currentFileName), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteToken: currentDeleteToken })
            });

            const data = await resp.json();

            if (data.success) {
                currentFileName = null;
                currentDeleteToken = null;
                currentViewUrl = null;

                deleteBlobBtn.hidden = true;
                shareLinkBtn.hidden = true;

                // Show delete confirmation
                const notice = document.createElement('div');
                notice.className = 'delete-notice';
                notice.textContent = 'Contact data deleted successfully.';
                outputResult.appendChild(notice);
                setTimeout(() => notice.remove(), 4000);
            } else {
                alert(data.errorMessage || 'Could not delete. Please try again.');
            }
        } catch {
            alert('Network error — could not delete. Please try again.');
        } finally {
            deleteBlobBtn.disabled = false;
        }
    });

    // Upload/Restore TXT (T042-T044)
    uploadTxtBtn.addEventListener('click', () => uploadTxtFile.click());

    uploadTxtFile.addEventListener('change', () => {
        const file = uploadTxtFile.files[0];
        if (!file) return;
        uploadTxtError.hidden = true;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);

                // Validate expected fields
                if (!data.firstName && !data.lastName) {
                    uploadTxtError.textContent = 'Invalid file: missing name fields.';
                    uploadTxtError.hidden = false;
                    return;
                }

                // Populate contact fields
                contactFirstName.value = data.firstName || '';
                contactLastName.value  = data.lastName || '';
                contactPhone.value     = data.phone || '';
                contactEmail.value     = data.email || '';
                contactOrg.value       = data.organisation || '';
                contactTitle.value     = data.jobTitle || '';
                contactWebsite.value   = data.website || '';

                // Populate social media
                if (data.socialMedia && Array.isArray(data.socialMedia)) {
                    data.socialMedia.forEach(entry => {
                        const input = document.querySelector(`.social-url[data-platform="${entry.platform}"]`);
                        const checkbox = document.querySelector(`.social-checkbox[data-platform="${entry.platform}"]`);
                        if (input) input.value = entry.url || '';
                        if (checkbox) checkbox.checked = entry.enabled || false;
                    });
                }

                // Populate customization
                if (data.pixelsPerModule) {
                    sizeSlider.value = data.pixelsPerModule;
                    sizeLabel.textContent = data.pixelsPerModule + ' px';
                }
                if (data.darkColor) {
                    document.getElementById('dark-color').value = data.darkColor;
                    document.getElementById('dark-swatch').style.background = data.darkColor;
                    document.getElementById('dark-hex').textContent = data.darkColor.toUpperCase();
                }
                if (data.lightColor) {
                    document.getElementById('light-color').value = data.lightColor;
                    document.getElementById('light-swatch').style.background = data.lightColor;
                    document.getElementById('light-hex').textContent = data.lightColor.toUpperCase();
                }
                if (data.errorCorrectionLevel) {
                    eccSelect.value = data.errorCorrectionLevel;
                }
                if (data.retentionPeriod) {
                    retentionSelect.value = data.retentionPeriod;
                }

                // Restore photo if present
                if (data.photoBase64) {
                    photoBase64 = data.photoBase64;
                    photoPreview.src = data.photoBase64;
                    photoPreview.hidden = false;
                    photoPlaceholder.hidden = true;
                    removePhotoBtn.hidden = false;
                    photoOptions.hidden = false;
                }

                // Switch to contact mode
                if (currentMode !== 'contact') {
                    modeContact.checked = true;
                    switchMode('contact');
                }

                showSection('placeholder');

            } catch {
                uploadTxtError.textContent = 'Invalid file: could not parse JSON.';
                uploadTxtError.hidden = false;
            }
        };
        reader.readAsText(file);
        uploadTxtFile.value = '';
    });

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

                try {
                    await navigator.share({ title: title, text: pageUrl, url: pageUrl });
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            showSharePanel();
        } finally {
            shareInProgress = false;
        }
    }

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

    shareChannels.forEach(btn => {
        btn.addEventListener('click', () => {
            const channel = btn.dataset.channel;
            if (channelHandlers[channel]) channelHandlers[channel]();
            if (channel !== 'instagram' && channel !== 'copy') hideSharePanel();
        });
    });

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

    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleShare();
    });

})();
