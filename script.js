// ========== الثوابت والمتغيرات العامة ==========
const REAL_PASSWORD = "1829";

// عناصر DOM الرئيسية
const lockScreen = document.getElementById("lockScreen");
const mainContent = document.getElementById("mainContent");
const gallery = document.getElementById("gallery");
const fileInput = document.getElementById("fileInput");
const albumNameInput = document.getElementById("albumName");
const albumButtons = document.getElementById("albumButtons");
const deleteAlbumBtn = document.getElementById("deleteAlbumBtn");
const createAlbumBtn = document.getElementById("createAlbumBtn");
const currentAlbumName = document.getElementById("currentAlbumName");
const passwordInput = document.getElementById("passwordInput");
const unlockBtn = document.getElementById("unlockBtn");
const errorMsg = document.getElementById("errorMsg");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const playMusicBtn = document.getElementById("playMusic");
const volumeSlider = document.getElementById("volumeSlider");
const backgroundMusic = document.getElementById("backgroundMusic");
const themeToggle = document.getElementById("themeToggle");
const bgSelector = document.getElementById("bgSelector");
const downloadAlbumBtn = document.getElementById("downloadAlbumBtn");
const openEditorBtn = document.getElementById("openEditorBtn");
const closeEditorBtn = document.getElementById("closeEditorBtn");
const photoEditorSection = document.getElementById("photoEditorSection");
const imageCanvas = document.getElementById("imageCanvas");
const slideshowBtn = document.getElementById("slideshowBtn");

// متغيرات التطبيق
let albums = [];
let currentAlbum = "عام";
let currentImageIndex = 0;
let slideshowInterval = null;
let currentFilters = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    filter: 'none',
    blur: 0
};

// ========== وظائف المساعدة ==========

// إظهار رسالة تنبيه
function showAlert(message, type = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert ${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    alertDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    // إزالة أي رسائل سابقة
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    document.body.appendChild(alertDiv);
    
    // إضافة صوت للمنبه
    playSound(type === 'success' ? 'success' : 'error');
    
    // إزالة التنبيه بعد 3 ثوان
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// تشغيل أصوات التأثير
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'success') {
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'error') {
            oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime); // F4
            oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.1); // D4
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } else if (type === 'click') {
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    } catch (e) {
        console.log("تعذر تشغيل الصوت:", e);
    }
}

// تحديث شريط التقدم
function updateProgressBar(percentage) {
    if (percentage > 0) {
        progressBar.style.display = 'block';
        progressFill.style.width = `${percentage}%`;
    } else {
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
        }, 500);
    }
}

// حفظ البيانات في localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("خطأ في حفظ البيانات:", e);
        showAlert("تم الوصول إلى الحد الأقصى للتخزين المحلي", "error");
        return false;
    }
}

// تحميل البيانات من localStorage
function loadFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error("خطأ في تحميل البيانات:", e);
        return defaultValue;
    }
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========== نظام المصادقة ==========

// فتح المعرض عند النقر على زر الفتح
unlockBtn.addEventListener('click', unlockGallery);

// فتح المعرض عند الضغط على Enter في حقل كلمة المرور
passwordInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        unlockGallery();
    }
});

// التركيز على حقل كلمة المرور عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
    passwordInput.focus();
    
    // تحميل البيانات الأساسية
    initializeData();
    
    // تهيئة عناصر التحكم
    initMusicControls();
    initThemeToggle();
    initBackgroundSelector();
    initSlideshow();
    
    // إضافة تأثيرات للأزرار
    addButtonEffects();
});

function unlockGallery() {
    playSound('click');
    const entered = passwordInput.value.trim();
    
    if (entered === REAL_PASSWORD) {
        // إخفاء شاشة القفل بتأثير
        lockScreen.style.opacity = "0";
        lockScreen.style.transform = "scale(0.9)";
        lockScreen.style.transition = "all 0.5s ease";
        
        setTimeout(() => {
            lockScreen.style.display = "none";
            mainContent.style.display = "block";
            
            // إظهار المحتوى الرئيسي بتأثير
            setTimeout(() => {
                mainContent.classList.add("show");
            }, 50);
            
            // تحميل البيانات
            loadAlbums();
            loadImages();
            renderAlbumButtons();
            updateStatistics();
            
            showAlert("مرحباً بك Houssem في معرض العائلة!", "success");
        }, 500);
    } else {
        // عرض رسالة الخطأ
        errorMsg.style.display = "block";
        
        // تأثير اهتزاز
        passwordInput.style.animation = "none";
        setTimeout(() => {
            passwordInput.style.animation = "shake 0.5s";
        }, 10);
        
        // تفريغ الحقل وإعادة التركيز
        passwordInput.value = "";
        passwordInput.focus();
        
        setTimeout(() => {
            errorMsg.style.display = "none";
        }, 3000);
        
        playSound('error');
    }
}

