// ============================================
// PLATEFORME DE SIGNALEMENT DU VALIDISME
// JavaScript Principal
// ============================================

// ============================================
// VARIABLES GLOBALES
// ============================================
let uploadedFiles = [];
let uploadedFilesFALC = [];
let uploadedFilesCarnet = [];
let uploadedFilesCarnetFALC = [];
let carnetEntries = [];
let isRecording = false;
let isRecordingFALC = false;
let mediaRecorder = null;
let mediaRecorderFALC = null;
let audioChunks = [];
let audioChunksFALC = [];
let recordedAudio = null;
let recordedAudioFALC = null;

// ============================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Plateforme de Signalement du Validisme - Chargée');
    
    // Afficher la section À propos par défaut
    showSection('apropos');
    
    // Charger les entrées du carnet depuis localStorage
    loadCarnetFromStorage();
    
    // Initialiser les zones d'upload de fichiers
    initFileUploads();
    
    // Initialiser les formulaires
    initForms();
    
    // Navigation clavier
    initKeyboardNavigation();
    
    console.log('✅ Initialisation terminée');
});

// ============================================
// NAVIGATION ENTRE SECTIONS
// ============================================
function showSection(sectionId) {
    // Cacher toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Focus sur le titre pour l'accessibilité
        const heading = targetSection.querySelector('h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        }
        
        // Si c'est le carnet, mettre à jour l'affichage
        if (sectionId === 'carnet') {
            updateCarnetView();
            updateCarnetStats();
        }
    }
}

// ============================================
// BASCULEMENT VERSION NORMALE / FALC
// ============================================
function toggleSectionFALC(sectionName) {
    const normalVersion = document.getElementById(`${sectionName}-normal`);
    const falcVersion = document.getElementById(`${sectionName}-falc`);
    const toggleButton = document.querySelector(`button[onclick="toggleSectionFALC('${sectionName}')"]`);
    
    if (normalVersion && falcVersion) {
        const isNormalVisible = !normalVersion.classList.contains('hidden');
        
        normalVersion.classList.toggle('hidden');
        falcVersion.classList.toggle('hidden');
        
        // Mettre à jour le texte du bouton
        if (toggleButton) {
            if (isNormalVisible) {
                toggleButton.textContent = 'Version Standard';
            } else {
                toggleButton.textContent = 'Version Facile a Lire et a Comprendre FALC';
            }
        }
    }
}

// ============================================
// NAVIGATION CLAVIER
// ============================================
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Si on est dans un champ de formulaire, ne pas intercepter
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'SELECT') {
            return;
        }
        
        // Alt + chiffre pour naviguer
        if (e.altKey) {
            switch(e.key) {
                case '1':
                    showSection('apropos');
                    e.preventDefault();
                    break;
                case '2':
                    showSection('temoignage');
                    e.preventDefault();
                    break;
                case '3':
                    showSection('carnet');
                    e.preventDefault();
                    break;
                case '4':
                    showSection('violentometre');
                    e.preventDefault();
                    break;
                case '5':
                    showSection('legal');
                    e.preventDefault();
                    break;
                case '6':
                    showSection('aide');
                    e.preventDefault();
                    break;
            }
        }
    });
}
// ============================================
// GESTION DES FICHIERS - INITIALISATION
// ============================================
function initFileUploads() {
    setupFileUpload('dropZone', 'fileInput', 'imagePreview', uploadedFiles);
    setupFileUpload('dropZoneFALC', 'fileInputFALC', 'imagePreviewFALC', uploadedFilesFALC);
    setupFileUpload('dropZoneCarnet', 'fileInputCarnet', 'imagePreviewCarnet', uploadedFilesCarnet);
    setupFileUpload('dropZoneCarnetFALC', 'fileInputCarnetFALC', 'imagePreviewCarnetFALC', uploadedFilesCarnetFALC);
}

function setupFileUpload(dropZoneId, fileInputId, previewId, filesArray) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);
    
    if (!dropZone || !fileInput) return;
    
    // Clic sur la zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Accessibilité clavier
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
    
    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files, filesArray, preview);
    });
    
    // Sélection de fichiers
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files, filesArray, preview);
    });
}

