// كلمة المرور الرئيسية
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

// متغيرات التطبيق
let albums = [];
let currentAlbum = "عام";

// ========== وظائف المساعدة ==========

// إظهار رسالة تنبيه
function showAlert(message, type = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert ${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    alertDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    document.body.appendChild(alertDiv);
    
    // إزالة التنبيه بعد 3 ثوان
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
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

// ========== نظام المصادقة ==========

// فتح المعرض عند النقر على زر الفتح
unlockBtn.onclick = unlockGallery;

// فتح المعرض عند الضغط على Enter في حقل كلمة المرور
passwordInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        unlockGallery();
    }
});

// التركيز على حقل كلمة المرور عند تحميل الصفحة
window.onload = function() {
    passwordInput.focus();
    
    // تحميل البيانات الأساسية
    initializeData();
};

function unlockGallery() {
    const entered = passwordInput.value.trim();
    
    if (entered === REAL_PASSWORD) {
        // إخفاء شاشة القفل
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
            
            showAlert("مرحباً بك Houssem في معرض العائلة!", "success");
        }, 500);
    } else {
        // عرض رسالة الخطأ
        errorMsg.style.display = "block";
        errorMsg.classList.add("shake");
        
        // تفريغ الحقل وإعادة التركيز
        passwordInput.value = "";
        passwordInput.focus();
        
        setTimeout(() => {
            errorMsg.style.display = "none";
            errorMsg.classList.remove("shake");
        }, 3000);
    }
}

// ========== إدارة الألبومات ==========

// إنشاء أو التبديل إلى ألبوم
createAlbumBtn.onclick = function() {
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
};

// حذف الألبوم الحالي
deleteAlbumBtn.onclick = function() {
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
    
    showAlert(`تم حذف الألبوم "${currentAlbum}"`, "success");
};

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
        
        btn.onclick = function() {
            currentAlbum = album;
            localStorage.setItem("currentAlbum", currentAlbum);
            currentAlbumName.textContent = currentAlbum;
            loadImages();
            renderAlbumButtons();
        };
        
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

// رفع الملفات
fileInput.addEventListener("change", function(event) {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
        return;
    }
    
    let storedFiles = loadFromStorage("familyFiles", []);
    let totalFiles = files.length;
    let processedFiles = 0;
    let uploadedFiles = 0;
    
    // تحديد الحد الأقصى لحجم الملف (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    // إظهار شريط التقدم
    updateProgressBar(0);
    
    // معالجة كل ملف
    Array.from(files).forEach((file, index) => {
        // التحقق من حجم الملف
        if (file.size > MAX_FILE_SIZE) {
            showAlert(`تم تخطي الملف "${file.name}" لأنه أكبر من 10MB`, "warning");
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
    albumFiles.forEach(file => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "gallery-item";
        itemDiv.dataset.id = file.id;
        
        let mediaElement;
        
        if (file.type === "image") {
            mediaElement = document.createElement("img");
            mediaElement.src = file.src;
            mediaElement.alt = file.name || "صورة عائلية";
            mediaElement.loading = "lazy";
        } else {
            mediaElement = document.createElement("video");
            mediaElement.src = file.src;
            mediaElement.controls = true;
            mediaElement.preload = "metadata";
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
        deleteOverlay.onclick = function(e) {
            e.stopPropagation();
            deleteFile(file.id);
        };
        
        itemDiv.appendChild(mediaElement);
        itemDiv.appendChild(deleteOverlay);
        gallery.appendChild(itemDiv);
    });
}

// حذف ملف
function deleteFile(fileId) {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) {
        return;
    }
    
    let storedFiles = loadFromStorage("familyFiles", []);
    const initialLength = storedFiles.length;
    
    storedFiles = storedFiles.filter(item => item.id !== fileId);
    
    if (storedFiles.length < initialLength) {
        saveToStorage("familyFiles", storedFiles);
        loadImages();
        showAlert("تم حذف الملف بنجاح", "success");
    }
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
}

// ========== تحسينات للأداء ==========

// تنظيف الفترات الزمنية عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    // يمكن إضافة أي تنظيف هنا
});

// إضافة حدث لمس لحقول الإدخال على الجوال
document.addEventListener('touchstart', function(){}, {passive: true});