// ========== موسيقى الخلفية ==========

function initMusicControls() {
    if (!backgroundMusic || !playMusicBtn || !volumeSlider) return;
    
    // تحميل إعدادات الصوت المحفوظة
    const savedVolume = localStorage.getItem('musicVolume') || 30;
    const savedState = localStorage.getItem('musicState') || 'paused';
    
    backgroundMusic.volume = savedVolume / 100;
    volumeSlider.value = savedVolume;
    
    if (savedState === 'playing') {
        backgroundMusic.play().catch(e => {
            console.log("تعذر تشغيل الموسيقى تلقائياً:", e);
        });
        playMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playMusicBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
    }
    
    // زر التشغيل/الإيقاف
    playMusicBtn.addEventListener('click', function() {
        playSound('click');
        if (backgroundMusic.paused) {
            backgroundMusic.play().then(() => {
                playMusicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                playMusicBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
                localStorage.setItem('musicState', 'playing');
                showAlert("تم تشغيل الموسيقى", "success");
            }).catch(e => {
                showAlert("تعذر تشغيل الموسيقى. تأكد من تفعيل الصوت", "error");
                console.error("خطأ في تشغيل الموسيقى:", e);
            });
        } else {
            backgroundMusic.pause();
            playMusicBtn.innerHTML = '<i class="fas fa-play"></i>';
            playMusicBtn.style.background = 'linear-gradient(45deg, #2aa198, #268bd2)';
            localStorage.setItem('musicState', 'paused');
            showAlert("تم إيقاف الموسيقى", "warning");
        }
    });
    
    // التحكم في الصوت
    volumeSlider.addEventListener('input', function() {
        backgroundMusic.volume = this.value / 100;
        localStorage.setItem('musicVolume', this.value);
        
        // تحديث أيقونة مستوى الصوت
        const volumeIcon = volumeSlider.previousElementSibling;
        if (this.value == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (this.value < 50) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    });
    
    // عند انتهاء الموسيقى، إعادة التشغيل
    backgroundMusic.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    });
}

// ========== وضع ليلي/نهاري ==========

function initThemeToggle() {
    if (!themeToggle) return;
    const themeIcon = themeToggle.querySelector('i');
    
    // تحميل الوضع من localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
    }
    
    // حدث التبديل
    themeToggle.addEventListener('click', function() {
        playSound('click');
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
            showAlert("تم تفعيل الوضع الليلي", "success");
        } else {
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
            showAlert("تم تفعيل الوضع النهاري", "success");
        }
    });
}

// ========== خلفيات متحركة اختيارية ==========

function initBackgroundSelector() {
    if (!bgSelector) return;
    
    // تحميل الخلفية المحفوظة
    const savedBg = localStorage.getItem('selectedBackground') || 'default';
    bgSelector.value = savedBg;
    if (savedBg !== 'default') {
        document.body.classList.add(savedBg);
    }
    
    // حدث تغيير الخلفية
    bgSelector.addEventListener('change', function() {
        playSound('click');
        const selectedBg = this.value;
        
        // إزالة جميع كلاسات الخلفية
        document.body.classList.remove(
            'animated-bg-1', 'animated-bg-2', 'animated-bg-3', 
            'animated-bg-4', 'animated-bg-5'
        );
        
        // إضافة الخلفية المختارة
        if (selectedBg !== 'default') {
            document.body.classList.add(selectedBg);
        }
        
        // حفظ الاختيار
        localStorage.setItem('selectedBackground', selectedBg);
        showAlert("تم تغيير الخلفية", "success");
    });
}

// ========== إدارة الألبومات ==========

