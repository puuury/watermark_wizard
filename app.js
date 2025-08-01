const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let currentColor = '#000000';
let originalFileName = ''; // Add variable to store original filename

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
                // Set canvas size
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image
                ctx.drawImage(img, 0, 0);
                
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
    if (!img.complete || img.naturalWidth === 0) {
        alert('لطفا ابتدا یک عکس آپلود کنید');
        return;
    }

    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Set watermark style
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = currentColor;
    ctx.globalAlpha = opacity;

    // Calculate positions
    const textWidth = ctx.measureText(watermarkText).width;
    const textHeight = parseInt(fontSize);

    function drawWatermark(x, y) {
        // Save the current context state
        ctx.save();
        
        // Move to the position where we want to draw the text
        ctx.translate(x + textWidth / 2, y - textHeight / 2);
        
        // Apply rotation (convert degrees to radians)
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Draw the text centered at the origin
        ctx.fillText(watermarkText, -textWidth / 2, textHeight / 2);
        
        // Restore the context state
        ctx.restore();
    }

    // Calculate watermark count based on position
    let watermarkCount;
    if (position === 'full-image') {
        // Calculate optimal number of watermarks to fill the entire image
        const spacingX = textWidth * 2; // Horizontal spacing between watermarks
        const spacingY = textHeight * 2; // Vertical spacing between watermarks
        
        const cols = Math.ceil(canvas.width / spacingX);
        const rows = Math.ceil(canvas.height / spacingY);
        watermarkCount = cols * rows;
    } else {
        watermarkCount = parseInt(document.getElementById('watermarkCount').value);
    }

    if (position === 'center') {
        for (let i = 0; i < watermarkCount; i++) {
            drawWatermark(
                canvas.width / 2 - textWidth / 2,
                canvas.height / 2 - textHeight / 2 + i * (textHeight + 10)
            );
        }
    } else if (position === 'top-left') {
        for (let i = 0; i < watermarkCount; i++) {
            drawWatermark(10, 10 + i * (textHeight + 10));
        }
    } else if (position === 'top-right') {
        for (let i = 0; i < watermarkCount; i++) {
            drawWatermark(canvas.width - textWidth - 10, 10 + i * (textHeight + 10));
        }
    } else if (position === 'bottom-left') {
        for (let i = 0; i < watermarkCount; i++) {
            drawWatermark(10, canvas.height - textHeight - 10 - i * (textHeight + 10));
        }
    } else if (position === 'bottom-right') {
        for (let i = 0; i < watermarkCount; i++) {
            drawWatermark(
                canvas.width - textWidth - 10,
                canvas.height - textHeight - 10 - i * (textHeight + 10)
            );
        }
    } else if (position === 'random') {
        for (let i = 0; i < watermarkCount; i++) {
            const x = Math.random() * (canvas.width - textWidth);
            const y = Math.random() * (canvas.height - textHeight);
            drawWatermark(x, y);
        }
    } else if (position === 'full-image') {
        // Fill entire image with watermarks in a grid pattern
        const spacingX = textWidth * 2; // Horizontal spacing
        const spacingY = textHeight * 2; // Vertical spacing
        
        const cols = Math.ceil(canvas.width / spacingX);
        const rows = Math.ceil(canvas.height / spacingY);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * spacingX;
                const y = row * spacingY;
                drawWatermark(x, y);
            }
        }
    }

    ctx.globalAlpha = 1.0; // Reset opacity
}

function downloadImage() {
    // Check if image is loaded
    if (!img.complete || img.naturalWidth === 0) {
        alert('لطفا ابتدا یک عکس آپلود کنید');
        return;
    }

    const link = document.createElement('a');
    // Use original filename + "Watermarked" if available, otherwise use default
    const downloadName = originalFileName ? `${originalFileName}_Watermarked.png` : 'watermarked-image.png';
    link.download = downloadName;
    link.href = canvas.toDataURL('image/png');
    link.click();
}