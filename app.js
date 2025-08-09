const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let currentColor = '#000000';
let originalFileName = ''; // Add variable to store original filename

// Variables for handling display vs original dimensions
let originalImage = null;
let displayScale = 1;
const MAX_DISPLAY_WIDTH = 800;
const MAX_DISPLAY_HEIGHT = 600;

// Color button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Color buttons
    const colorButtons = document.querySelectorAll('.color-btn');
    const customColorBtn = document.getElementById('customColorBtn');
    const customColorInput = document.getElementById('customColorInput');
    const watermarkColor = document.getElementById('watermarkColor');
    const hexColorInput = document.getElementById('hexColorInput');
    const opacitySlider = document.getElementById('opacity');
    const opacityValue = document.getElementById('opacityValue');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');

    // Set initial active color
    colorButtons[0].classList.add('active');

    // Color button clicks
    colorButtons.forEach(btn => {
        if (!btn.classList.contains('custom-color')) {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                colorButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // Set the color
                currentColor = this.dataset.color;
                watermarkColor.value = currentColor;
                hexColorInput.value = currentColor;
                customColorInput.style.display = 'none';
            });
        }
    });

    // Custom color button
    customColorBtn.addEventListener('click', function() {
        colorButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        customColorInput.style.display = 'flex';
    });

    // Color picker change
    watermarkColor.addEventListener('input', function() {
        currentColor = this.value;
        hexColorInput.value = currentColor;
    });

    // Hex input change
    hexColorInput.addEventListener('input', function() {
        const hexValue = this.value;
        if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
            currentColor = hexValue;
            watermarkColor.value = hexValue;
        }
    });

    // Opacity slider
    opacitySlider.addEventListener('input', function() {
        opacityValue.textContent = this.value;
    });

    // Rotation slider
    const rotationSlider = document.getElementById('rotation');
    const rotationValue = document.getElementById('rotationValue');
    
    rotationSlider.addEventListener('input', function() {
        rotationValue.textContent = this.value + '°';
    });

    // Position change handler
    const positionSelect = document.getElementById('position');
    const watermarkCountInput = document.getElementById('watermarkCount');
    
    positionSelect.addEventListener('change', function() {
        if (this.value === 'full-image') {
            // Disable watermark count input
            watermarkCountInput.disabled = true;
            watermarkCountInput.style.opacity = '0.5';
            watermarkCountInput.style.cursor = 'not-allowed';
        } else {
            // Enable watermark count input
            watermarkCountInput.disabled = false;
            watermarkCountInput.style.opacity = '1';
            watermarkCountInput.style.cursor = 'auto';
        }
    });

    // Make upload placeholder clickable
    uploadPlaceholder.addEventListener('click', function() {
        document.getElementById('imageInput').click();
    });
});

// Image upload functionality
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Store original filename without extension
        originalFileName = file.name.replace(/\.[^/.]+$/, "");
        
        const reader = new FileReader();
        reader.onload = function(event) {
            img.src = event.target.result;
            img.onload = function() {
                // Store original image
                originalImage = img;
                
                // Calculate display dimensions and scale
                const originalWidth = img.width;
                const originalHeight = img.height;
                
                let displayWidth = originalWidth;
                let displayHeight = originalHeight;
                
                // Scale down if image is too large for display
                if (originalWidth > MAX_DISPLAY_WIDTH || originalHeight > MAX_DISPLAY_HEIGHT) {
                    const widthRatio = MAX_DISPLAY_WIDTH / originalWidth;
                    const heightRatio = MAX_DISPLAY_HEIGHT / originalHeight;
                    displayScale = Math.min(widthRatio, heightRatio);
                    
                    displayWidth = originalWidth * displayScale;
                    displayHeight = originalHeight * displayScale;
                } else {
                    displayScale = 1;
                }
                
                // Set canvas size to display dimensions
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                
                // Set canvas style for better appearance
                canvas.style.maxWidth = '100%';
                canvas.style.height = 'auto';
                
                // Draw image scaled to display size
                ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
                
                // Show canvas and hide placeholder
                canvas.style.display = 'block';
                document.getElementById('uploadPlaceholder').style.display = 'none';
                
                // Apply watermark if text exists
                const watermarkText = document.getElementById('watermarkText').value;
                if (watermarkText.trim()) {
                    applyWatermark();
                }
            };
        };
        reader.readAsDataURL(file);
    }
});