function handleFiles(files, filesArray, preview) {
    if (!preview) return;
    
    Array.from(files).forEach(file => {
        // Vérifier la taille (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showAlert(`Fichier trop volumineux : ${file.name} (max 5MB)`, 'error');
            return;
        }
        
        // Vérifier le nombre (10 max)
        if (filesArray.length >= 10) {
            showAlert('Maximum 10 fichiers', 'warning');
            return;
        }
        
        filesArray.push(file);
        
        // Prévisualisation
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const container = document.createElement('div');
                container.className = 'image-preview-container relative';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'image-preview';
                img.alt = file.name;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.setAttribute('type', 'button');
                deleteBtn.setAttribute('aria-label', `Supprimer ${file.name}`);
                deleteBtn.onclick = () => removeFile(file, container, filesArray);
                
                container.appendChild(img);
                container.appendChild(deleteBtn);
                preview.appendChild(container);
            };
            reader.readAsDataURL(file);
        } else {
            // Pour les autres types
            const container = document.createElement('div');
            container.className = 'bg-gray-600 p-4 rounded-lg relative';
            container.innerHTML = `
                <p class="text-white text-sm truncate">${file.name}</p>
                <p class="text-gray-300 text-xs">${formatFileSize(file.size)}</p>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.setAttribute('type', 'button');
            deleteBtn.setAttribute('aria-label', `Supprimer ${file.name}`);
            deleteBtn.onclick = () => removeFile(file, container, filesArray);
            
            container.appendChild(deleteBtn);
            preview.appendChild(container);
        }
    });
}

function removeFile(file, container, filesArray) {
    const index = filesArray.indexOf(file);
    if (index > -1) {
        filesArray.splice(index, 1);
    }
    container.remove();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
// ============================================
// ENREGISTREMENT VOCAL
// ============================================
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                recordedAudio = audioBlob;
                
                const audioPreview = document.getElementById('audioPreview');
                if (audioPreview) {
                    audioPreview.innerHTML = `
                        <audio controls src="${audioUrl}" class="w-full"></audio>
                        <button type="button" onclick="deleteRecording()" class="mt-2 bg-red-600 text-white px-4 py-2 rounded">
                            Supprimer l'enregistrement
                        </button>
                    `;
                }
                
                stream.getTracks().forEach(track => track.stop());
            });
            
            mediaRecorder.start();
            isRecording = true;
            
            const btn = document.getElementById('recordBtn');
            const status = document.getElementById('recordingStatus');
            if (btn) {
                btn.textContent = 'Arrêter l\'enregistrement';
                btn.classList.add('bg-red-700');
            }
            if (status) status.textContent = '⏺ Enregistrement en cours...';
        })
        .catch(error => {
            console.error('Erreur microphone:', error);
            showAlert('Impossible d\'accéder au microphone', 'error');
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isRecording = false;
        
        const btn = document.getElementById('recordBtn');
        const status = document.getElementById('recordingStatus');
        if (btn) {
            btn.textContent = 'Démarrer l\'enregistrement';
            btn.classList.remove('bg-red-700');
        }
        if (status) status.textContent = '';
    }
}

function deleteRecording() {
    recordedAudio = null;
    const audioPreview = document.getElementById('audioPreview');
    if (audioPreview) audioPreview.innerHTML = '';
}

// Version FALC
function toggleRecordingFALC() {
    if (isRecordingFALC) {
        stopRecordingFALC();
    } else {
        startRecordingFALC();
    }
}

function startRecordingFALC() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorderFALC = new MediaRecorder(stream);
            audioChunksFALC = [];
            
            mediaRecorderFALC.addEventListener('dataavailable', event => {
                audioChunksFALC.push(event.data);
            });
            
            mediaRecorderFALC.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunksFALC, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                recordedAudioFALC = audioBlob;
                
                const audioPreview = document.getElementById('audioPreviewFALC');
                if (audioPreview) {
                    audioPreview.innerHTML = `
                        <audio controls src="${audioUrl}" class="w-full"></audio>
                        <button type="button" onclick="deleteRecordingFALC()" class="mt-2 bg-red-600 text-white px-4 py-2 rounded">
                            Supprimer
                        </button>
                    `;
                }
                
                stream.getTracks().forEach(track => track.stop());
            });
            
            mediaRecorderFALC.start();
            isRecordingFALC = true;
            
            const btn = document.getElementById('recordBtnFALC');
            const status = document.getElementById('recordingStatusFALC');
            if (btn) {
                btn.textContent = 'Arrêter';
                btn.classList.add('bg-red-700');
            }
            if (status) status.textContent = '⏺ En cours...';
        })
        .catch(error => {
            console.error('Erreur microphone:', error);
            showAlert('Problème avec le microphone', 'error');
        });
}

function stopRecordingFALC() {
    if (mediaRecorderFALC && mediaRecorderFALC.state !== 'inactive') {
        mediaRecorderFALC.stop();
        isRecordingFALC = false;
        
        const btn = document.getElementById('recordBtnFALC');
        const status = document.getElementById('recordingStatusFALC');
        if (btn) {
            btn.textContent = 'Démarrer';
            btn.classList.remove('bg-red-700');
        }
        if (status) status.textContent = '';
    }
}

function deleteRecordingFALC() {
    recordedAudioFALC = null;
    const audioPreview = document.getElementById('audioPreviewFALC');
    if (audioPreview) audioPreview.innerHTML = '';
}
// ============================================
// GESTION DES FORMULAIRES
// ============================================
function initForms() {
    // Formulaire témoignage normal
    const formNormal = document.getElementById('signalementForm');
    if (formNormal) {
        formNormal.addEventListener('submit', handleTemoignageSubmit);
    }
    
    // Formulaire témoignage FALC
    const formFALC = document.getElementById('signalementFormFALC');
    if (formFALC) {
        formFALC.addEventListener('submit', handleTemoignageSubmit);
    }
    
    // Formulaire carnet normal
    const carnetForm = document.getElementById('carnetForm');
    if (carnetForm) {
        carnetForm.addEventListener('submit', handleCarnetSubmit);
    }
    
    // Formulaire carnet FALC
    const carnetFormFALC = document.getElementById('carnetFormFALC');
    if (carnetFormFALC) {
        carnetFormFALC.addEventListener('submit', handleCarnetSubmit);
    }
    
    // Limiter les checkboxes de violence à 3
    limitViolenceCheckboxes();
}

function limitViolenceCheckboxes() {
    const forms = ['signalementForm', 'signalementFormFALC'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const checkboxes = form.querySelectorAll('input[name="violence"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checked = form.querySelectorAll('input[name="violence"]:checked');
                if (checked.length > 3) {
                    checkbox.checked = false;
                    showAlert('Maximum 3 types de violence', 'warning');
                }
            });
        });
    });
}

function handleTemoignageSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = collectFormData(form);
    
    // Générer le PDF
    generatePDF(form.id);
    
    // Préparer l'email
    const typeEnvoi = formData.typeEnvoi;
    let emailBody = '';
    
    if (typeEnvoi === 'stats') {
        emailBody = generateStatsEmail(formData);
    } else {
        emailBody = generateCompleteEmail(formData);
    }
    
    // Ouvrir le client email
    const subject = typeEnvoi === 'stats' ? 
        'Données statistiques - Validisme' : 
        'Témoignage complet - Validisme';
    
    const mailtoLink = `mailto:validisme_signalement@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    
    showAlert('✅ Email préparé ! N\'oubliez pas de l\'envoyer pour que votre témoignage soit comptabilisé.', 'success');
}