// إنشاء أو التبديل إلى ألبوم
createAlbumBtn.addEventListener('click', function() {
    playSound('click');
    const name = albumNameInput.value.trim();
    
    if (!name) {
        showAlert("الرجاء إدخال اسم للألبوم", "warning");
        albumNameInput.focus();
        return;
    }
    
    if (name.length > 20) {
        showAlert("اسم الألبوم طويل جداً (الحد الأقصى 20 حرف)", "warning");
        return;
    }
    
    // إضافة الألبوم إذا لم يكن موجوداً
    if (!albums.includes(name)) {
        albums.push(name);
        saveAlbums();
        showAlert(`تم إنشاء الألبوم "${name}"`, "success");
    }
    
    // التبديل إلى الألبوم
    currentAlbum = name;
    localStorage.setItem("currentAlbum", currentAlbum);
    currentAlbumName.textContent = currentAlbum;
    
    // تحديث الواجهة
    renderAlbumButtons();
    albumNameInput.value = "";
    loadImages();
    updateStatistics();
});

// حذف الألبوم الحالي
deleteAlbumBtn.addEventListener('click', function() {
    playSound('click');
    if (currentAlbum === "عام") {
        showAlert("لا يمكن حذف الألبوم الافتراضي 'عام'", "warning");
        return;
    }
    
    if (!confirm(`هل أنت متأكد من حذف الألبوم "${currentAlbum}" وجميع محتوياته؟`)) {
        return;
    }
    
    // حذف ملفات الألبوم
    let storedFiles = loadFromStorage("familyFiles", []);
    storedFiles = storedFiles.filter(item => item.album !== currentAlbum);
    saveToStorage("familyFiles", storedFiles);
    
    // حذف الألبوم من القائمة
    albums = albums.filter(a => a !== currentAlbum);
    saveAlbums();
    
    // التبديل إلى الألبوم الأول المتاح
    currentAlbum = albums.length > 0 ? albums[0] : "عام";
    localStorage.setItem("currentAlbum", currentAlbum);
    currentAlbumName.textContent = currentAlbum;
    
    // تحديث الواجهة
    renderAlbumButtons();
    loadImages();
    updateStatistics();
    
    showAlert(`تم حذف الألبوم "${currentAlbum}"`, "success");
});