function applyWatermark() {
    const watermarkText = document.getElementById('watermarkText').value;
    const fontSize = document.getElementById('fontSize').value;
    const opacity = document.getElementById('opacity').value;
    const rotation = document.getElementById('rotation').value;
    const position = document.getElementById('position').value;

    // Check if image is loaded
    if (!originalImage || !originalImage.complete || originalImage.naturalWidth === 0) {
        alert('لطفا ابتدا یک عکس آپلود کنید');
        return;
    }

    // Clear canvas and redraw image scaled to display size
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Calculate scaled font size for display
    const displayFontSize = fontSize * displayScale;
    
    // Set watermark style
    ctx.font = `${displayFontSize}px Arial`;
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = opacity;

    // Calculate positions based on display canvas
    const textWidth = ctx.measureText(watermarkText).width;
    const textHeight = displayFontSize;

    function drawWatermark(x, y) {
        // Save the current context state
        ctx.save();
        
        // Move to the position where we want to draw the text
        ctx.translate(x, y);
        
        // Apply rotation (convert degrees to radians)
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Draw the text at the translated position
        ctx.fillText(watermarkText, 0, 0);
        
        // Restore the context state
        ctx.restore();
    }

    // Calculate watermark count based on position
    let watermarkCount;
    if (position === 'full-image') {
        // Calculate optimal number of watermarks to fill the entire image
        const padding = 20;
        const spacingX = Math.max(textWidth + 50, 100);
        const spacingY = Math.max(textHeight + 30, 50);
        
        const cols = Math.max(1, Math.floor((canvas.width - 2 * padding) / spacingX) + 1);
        const rows = Math.max(1, Math.floor((canvas.height - 2 * padding) / spacingY) + 1);
        watermarkCount = cols * rows;
    } else {
        watermarkCount = parseInt(document.getElementById('watermarkCount').value);
    }

    if (position === 'center') {
        for (let i = 0; i < watermarkCount; i++) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2 + i * (textHeight + 10);
            // Ensure watermark stays within bounds
            const adjustedY = Math.max(textHeight, Math.min(centerY, canvas.height - 10));
            drawWatermark(centerX, adjustedY);
        }
    } else if (position === 'top-left') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = 10;
            const y = textHeight + 10 + i * (textHeight + 10);
            // Ensure watermark doesn't go below canvas
            if (y <= canvas.height - 10) {
                drawWatermark(x, y);
            }
        }
    } else if (position === 'top-right') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = canvas.width - 10;
            const y = textHeight + 10 + i * (textHeight + 10);
            // Ensure watermark doesn't go below canvas
            if (y <= canvas.height - 10) {
                drawWatermark(x, y);
            }
        }
    } else if (position === 'bottom-left') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = 10;
            const y = canvas.height - 10 - i * (textHeight + 10);
            // Ensure watermark doesn't go above canvas
            if (y >= textHeight + 10) {
                drawWatermark(x, y);
            }
        }
    } else if (position === 'bottom-right') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = canvas.width - 10;
            const y = canvas.height - 10 - i * (textHeight + 10);
            // Ensure watermark doesn't go above canvas
            if (y >= textHeight + 10) {
                drawWatermark(x, y);
            }
        }
    } else if (position === 'random') {
        for (let i = 0; i < watermarkCount; i++) {
            // Add padding to ensure watermarks don't touch edges
            const padding = 20;
            const maxX = Math.max(padding, canvas.width - padding);
            const maxY = Math.max(textHeight + padding, canvas.height - padding);
            
            const x = Math.random() * (maxX - padding) + padding;
            const y = Math.random() * (maxY - textHeight - padding) + textHeight + padding;
            drawWatermark(x, y);
        }
    } else if (position === 'full-image') {
        // Fill entire image with watermarks in a grid pattern
        const padding = 20;
        const spacingX = Math.max(textWidth + 50, 100); // Minimum spacing between watermarks
        const spacingY = Math.max(textHeight + 30, 50); // Minimum spacing between watermarks
        
        // Calculate how many watermarks can fit with proper spacing
        const cols = Math.max(1, Math.floor((canvas.width - 2 * padding) / spacingX) + 1);
        const rows = Math.max(1, Math.floor((canvas.height - 2 * padding) / spacingY) + 1);
        
        // Calculate actual spacing to distribute evenly
        const actualSpacingX = cols > 1 ? (canvas.width - 2 * padding) / (cols - 1) : 0;
        const actualSpacingY = rows > 1 ? (canvas.height - 2 * padding) / (rows - 1) : 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = cols > 1 ? padding + col * actualSpacingX : canvas.width / 2;
                const y = rows > 1 ? padding + textHeight + row * actualSpacingY : canvas.height / 2;
                
                // Ensure watermark is within bounds
                if (x >= padding && x <= canvas.width - padding && 
                    y >= textHeight + padding && y <= canvas.height - padding) {
                    drawWatermark(x, y);
                }
            }
        }
    }

    ctx.globalAlpha = 1.0; // Reset opacity
}