function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    // Données simples
    for (let [key, value] of formData.entries()) {
        if (value) {
            data[key] = value;
        }
    }
    
    // Checkboxes multiples - contexte
    const contextes = form.querySelectorAll('input[name="contexte"]:checked');
    data.contextes = Array.from(contextes).map(cb => cb.value);
    
    // Checkboxes multiples - violence
    const violences = form.querySelectorAll('input[name="violence"]:checked');
    data.violences = Array.from(violences).map(cb => cb.value);
    
    return data;
}

function generateStatsEmail(data) {
    let email = 'DONNÉES STATISTIQUES - VALIDISME\n\n';
    email += `Date d'envoi : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    email += '=== INFORMATIONS DÉMOGRAPHIQUES ===\n';
    if (data.age) email += `Âge : ${data.age}\n`;
    if (data.departement) email += `Département : ${data.departement}\n`;
    if (data.handicap) email += `Type de handicap : ${data.handicap}\n`;
    if (data.lieu) email += `Lieu de vie : ${data.lieu}\n`;
    
    email += '\n=== CONTEXTE ===\n';
    if (data.contextes && data.contextes.length > 0) {
        email += `Lieux : ${data.contextes.join(', ')}\n`;
    }
    if (data.violences && data.violences.length > 0) {
        email += `Types de violence : ${data.violences.join(', ')}\n`;
    }
    if (data.frequence) email += `Fréquence : ${data.frequence}\n`;
    if (data.impact) email += `Impact : ${data.impact}\n`;
    
    email += '\n---\n';
    email += 'Note : Témoignage anonyme, statistiques uniquement.\n';
    
    return email;
}

function generateCompleteEmail(data) {
    let email = 'TÉMOIGNAGE COMPLET - VALIDISME\n\n';
    email += `Date d'envoi : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    
    email += '=== TYPE DE CONTRIBUTION ===\n';
    email += `${data.action || 'Non spécifié'}\n\n`;
    
    email += '=== INFORMATIONS DÉMOGRAPHIQUES ===\n';
    if (data.age) email += `Âge : ${data.age}\n`;
    if (data.departement) email += `Département : ${data.departement}\n`;
    if (data.handicap) email += `Type de handicap : ${data.handicap}\n`;
    if (data.lieu) email += `Lieu de vie : ${data.lieu}\n`;
    
    email += '\n=== CONTEXTE ===\n';
    if (data.contextes && data.contextes.length > 0) {
        email += `Lieux : ${data.contextes.join(', ')}\n`;
    }
    if (data.violences && data.violences.length > 0) {
        email += `Types de violence : ${data.violences.join(', ')}\n`;
    }
    if (data.frequence) email += `Fréquence : ${data.frequence}\n`;
    if (data.impact) email += `Impact : ${data.impact}\n`;
    
    email += '\n=== TÉMOIGNAGE ===\n';
    email += `${data.description || ''}\n`;
    
    if (data.nom || data.email) {
        email += '\n=== CONTACT (optionnel) ===\n';
        if (data.nom) email += `Nom/Pseudonyme : ${data.nom}\n`;
        if (data.email) email += `Email : ${data.email}\n`;
    }
    
    email += '\n---\n';
    email += 'Fichiers joints : voir PDF ci-joint\n';
    
    return email;
}
// ============================================
// GÉNÉRATION PDF
// ============================================
function generatePDF(formId) {
    if (typeof jspdf === 'undefined') {
        showAlert('Erreur : bibliothèque PDF non chargée', 'error');
        return;
    }
    
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    const form = document.getElementById(formId);
    const formData = collectFormData(form);
    
    let yPosition = 20;
    
    // Titre
    doc.setFontSize(18);
    doc.text('TÉMOIGNAGE DE VALIDISME', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 10;
    
    // Contenu
    doc.setFontSize(10);
    
    for (const [key, value] of Object.entries(formData)) {
        if (value && yPosition < 280) {
            const text = `${key}: ${value}`;
            const lines = doc.splitTextToSize(text, 170);
            
            lines.forEach(line => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 20, yPosition);
                yPosition += 7;
            });
        }
    }
    
    // Sauvegarder
    const filename = `temoignage-validisme-${Date.now()}.pdf`;
    doc.save(filename);
    
    showAlert('✅ PDF généré avec succès !', 'success');
}
// ============================================
// CARNET DE PREUVES
// ============================================
function handleCarnetSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = collectFormData(form);
    
    // Créer une entrée
    const entry = {
        id: Date.now(),
        date: formData.date,
        heure: formData.heure || '',
        lieu: formData.lieu,
        type: formData.type,
        personnes: formData.personnes || '',
        description: formData.description,
        temoins: formData.temoins || '',
        liens: formData.liens || '',
        impact: formData.impact || '',
        contexte: formData.contexte || '',
        timestamp: new Date().toISOString()
    };
    
    // Ajouter
    carnetEntries.push(entry);
    
    // Sauvegarder
    saveCarnetToStorage();
    
    // Réinitialiser
    form.reset();
    if (recordedAudio) deleteRecording();
    if (recordedAudioFALC) deleteRecordingFALC();
    
    // Vider fichiers
    const isFALC = form.id.includes('FALC');
    if (isFALC) {
        uploadedFilesCarnetFALC = [];
        const preview = document.getElementById('imagePreviewCarnetFALC');
        if (preview) preview.innerHTML = '';
    } else {
        uploadedFilesCarnet = [];
        const preview = document.getElementById('imagePreviewCarnet');
        if (preview) preview.innerHTML = '';
    }
    
    // Mettre à jour
    updateCarnetView();
    updateCarnetStats();
    
    showAlert('✅ Entrée enregistrée dans votre carnet !', 'success');
}

