$(document).ready(function() {
    // Initialize all sections
    initializeApp();

    // Drag and Drop functionality
    setupDragAndDrop();

    // File upload handling
    setupFileUpload();

    // Predict button handling
    setupPredictButton();

    // Smooth scrolling for navigation
    setupSmoothScrolling();

    // Animation triggers
    setupScrollAnimations();
});

function initializeApp() {
    $('#imagePreviewSection').hide();
    $('#loadingSection').hide();
    $('#resultSection').hide();

    // Add loading animation to body
    $('body').addClass('animate-fade-in');
}

function setupDragAndDrop() {
    const uploadArea = $('#uploadArea')[0];
    const fileInput = $('#imageUpload')[0];

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        $(uploadArea).addClass('drag-over');
    }

    function unhighlight(e) {
        $(uploadArea).removeClass('drag-over');
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }

    // Click to upload
    $(uploadArea).on('click', function() {
        fileInput.click();
    });
}

function setupFileUpload() {
    $("#imageUpload").change(function() {
        if (this.files && this.files[0]) {
            handleFileSelect(this.files[0]);
        }
    });
}

function handleFileSelect(file) {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please select a valid image file (PNG, JPG, JPEG)', 'error');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    $('#selectedFileName').text(`Selected: ${file.name}`);

    // Read and display image
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#imagePreview').attr('src', e.target.result);
        $('#uploadArea').fadeOut(300, function() {
            $('#imagePreviewSection').fadeIn(300);
        });
    };
    reader.readAsDataURL(file);

    // Reset previous results
    resetResults();
}

function resetResults() {
    $('#resultSection').hide();
    $('#resultText').text('');
}

function setupPredictButton() {
    $('#btn-predict').on('click', function() {
        const formData = new FormData($('#upload-file')[0]);

        // Hide preview and show loading
        $('#imagePreviewSection').fadeOut(300, function() {
            $('#loadingSection').fadeIn(300);
        });

        // Add loading animation
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...');

        // Make prediction
        $.ajax({
            type: 'POST',
            url: '/predict',
            data: formData,
            contentType: false,
            cache: false,
            processData: false,
            async: true,
            success: function(data) {
                // Hide loading and show result
                $('#loadingSection').fadeOut(300, function() {
                    showResult(data);
                });
            },
            error: function() {
                $('#loadingSection').fadeOut(300);
                showNotification('Error occurred during prediction. Please try again.', 'error');
                resetToUpload();
            }
        });
    });
}

function showResult(disease) {
    const formattedDisease = disease
        .replace(/___/g, ' - ')
        .replace(/__/g, ' ')
        .replace(/_/g, ' ')
        .trim();
    $('#resultText').html(`<i class="fas fa-check-circle"></i>${formattedDisease}`);
    $('#resultSection').fadeIn(300);

    // Add success animation
    $('.result-card').addClass('animate-bounce');

    // Reset button
    $('#btn-predict').prop('disabled', false).html('<i class="fas fa-search me-2"></i>Predict Disease');
}

function resetToUpload() {
    $('#imagePreviewSection').hide();
    $('#loadingSection').hide();
    $('#resultSection').hide();
    $('#uploadArea').fadeIn(300);
    $('#btn-predict').prop('disabled', false).html('<i class="fas fa-search me-2"></i>Predict Disease');
    $('#imageUpload').val('');
    $('#selectedFileName').text('No file selected');
}

function resetUpload() {
    // Add fade out animation
    $('#resultSection').fadeOut(300, function() {
        resetToUpload();
    });
}

function learnMore() {
    // Placeholder for learn more functionality
    showNotification('Detailed treatment information coming soon!', 'info');
}

function setupSmoothScrolling() {
    $('a[href^="#"]').on('click', function(event) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });
}

function setupScrollAnimations() {
    // Trigger animations on scroll
    $(window).on('scroll', function() {
        const scrollTop = $(window).scrollTop();
        const windowHeight = $(window).height();

        $('.animate-slide-up').each(function() {
            const elementTop = $(this).offset().top;
            if (elementTop < scrollTop + windowHeight - 100) {
                $(this).addClass('animated');
            }
        });
    });

    // Trigger initial animations
    setTimeout(function() {
        $('.animate-slide-up').each(function() {
            const elementTop = $(this).offset().top;
            const windowHeight = $(window).height();
            if (elementTop < windowHeight - 100) {
                $(this).addClass('animated');
            }
        });
    }, 500);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = $(`
        <div class="alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed"
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);

    // Add to body
    $('body').append(notification);

    // Auto remove after 5 seconds
    setTimeout(function() {
        notification.alert('close');
    }, 5000);
}

// Add CSS for drag over state
const style = document.createElement('style');
style.textContent = `
    .upload-area.drag-over {
        border-color: #22c55e !important;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%) !important;
        transform: scale(1.02) !important;
    }

    .animate-slide-up.animated {
        animation-play-state: running !important;
    }

    .image-container {
        position: relative;
        overflow: hidden;
    }

    .image-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(34, 197, 94, 0.1) 50%, transparent 70%);
        transform: translateX(-100%);
        transition: transform 0.6s ease;
    }

    .image-container:hover::before {
        transform: translateX(100%);
    }
`;
document.head.appendChild(style);

// Add loading animation to page load
$(window).on('load', function() {
    $('body').addClass('loaded');
});