// تنزيل جميع صور الألبوم
if (downloadAlbumBtn) {
    downloadAlbumBtn.addEventListener('click', function() {
        playSound('click');
        const storedFiles = loadFromStorage("familyFiles", []);
        const albumFiles = storedFiles.filter(item => item.album === currentAlbum);
        
        if (albumFiles.length === 0) {
            showAlert("لا توجد ملفات في هذا الألبوم للتنزيل", "warning");
            return;
        }
        
        if (confirm(`هل تريد تنزيل ${albumFiles.length} ملف من الألبوم "${currentAlbum}"؟`)) {
            showAlert("جاري تجهيز الملفات للتنزيل...", "success");
            
            // تنزيل كل ملف على حدة
            let downloaded = 0;
            albumFiles.forEach((file, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = file.src;
                    const extension = file.type === 'image' ? '.jpg' : '.mp4';
                    link.download = `${currentAlbum}_${file.name || `file_${index + 1}`}${extension}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    downloaded++;
                    if (downloaded === albumFiles.length) {
                        showAlert(`تم تنزيل ${albumFiles.length} ملف`, "success");
                    }
                }, index * 300); // تأخير بين كل ملف
            });
        }
    });
}

// عرض أزرار الألبومات
function renderAlbumButtons() {
    albumButtons.innerHTML = "";
    
    // التأكد من وجود ألبوم "عام"
    if (!albums.includes("عام")) {
        albums.unshift("عام");
        saveAlbums();
    }
    
    albums.forEach(album => {
        const btn = document.createElement("button");
        btn.className = `album-btn ${album === currentAlbum ? "active" : ""}`;
        btn.innerHTML = `<i class="fas fa-folder${album === currentAlbum ? '-open' : ''}"></i> ${album}`;
        
        btn.addEventListener('click', function() {
            playSound('click');
            currentAlbum = album;
            localStorage.setItem("currentAlbum", currentAlbum);
            currentAlbumName.textContent = currentAlbum;
            loadImages();
            renderAlbumButtons();
            updateStatistics();
            stopSlideshow(); // إيقاف العرض التلقائي عند تغيير الألبوم
        });
        
        albumButtons.appendChild(btn);
    });
}

// حفظ الألبومات
function saveAlbums() {
    saveToStorage("albumsList", albums);
}

// تحميل الألبومات
function loadAlbums() {
    albums = loadFromStorage("albumsList", ["عام"]);
    currentAlbum = localStorage.getItem("currentAlbum") || albums[0];
    currentAlbumName.textContent = currentAlbum;
}

// ========== رفع الملفات ==========

fileInput.addEventListener("change", function(event) {
    playSound('click');
    const files = event.target.files;
    
    if (!files || files.length === 0) {
        return;
    }
    
    let storedFiles = loadFromStorage("familyFiles", []);
    let totalFiles = files.length;
    let processedFiles = 0;
    let uploadedFiles = 0;
    
    // تحديد الحد الأقصى لحجم الملف (15MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    
    // إظهار شريط التقدم
    updateProgressBar(0);
    
    // معالجة كل ملف
    Array.from(files).forEach((file, index) => {
        // التحقق من حجم الملف
        if (file.size > MAX_FILE_SIZE) {
            showAlert(`تم تخطي الملف "${file.name}" لأنه أكبر من 15MB`, "warning");
            processedFiles++;
            checkCompletion();
            return;
        }
        
        // التحقق من نوع الملف
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            showAlert(`تم تخطي الملف "${file.name}" لأنه ليس صورة أو فيديو`, "warning");
            processedFiles++;
            checkCompletion();
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // إنشاء معرف فريد للملف
            const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // إضافة الملف إلى التخزين
            storedFiles.push({
                id: fileId,
                src: e.target.result,
                album: currentAlbum,
                type: file.type.startsWith("video") ? "video" : "image",
                name: file.name,
                size: file.size,
                date: new Date().toISOString()
            });
            
            processedFiles++;
            uploadedFiles++;
            
            // تحديث شريط التقدم
            updateProgressBar((processedFiles / totalFiles) * 100);
            
            // حفظ وتحديث الواجهة عند اكتمال جميع الملفات
            if (processedFiles === totalFiles) {
                if (saveToStorage("familyFiles", storedFiles)) {
                    loadImages();
                    updateStatistics();
                    showAlert(`تم رفع ${uploadedFiles} ملف بنجاح إلى ألبوم "${currentAlbum}"`, "success");
                    
                    // إخفاء شريط التقدم بعد تأخير بسيط
                    setTimeout(() => updateProgressBar(0), 1000);
                }
            }
        };
        
        reader.onerror = function() {
            showAlert(`خطأ في قراءة الملف "${file.name}"`, "error");
            processedFiles++;
            checkCompletion();
        };
        
        reader.readAsDataURL(file);
    });
    
    // إعادة تعيين حقل الرفع
    fileInput.value = "";
    
    // دالة للتحقق من اكتمال المعالجة
    function checkCompletion() {
        if (processedFiles === totalFiles) {
            if (uploadedFiles > 0) {
                saveToStorage("familyFiles", storedFiles);
                loadImages();
                updateStatistics();
                showAlert(`تم رفع ${uploadedFiles} ملف بنجاح`, "success");
            }
            
            // إخفاء شريط التقدم بعد تأخير بسيط
            setTimeout(() => updateProgressBar(0), 1000);
        }
    }
});

// ========== عرض الملفات ==========

// تحميل وعرض الملفات
function loadImages() {
    gallery.innerHTML = "";
    
    const storedFiles = loadFromStorage("familyFiles", []);
    const albumFiles = storedFiles.filter(item => item.album === currentAlbum);
    
    if (albumFiles.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>لا توجد ملفات في هذا الألبوم</h3>
                <p>ابدأ برفع بعض الصور أو الفيديوهات باستخدام الزر أعلاه</p>
            </div>
        `;
        return;
    }
    
    // عرض الملفات
    albumFiles.forEach((file, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "gallery-item";
        itemDiv.dataset.id = file.id;
        itemDiv.dataset.index = index;
        
        let mediaElement;
        
        if (file.type === "image") {
            mediaElement = document.createElement("img");
            mediaElement.src = file.src;
            mediaElement.alt = file.name || "صورة عائلية";
            mediaElement.loading = "lazy";
            mediaElement.title = `اضغط لفتح المحرر | ${file.name || 'صورة'}`;
            
            // إضافة حدث لفتح المحرر عند النقر على الصورة
            mediaElement.addEventListener('click', function(e) {
                e.stopPropagation();
                openImageEditor(file.src, file.id, index);
            });
        } else {
            mediaElement = document.createElement("video");
            mediaElement.src = file.src;
            mediaElement.controls = true;
            mediaElement.preload = "metadata";
            mediaElement.title = file.name || "فيديو عائلي";
        }
        
        // طبقة الحذف
        const deleteOverlay = document.createElement("div");
        deleteOverlay.className = "delete-overlay";
        deleteOverlay.innerHTML = `
            <button class="delete-btn" title="حذف الملف">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        
        // حدث الحذف
        deleteOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteFile(file.id);
        });
        
        itemDiv.appendChild(mediaElement);
        itemDiv.appendChild(deleteOverlay);
        gallery.appendChild(itemDiv);
    });
    
    // إضافة أزرار التنقل للعرض التلقائي إذا كان هناك أكثر من صورة
    if (albumFiles.filter(f => f.type === 'image').length > 1) {
        addSlideshowControls();
    }
}

// حذف ملف
function deleteFile(fileId) {
    playSound('click');
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) {
        return;
    }
    
    let storedFiles = loadFromStorage("familyFiles", []);
    const initialLength = storedFiles.length;
    
    storedFiles = storedFiles.filter(item => item.id !== fileId);
    
    if (storedFiles.length < initialLength) {
        saveToStorage("familyFiles", storedFiles);
        loadImages();
        updateStatistics();
        showAlert("تم حذف الملف بنجاح", "success");
        stopSlideshow(); // إيقاف العرض التلقائي عند الحذف
    }
}

// ========== الإحصائيات ==========

function updateStatistics() {
    const storedFiles = loadFromStorage("familyFiles", []);
    const albumsList = loadFromStorage("albumsList", ["عام"]);
    
    // حساب الإحصائيات
    const images = storedFiles.filter(f => f.type === 'image').length;
    const videos = storedFiles.filter(f => f.type === 'video').length;
    const totalSize = storedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // تحديث الواجهة
    document.getElementById('totalImages').textContent = images;
    document.getElementById('totalVideos').textContent = videos;
    document.getElementById('totalAlbums').textContent = albumsList.length;
    document.getElementById('totalSize').textContent = formatFileSize(totalSize);
}

// ========== محرر الصور ==========

// فتح محرر الصور
if (openEditorBtn) {
    openEditorBtn.addEventListener('click', function() {
        playSound('click');
        const storedFiles = loadFromStorage("familyFiles", []);
        const albumImages = storedFiles.filter(item => 
            item.album === currentAlbum && item.type === 'image'
        );
        
        if (albumImages.length === 0) {
            showAlert("لا توجد صور في هذا الألبوم للتحرير", "warning");
            return;
        }
        
        // افتح أول صورة في الألبوم
        openImageEditor(albumImages[0].src, albumImages[0].id, 0);
    });
}

// فتح صورة معينة في المحرر
function openImageEditor(imageSrc, imageId, index) {
    playSound('click');
    currentImageIndex = index;
    photoEditorSection.style.display = 'block';
    photoEditorSection.scrollIntoView({ behavior: 'smooth' });
    
    // تحميل الصورة على canvas
    const ctx = imageCanvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = function() {
        // ضبط أبعاد canvas
        imageCanvas.width = img.width > 800 ? 800 : img.width;
        imageCanvas.height = img.height * (imageCanvas.width / img.width);
        
        // رسم الصورة
        ctx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
        
        // تهيئة عناصر التحكم
        initImageEditorControls();
        
        showAlert("تم فتح الصورة في المحرر", "success");
    };
    
    img.onerror = function() {
        showAlert("تعذر تحميل الصورة للتحرير", "error");
    };
    
    img.src = imageSrc;
}

// إغلاق المحرر
if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', function() {
        playSound('click');
        photoEditorSection.style.display = 'none';
        showAlert("تم إغلاق المحرر", "warning");
    });
}

// تهيئة عناصر تحكم المحرر
function initImageEditorControls() {
    // إعادة تعيين الفلاتر
    currentFilters = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        filter: 'none',
        blur: 0
    };
    
    // تحديث شاشات العرض
    document.getElementById('brightnessValue').textContent = '100%';
    document.getElementById('contrastValue').textContent = '100%';
    document.getElementById('saturationValue').textContent = '100%';
    
    // إعادة تعيين المنزلقات
    document.getElementById('brightnessSlider').value = 100;
    document.getElementById('contrastSlider').value = 100;
    document.getElementById('saturationSlider').value = 100;
    
    // تطبيق الفلاتر
    applyImageFilters();
    
    // إضافة الأحداث للفلاتر
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            playSound('click');
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilters.filter = this.dataset.filter;
            applyImageFilters();
        });
    });
    
    // إضافة الأحداث للمنزلقات
    document.getElementById('brightnessSlider').addEventListener('input', function() {
        currentFilters.brightness = this.value;
        document.getElementById('brightnessValue').textContent = this.value + '%';
        applyImageFilters();
    });
    
    document.getElementById('contrastSlider').addEventListener('input', function() {
        currentFilters.contrast = this.value;
        document.getElementById('contrastValue').textContent = this.value + '%';
        applyImageFilters();
    });
    
    document.getElementById('saturationSlider').addEventListener('input', function() {
        currentFilters.saturation = this.value;
        document.getElementById('saturationValue').textContent = this.value + '%';
        applyImageFilters();
    });
    
    // زر تطبيق التعديلات
    document.getElementById('applyFilterBtn').addEventListener('click', function() {
        playSound('click');
        saveEditedImage();
        showAlert("تم تطبيق التعديلات على الصورة", "success");
    });
    
    // زر إعادة تعيين
    document.getElementById('resetFilterBtn').addEventListener('click', function() {
        playSound('click');
        initImageEditorControls();
        showAlert("تم إعادة تعيين التعديلات", "warning");
    });
    
    // زر تنزيل الصورة المحررة
    document.getElementById('downloadEditedBtn').addEventListener('click', function() {
        playSound('click');
        downloadEditedImage();
    });
}

// تطبيق الفلاتر على الصورة
function applyImageFilters() {
    const ctx = imageCanvas.getContext('2d');
    ctx.filter = `
        brightness(${currentFilters.brightness}%)
        contrast(${currentFilters.contrast}%)
        saturate(${currentFilters.saturation}%)
        ${currentFilters.filter === 'grayscale' ? 'grayscale(100%)' : ''}
        ${currentFilters.filter === 'sepia' ? 'sepia(100%)' : ''}
        ${currentFilters.filter === 'blur' ? 'blur(5px)' : ''}
    `.trim();
    
    // إعادة رسم الصورة
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
    };
    img.src = imageCanvas.toDataURL();
}

// حفظ الصورة المحررة
function saveEditedImage() {
    const editedImageUrl = imageCanvas.toDataURL('image/jpeg', 0.9);
    
    // تحديث الصورة في localStorage
    let storedFiles = loadFromStorage("familyFiles", []);
    const storedFilesCopy = [...storedFiles];
    
    storedFiles.forEach((file, index) => {
        if (file.type === 'image' && file.album === currentAlbum) {
            const imageFiles = storedFilesCopy.filter(f => 
                f.type === 'image' && f.album === currentAlbum
            );
            
            if (imageFiles[currentImageIndex] && imageFiles[currentImageIndex].id === file.id) {
                storedFilesCopy[index].src = editedImageUrl;
                storedFilesCopy[index].size = editedImageUrl.length;
            }
        }
    });
    
    saveToStorage("familyFiles", storedFilesCopy);
    loadImages();
    updateStatistics();
}

// تنزيل الصورة المحررة
function downloadEditedImage() {
    const link = document.createElement('a');
    link.download = `edited_image_${Date.now()}.jpg`;
    link.href = imageCanvas.toDataURL('image/jpeg', 0.9);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("تم بدء تنزيل الصورة المحررة", "success");
}

// ========== عرض شرائح تلقائي ==========

function initSlideshow() {
    if (!slideshowBtn) return;
    
    let isPlaying = false;
    
    slideshowBtn.addEventListener('click', function() {
        playSound('click');
        if (!isPlaying) {
            startSlideshow();
            isPlaying = true;
            this.innerHTML = '<i class="fas fa-stop-circle"></i>';
            this.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
            showAlert("بدأ العرض التلقائي", "success");
        } else {
            stopSlideshow();
            isPlaying = false;
            this.innerHTML = '<i class="fas fa-play-circle"></i>';
            this.style.background = 'linear-gradient(45deg, #2aa198, #268bd2)';
            showAlert("توقف العرض التلقائي", "warning");
        }
    });
}

function startSlideshow() {
    const storedFiles = loadFromStorage("familyFiles", []);
    const albumImages = storedFiles.filter(item => 
        item.album === currentAlbum && item.type === 'image'
    );
    
    if (albumImages.length < 2) {
        showAlert("يحتاج الألبوم إلى صورتين على الأقل للعرض التلقائي", "warning");
        return;
    }
    
    let currentSlide = 0;
    
    slideshowInterval = setInterval(() => {
        // إخفاء جميع الصور
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach(item => item.style.opacity = '0.3');
        
        // إظهار الصورة الحالية
        if (galleryItems[currentSlide]) {
            galleryItems[currentSlide].style.opacity = '1';
            galleryItems[currentSlide].style.transform = 'scale(1.1)';
            galleryItems[currentSlide].style.zIndex = '100';
            galleryItems[currentSlide].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
        
        // الانتقال للصورة التالية
        currentSlide = (currentSlide + 1) % albumImages.length;
    }, 3000); // تغيير الصورة كل 3 ثوان
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
        
        // إعادة جميع الصور إلى وضعها الطبيعي
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach(item => {
            item.style.opacity = '1';
            item.style.transform = '';
            item.style.zIndex = '';
        });
    }
}

function addSlideshowControls() {
    const storedFiles = loadFromStorage("familyFiles", []);
    const albumImages = storedFiles.filter(item => 
        item.album === currentAlbum && item.type === 'image'
    );
    
    if (albumImages.length > 1) {
        // إضافة أزرار التنقل إذا لم تكن موجودة
        if (!document.querySelector('.slideshow-nav')) {
            const navDiv = document.createElement('div');
            navDiv.className = 'slideshow-nav';
            navDiv.style.cssText = `
                position: fixed;
                bottom: 220px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 999;
            `;
            
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            prevBtn.className = 'floating-action-btn';
            prevBtn.style.cssText = `
                width: 50px;
                height: 50px;
                font-size: 20px;
                background: linear-gradient(45deg, #2aa198, #268bd2);
            `;
            prevBtn.title = "الصورة السابقة";
            
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            nextBtn.className = 'floating-action-btn';
            nextBtn.style.cssText = `
                width: 50px;
                height: 50px;
                font-size: 20px;
                background: linear-gradient(45deg, #2aa198, #268bd2);
            `;
            nextBtn.title = "الصورة التالية";
            
            prevBtn.addEventListener('click', () => navigateSlideshow(-1));
            nextBtn.addEventListener('click', () => navigateSlideshow(1));
            
            navDiv.appendChild(prevBtn);
            navDiv.appendChild(nextBtn);
            document.body.appendChild(navDiv);
        }
    }
}

function navigateSlideshow(direction) {
    playSound('click');
    const storedFiles = loadFromStorage("familyFiles", []);
    const albumImages = storedFiles.filter(item => 
        item.album === currentAlbum && item.type === 'image'
    );
    
    if (albumImages.length === 0) return;
    
    const galleryItems = document.querySelectorAll('.gallery-item');
    const currentVisible = Array.from(galleryItems).findIndex(item => 
        item.style.opacity === '1' || getComputedStyle(item).opacity === '1'
    );
    
    let nextIndex = currentVisible + direction;
    if (nextIndex < 0) nextIndex = galleryItems.length - 1;
    if (nextIndex >= galleryItems.length) nextIndex = 0;
    
    // إخفاء جميع الصور
    galleryItems.forEach(item => {
        item.style.opacity = '0.3';
        item.style.transform = '';
        item.style.zIndex = '';
    });
    
    // إظهار الصورة المختارة
    if (galleryItems[nextIndex]) {
        galleryItems[nextIndex].style.opacity = '1';
        galleryItems[nextIndex].style.transform = 'scale(1.1)';
        galleryItems[nextIndex].style.zIndex = '100';
        galleryItems[nextIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// ========== تأثيرات إضافية للأزرار ==========

function addButtonEffects() {
    // تأثير النقر لجميع الأزرار
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('click', function() {
            // تأثير اهتزاز خفيف
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // تأثير عند المرور
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.2s ease';
        });
    });
    
    // تأثير للإدخالات
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = '';
        });
    });
}

// ========== التهيئة الأولية ==========

function initializeData() {
    // تحميل الألبومات
    albums = loadFromStorage("albumsList", ["عام"]);
    currentAlbum = localStorage.getItem("currentAlbum") || albums[0];
    currentAlbumName.textContent = currentAlbum;
    
    // تهيئة localStorage إذا كان فارغاً
    if (!localStorage.getItem("familyFiles")) {
        saveToStorage("familyFiles", []);
    }
    if (!localStorage.getItem("albumsList")) {
        saveToStorage("albumsList", ["عام"]);
    }
    
    // فحص وتصحيح بيانات localStorage
    checkAndFixStorage();
}

// دالة لفحص وتصحيح بيانات localStorage
function checkAndFixStorage() {
    try {
        const files = localStorage.getItem("familyFiles");
        if (files) {
            JSON.parse(files);
        }
    } catch (e) {
        console.error("خطأ في بيانات localStorage، جاري التصحيح...", e);
        localStorage.removeItem("familyFiles");
        saveToStorage("familyFiles", []);
        showAlert("تم تصحيح مشكلة التخزين", "warning");
    }
}

// ========== تحسينات للأداء ==========

// تنظيف الفترات الزمنية عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    stopSlideshow();
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
});

// دعم السحب والإفلات للرفع
document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.querySelector('.upload-section');
    
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.background = 'rgba(42, 161, 152, 0.2)';
            this.style.border = '2px dashed #2aa198';
        });
        
        dropZone.addEventListener('dragleave', function() {
            this.style.background = '';
            this.style.border = '';
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.background = '';
            this.style.border = '';
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        });
    }
});

// تهيئة شاشة القفل بتأثيرات عشوائية
function initLockScreenEffects() {
    const elements = document.querySelectorAll('.floating-element');
    elements.forEach((el, index) => {
        el.style.left = `${Math.random() * 90}%`;
        el.style.top = `${Math.random() * 90}%`;
        el.style.animationDuration = `${15 + Math.random() * 20}s`;
        el.style.animationDelay = `${Math.random() * 10}s`;
    });
}

// استدعاء عند تحميل الصفحة
setTimeout(initLockScreenEffects, 100);

// التحكم في جودة الصور للهواتف
function optimizeForMobile() {
    if (window.innerWidth <= 768) {
        // تقليل جودة الصور على الهواتف
        const images = document.querySelectorAll('#gallery img');
        images.forEach(img => {
            img.loading = 'lazy';
            img.decoding = 'async';
        });
    }
}

// تحديث عند تغيير حجم النافذة
window.addEventListener('resize', optimizeForMobile);
setTimeout(optimizeForMobile, 1000);

// دعم Service Worker للعمل بدون اتصال
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// إضافة حدث لمس لحقول الإدخال على الجوال
document.addEventListener('touchstart', function(){}, {passive: true});

// ========== نسخة احتياطية تلقائية ==========

function autoBackup() {
    const lastBackup = localStorage.getItem('lastBackup');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // يوم واحد بالميلي ثانية
    
    if (!lastBackup || (now - lastBackup > oneDay)) {
        const files = localStorage.getItem("familyFiles");
        const albums = localStorage.getItem("albumsList");
        
        if (files && albums) {
            const backup = {
                date: new Date().toISOString(),
                files: files,
                albums: albums,
                version: '1.0'
            };
            
            localStorage.setItem('backup', JSON.stringify(backup));
            localStorage.setItem('lastBackup', now);
            console.log("تم إنشاء نسخة احتياطية تلقائية");
        }
    }
}

// تشغيل النسخة الاحتياطية كل يوم
setInterval(autoBackup, 60 * 60 * 1000); // كل ساعة
setTimeout(autoBackup, 5000); // بعد 5 ثوان من التحميل