function saveCarnetToStorage() {
    try {
        localStorage.setItem('carnetValidisme', JSON.stringify(carnetEntries));
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showAlert('Erreur de sauvegarde. Exportez en PDF !', 'error');
    }
}

function loadCarnetFromStorage() {
    try {
        const stored = localStorage.getItem('carnetValidisme');
        if (stored) {
            carnetEntries = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Erreur chargement:', error);
    }
}

function updateCarnetStats() {
    const total = carnetEntries.length;
    
    // 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30 = carnetEntries.filter(e => new Date(e.date) >= thirtyDaysAgo).length;
    
    // Personnes uniques
    const allPersons = carnetEntries
        .map(e => e.personnes)
        .filter(p => p)
        .join(',')
        .split(',')
        .map(p => p.trim())
        .filter(p => p);
    const uniquePersons = new Set(allPersons).size;
    
    // Mettre à jour affichage
    const updates = [
        { id: 'totalEntries', value: total },
        { id: 'totalEntriesFALC', value: total },
        { id: 'last30Days', value: last30 },
        { id: 'last30DaysFALC', value: last30 },
        { id: 'uniquePersons', value: uniquePersons },
        { id: 'uniquePersonsFALC', value: uniquePersons }
    ];
    
    updates.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Mettre à jour filtres
    updatePersonFilters(allPersons);
}

function updatePersonFilters(allPersons) {
    const uniquePersons = [...new Set(allPersons)].filter(p => p).sort();
    
    const selects = ['filterPerson', 'filterPersonFALC'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Toutes les personnes</option>';
            
            uniquePersons.forEach(person => {
                const option = document.createElement('option');
                option.value = person;
                option.textContent = person;
                select.appendChild(option);
            });
        }
    });
}
function updateCarnetView(isFALC = false) {
    const viewMode = document.getElementById(isFALC ? 'viewModeFALC' : 'viewMode')?.value || 'chronologique';
    const filterType = document.getElementById(isFALC ? 'filterTypeFALC' : 'filterType')?.value || '';
    const filterPeriod = document.getElementById(isFALC ? 'filterPeriodFALC' : 'filterPeriod')?.value || '';
    const filterPerson = document.getElementById(isFALC ? 'filterPersonFALC' : 'filterPerson')?.value || '';
    
    let filtered = [...carnetEntries];
    
    // Appliquer filtres
    if (filterType) {
        filtered = filtered.filter(e => e.type === filterType);
    }
    
    if (filterPeriod) {
        const days = parseInt(filterPeriod);
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        filtered = filtered.filter(e => new Date(e.date) >= dateLimit);
    }
    
    if (filterPerson) {
        filtered = filtered.filter(e => 
            e.personnes && e.personnes.toLowerCase().includes(filterPerson.toLowerCase())
        );
    }
    
    // Trier
    switch(viewMode) {
        case 'chronologique':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'type':
            filtered.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case 'lieu':
            filtered.sort((a, b) => a.lieu.localeCompare(b.lieu));
            break;
        case 'personne':
            filtered.sort((a, b) => (a.personnes || '').localeCompare(b.personnes || ''));
            break;
        case 'frequence':
            const typeCount = {};
            carnetEntries.forEach(e => {
                typeCount[e.type] = (typeCount[e.type] || 0) + 1;
            });
            filtered.sort((a, b) => typeCount[b.type] - typeCount[a.type]);
            break;
    }
    
    // Afficher
    const containerId = isFALC ? 'carnetEntriesFALC' : 'carnetEntries';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-gray-300 text-center py-8 ${isFALC ? 'text-lg' : ''}">Aucune entrée.</p>`;
        return;
    }
    
    container.innerHTML = filtered.map(entry => renderCarnetEntry(entry)).join('');
}