function downloadImage() {
    // Check if image is loaded
    if (!originalImage || !originalImage.complete || originalImage.naturalWidth === 0) {
        alert('لطفا ابتدا یک عکس آپلود کنید');
        return;
    }

    // Create a temporary canvas with original image dimensions
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;
    
    // Draw original image at full resolution
    tempCtx.drawImage(originalImage, 0, 0);
    
    // Get watermark settings
    const watermarkText = document.getElementById('watermarkText').value;
    const fontSize = document.getElementById('fontSize').value;
    const opacity = document.getElementById('opacity').value;
    const rotation = document.getElementById('rotation').value;
    const position = document.getElementById('position').value;
    
    // Set watermark style at original scale
    tempCtx.font = `${fontSize}px Arial`;
    tempCtx.fillStyle = currentColor;
    tempCtx.globalAlpha = opacity;
    
    // Calculate positions for original canvas
    const textWidth = tempCtx.measureText(watermarkText).width;
    const textHeight = parseInt(fontSize);
    
    function drawWatermarkOriginal(x, y) {
        // Save the current context state
        tempCtx.save();
        
        // Move to the position where we want to draw the text
        tempCtx.translate(x, y);
        
        // Apply rotation (convert degrees to radians)
        tempCtx.rotate((rotation * Math.PI) / 180);
        
        // Draw the text at the translated position
        tempCtx.fillText(watermarkText, 0, 0);
        
        // Restore the context state
        tempCtx.restore();
    }
    
    // Calculate watermark count based on position
    let watermarkCount;
    if (position === 'full-image') {
        // Calculate optimal number of watermarks to fill the entire image
        const padding = 20;
        const spacingX = Math.max(textWidth + 50, 100);
        const spacingY = Math.max(textHeight + 30, 50);
        
        const cols = Math.max(1, Math.floor((tempCanvas.width - 2 * padding) / spacingX) + 1);
        const rows = Math.max(1, Math.floor((tempCanvas.height - 2 * padding) / spacingY) + 1);
        watermarkCount = cols * rows;
    } else {
        watermarkCount = parseInt(document.getElementById('watermarkCount').value);
    }

    // Apply watermarks at original resolution
    if (position === 'center') {
        for (let i = 0; i < watermarkCount; i++) {
            const centerX = tempCanvas.width / 2;
            const centerY = tempCanvas.height / 2 + i * (textHeight + 10);
            // Ensure watermark stays within bounds
            const adjustedY = Math.max(textHeight, Math.min(centerY, tempCanvas.height - 10));
            drawWatermarkOriginal(centerX, adjustedY);
        }
    } else if (position === 'top-left') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = 10;
            const y = textHeight + 10 + i * (textHeight + 10);
            // Ensure watermark doesn't go below canvas
            if (y <= tempCanvas.height - 10) {
                drawWatermarkOriginal(x, y);
            }
        }
    } else if (position === 'top-right') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = tempCanvas.width - 10;
            const y = textHeight + 10 + i * (textHeight + 10);
            // Ensure watermark doesn't go below canvas
            if (y <= tempCanvas.height - 10) {
                drawWatermarkOriginal(x, y);
            }
        }
    } else if (position === 'bottom-left') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = 10;
            const y = tempCanvas.height - 10 - i * (textHeight + 10);
            // Ensure watermark doesn't go above canvas
            if (y >= textHeight + 10) {
                drawWatermarkOriginal(x, y);
            }
        }
    } else if (position === 'bottom-right') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = tempCanvas.width - 10;
            const y = tempCanvas.height - 10 - i * (textHeight + 10);
            // Ensure watermark doesn't go above canvas
            if (y >= textHeight + 10) {
                drawWatermarkOriginal(x, y);
            }
        }
    } else if (position === 'random') {
        for (let i = 0; i < watermarkCount; i++) {
            // Add padding to ensure watermarks don't touch edges
            const padding = 20;
            const maxX = Math.max(padding, tempCanvas.width - padding);
            const maxY = Math.max(textHeight + padding, tempCanvas.height - padding);
            
            const x = Math.random() * (maxX - padding) + padding;
            const y = Math.random() * (maxY - textHeight - padding) + textHeight + padding;
            drawWatermarkOriginal(x, y);
        }
    } else if (position === 'full-image') {
        // Fill entire image with watermarks in a grid pattern
        const padding = 20;
        const spacingX = Math.max(textWidth + 50, 100); // Minimum spacing between watermarks
        const spacingY = Math.max(textHeight + 30, 50); // Minimum spacing between watermarks
        
        // Calculate how many watermarks can fit with proper spacing
        const cols = Math.max(1, Math.floor((tempCanvas.width - 2 * padding) / spacingX) + 1);
        const rows = Math.max(1, Math.floor((tempCanvas.height - 2 * padding) / spacingY) + 1);
        
        // Calculate actual spacing to distribute evenly
        const actualSpacingX = cols > 1 ? (tempCanvas.width - 2 * padding) / (cols - 1) : 0;
        const actualSpacingY = rows > 1 ? (tempCanvas.height - 2 * padding) / (rows - 1) : 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = cols > 1 ? padding + col * actualSpacingX : tempCanvas.width / 2;
                const y = rows > 1 ? padding + textHeight + row * actualSpacingY : tempCanvas.height / 2;
                
                // Ensure watermark is within bounds
                if (x >= padding && x <= tempCanvas.width - padding && 
                    y >= textHeight + padding && y <= tempCanvas.height - padding) {
                    drawWatermarkOriginal(x, y);
                }
            }
        }
    }
    
    tempCtx.globalAlpha = 1.0; // Reset opacity
    
    // Download the image
    const link = document.createElement('a');
    // Use original filename + "Watermarked" if available, otherwise use default
    const downloadName = originalFileName ? `${originalFileName}_Watermarked.png` : 'watermarked-image.png';
    link.download = downloadName;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}