function renderCarnetEntry(entry) {
    const typeLabels = {
        'discrimination': 'Discrimination',
        'harcelement': 'Harcèlement',
        'violence_physique': 'Violence physique',
        'violence_psychologique': 'Violence psychologique',
        'violence_sexuelle': 'Violence sexuelle',
        'negligence': 'Négligence',
        'violence_economique': 'Violence économique',
        'violence_institutionnelle': 'Violence institutionnelle',
        'violence_medicale': 'Violence médicale',
        'diffamation': 'Diffamation',
        'injure_publique': 'Injure publique',
        'sabotage': 'Sabotage',
        'autre': 'Autre'
    };
    
    return `
        <div class="carnet-entry">
            <div class="carnet-entry-header">
                <div>
                    <span class="carnet-entry-date">${formatDate(entry.date)} ${entry.heure ? `à ${entry.heure}` : ''}</span>
                    <span class="carnet-entry-type">${typeLabels[entry.type] || entry.type}</span>
                </div>
                <div class="carnet-entry-actions">
                    <button onclick="deleteEntry(${entry.id})" class="carnet-entry-btn bg-red-600 hover:bg-red-700 text-white">
                        Supprimer
                    </button>
                </div>
            </div>
            <div class="text-gray-300 mt-2">
                <p><strong>Lieu :</strong> ${entry.lieu}</p>
                ${entry.personnes ? `<p><strong>Personnes :</strong> ${entry.personnes}</p>` : ''}
                <p class="mt-2">${entry.description}</p>
                ${entry.temoins ? `<p class="mt-2"><strong>Témoins :</strong> ${entry.temoins}</p>` : ''}
                ${entry.liens ? `<p class="mt-2"><strong>Liens :</strong> ${entry.liens}</p>` : ''}
                ${entry.impact ? `<p class="mt-2"><strong>Impact :</strong> ${entry.impact}</p>` : ''}
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function deleteEntry(id) {
    if (confirm('Supprimer cette entrée ?')) {
        carnetEntries = carnetEntries.filter(e => e.id !== id);
        saveCarnetToStorage();
        updateCarnetView();
        updateCarnetStats();
        showAlert('✅ Entrée supprimée', 'success');
    }
}

function updateCarnetViewFALC() {
    updateCarnetView(true);
}
function exportCarnetToPDF(isFALC = false) {
    if (carnetEntries.length === 0) {
        showAlert('Votre carnet est vide', 'warning');
        return;
    }
    
    if (typeof jspdf === 'undefined') {
        showAlert('Erreur : bibliothèque PDF non chargée', 'error');
        return;
    }
    
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    let yPosition = 20;
    
    doc.setFontSize(18);
    doc.text('MON CARNET DE PREUVES', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Nombre d'entrées : ${carnetEntries.length}`, 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    
    carnetEntries.forEach((entry, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`Entrée ${index + 1} - ${formatDate(entry.date)}`, 20, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        doc.text(`Type : ${entry.type}`, 20, yPosition);
        yPosition += 5;
        doc.text(`Lieu : ${entry.lieu}`, 20, yPosition);
        yPosition += 5;
        
        if (entry.personnes) {
            doc.text(`Personnes : ${entry.personnes}`, 20, yPosition);
            yPosition += 5;
        }
        
        const descLines = doc.splitTextToSize(entry.description, 170);
        descLines.forEach(line => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            doc.text(line, 20, yPosition);
            yPosition += 5;
        });
        
        yPosition += 5;
    });
    
    const filename = `carnet-preuves-validisme-${Date.now()}.pdf`;
    doc.save(filename);
    
    showAlert('✅ Carnet exporté en PDF !', 'success');
}

function exportFilteredToPDF(isFALC = false) {
    showAlert('Export de la sélection à venir', 'info');
}
// ============================================
// ALERTES
// ============================================
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-md shadow-lg`;
    alertDiv.textContent = message;
    alertDiv.setAttribute('role', 'alert');
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Animation CSS
if (!document.getElementById('alertStyles')) {
    const style = document.createElement('style');
    style.id = 'alertStyles';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// EXPOSER LES FONCTIONS GLOBALEMENT
// ============================================
window.showSection = showSection;
window.toggleSectionFALC = toggleSectionFALC;
window.generatePDF = generatePDF;
window.toggleRecording = toggleRecording;
window.toggleRecordingFALC = toggleRecordingFALC;
window.deleteRecording = deleteRecording;
window.deleteRecordingFALC = deleteRecordingFALC;
window.updateCarnetView = updateCarnetView;
window.updateCarnetViewFALC = updateCarnetViewFALC;
window.updateCarnetStats = updateCarnetStats;
window.deleteEntry = deleteEntry;
window.exportCarnetToPDF = exportCarnetToPDF;
window.exportFilteredToPDF = exportFilteredToPDF;

console.log('✅ Script JavaScript chargé avec succès');

