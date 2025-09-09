document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const mainSections = document.querySelectorAll('main > section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const themeLightBtn = document.getElementById('theme-light-btn');
    const themeGrayBtn = document.getElementById('theme-gray-btn');
    const themeSolarizedBtn = document.getElementById('theme-solarized-btn');
    const themeBlackBtn = document.getElementById('theme-black-btn');
    const deckList = document.getElementById('deck-list');
    const addDeckBtn = document.getElementById('add-deck-btn');
    const addFlashcardGlobalBtn = document.getElementById('add-flashcard-global-btn');
    const importDeckBtn = document.getElementById('import-deck-btn');
    const deckFileInput = document.getElementById('deck-file-input');
    const flashcardArea = document.getElementById('flashcard-area');
    const ratingControls = document.getElementById('rating-controls');
    const ratingButtons = document.querySelectorAll('.rating-btn');
    const nextBtn = document.getElementById('next-btn');
    const downloadDeckBtn = document.getElementById('download-deck-btn');
    const addCardBtn = document.getElementById('add-card-btn');
    const backToDecksBtn = document.getElementById('back-to-decks-btn');
    const addCardForm = document.getElementById('add-card-form');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const docsList = document.getElementById('docs-list');
    const addDocBtn = document.getElementById('add-doc-btn');
    const importDocBtn = document.getElementById('import-doc-btn');
    const docFileInput = document.getElementById('doc-file-input');
    const docsListView = document.getElementById('docs-list-view');
    const docEditorView = document.getElementById('doc-editor-view');
    const saveDocBtn = document.getElementById('save-doc-btn');
    const downloadDocBtn = document.getElementById('download-doc-btn');
    const cancelDocBtn = document.getElementById('cancel-doc-btn');
    const docTitleInput = document.getElementById('doc-title-input');
    const docSubjectInput = document.getElementById('doc-subject-input');
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const pomodoroTimerDisplay = document.getElementById('pomodoro-timer');
    const pomodoroStartBtn = document.getElementById('pomodoro-start-btn');
    const pomodoroPauseBtn = document.getElementById('pomodoro-pause-btn');
    const pomodoroResetBtn = document.getElementById('pomodoro-reset-btn');
    const pomodoroStudyTimeInput = document.getElementById('pomodoro-study-time');
    const pomodoroBreakTimeInput = document.getElementById('pomodoro-break-time');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const addEventTypeForm = document.getElementById('add-event-type-form');
    const eventTypeNameInput = document.getElementById('event-type-name');
    const eventTypeColorInput = document.getElementById('event-type-color');
    const eventTypesList = document.getElementById('event-types-list');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const notificationToast = document.getElementById('notification-toast');
    const bulkImportForm = document.getElementById('bulk-import-form');
    const bulkImportModeBtn = document.getElementById('bulk-import-mode-btn');
    const singleCardModeBtn = document.getElementById('single-card-mode-btn');
    const deckProgressFill = document.getElementById('deck-progress-fill');
    const deckProgressText = document.getElementById('deck-progress-text');
    const docReaderModal = document.getElementById('doc-reader-modal');
    const docReaderTitle = document.getElementById('doc-reader-title');
    const docReaderContent = document.getElementById('doc-reader-content');
    const createFlashcardFromNoteBtn = document.getElementById('create-flashcard-from-note-btn');
    const deckSelectorModal = document.getElementById('deck-selector-modal');
    const deckSelectorList = document.getElementById('deck-selector-list');

    // --- Estado de la Aplicación ---
    let decks = JSON.parse(localStorage.getItem('flashcardDecks')) || [];
    let docs = JSON.parse(localStorage.getItem('studyDocs')) || {};
    let tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
    let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')) || {};
    let eventTypes = JSON.parse(localStorage.getItem('calendarEventTypes')) || [{id: 'default', name: 'Estudio', color: '#2ecc71'}];
    let currentDeckIndex = -1, currentCardIndex = 0, editingDocId = null, onDeckSelectedCallback = null;
    let currentDate = new Date();
    
    const quillToolbarOptions = [[{ 'font': [] }],['bold', 'italic', 'underline'],[{ 'list': 'ordered'}, { 'list': 'bullet' }],[{ 'background': [] }],['image']];
    let quill = new Quill('#editor-container', { theme: 'snow', modules: { toolbar: quillToolbarOptions } });

    // --- LÓGICA GENERAL (NAVEGACIÓN, TEMAS, MODAL, NOTIFICACIONES) ---
    function showSection(targetId) {
        mainSections.forEach(s => s.style.display = 'none');
        document.getElementById(targetId).style.display = 'block';
        navButtons.forEach(b => b.classList.remove('active'));
        const activeButton = document.querySelector(`[data-target="${targetId}"]`);
        if (activeButton) activeButton.classList.add('active');
    }
    function setTheme(theme) { document.body.className = theme; localStorage.setItem('selectedTheme', theme); }
    function showNotification(message, type = 'success') {
        notificationToast.textContent = message;
        notificationToast.className = type === 'error' ? 'error' : '';
        notificationToast.classList.add('show');
        setTimeout(() => {
            notificationToast.classList.remove('show');
        }, 3000);
    }
    
    // --- LÓGICA DE FLASHCARDS ---
    function saveDecks() { localStorage.setItem('flashcardDecks', JSON.stringify(decks)); }
    function renderDecks() {
        deckList.innerHTML = '';
        decks.forEach((deck, index) => {
            const card = document.createElement('div');
            card.className = 'deck-card';
            card.innerHTML = `<span>${deck.name} (${deck.cards.length})</span><div class="doc-item-buttons"><button class="delete-deck-btn" data-index="${index}">Eliminar</button></div>`;
            card.querySelector('span').addEventListener('click', () => {
                currentDeckIndex = index;
                showNextCard();
                document.getElementById('current-deck-title').textContent = deck.name;
                showSection('flashcard-view-container');
            });
            deckList.appendChild(card);
        });
    }
    function updateDeckProgress() {
        const deck = decks[currentDeckIndex];
        if (!deck || deck.cards.length === 0) {
            deckProgressFill.style.width = '0%';
            deckProgressText.textContent = 'N/A';
            return;
        }
        const masteredCards = deck.cards.filter(card => (card.masteryLevel || 1) > 3).length;
        const masteryPercentage = Math.round((masteredCards / deck.cards.length) * 100);
        deckProgressFill.style.width = `${masteryPercentage}%`;
        deckProgressText.textContent = `${masteryPercentage}%`;
    }
    function showNextCard() {
        const deck = decks[currentDeckIndex];
        if (!deck || deck.cards.length === 0) {
            flashcardArea.innerHTML = '<p>Este mazo no tiene flashcards. ¡Añade una!</p>';
            ratingControls.style.display = 'none'; nextBtn.style.display = 'none';
            updateDeckProgress(); return;
        }
        nextBtn.style.display = 'block';
        const weightedPool = [];
        deck.cards.forEach((card, index) => {
            const mastery = card.masteryLevel || 1;
            const weight = Math.max(1, 11 - (mastery * 2));
            for (let i = 0; i < weight; i++) weightedPool.push(index);
        });
        currentCardIndex = weightedPool[Math.floor(Math.random() * weightedPool.length)];
        renderFlashcard();
        updateDeckProgress();
    }
    function renderFlashcard() {
        const card = decks[currentDeckIndex].cards[currentCardIndex];
        flashcardArea.innerHTML = '';
        const cardContainer = document.createElement('div');
        cardContainer.className = 'flashcard-container';
        cardContainer.innerHTML = `<div class="flashcard"><div class="flashcard-face flashcard-front">${card.front}</div><div class="flashcard-face flashcard-back">${card.back}</div></div>`;
        flashcardArea.appendChild(cardContainer);
        const flashcardElement = cardContainer.querySelector('.flashcard');
        flashcardElement.addEventListener('click', () => {
            flashcardElement.classList.toggle('flipped');
            ratingControls.style.display = flashcardElement.classList.contains('flipped') ? 'block' : 'none';
        });
        ratingControls.style.display = 'none';
    }
    function downloadDeck() {
        const deck = decks[currentDeckIndex];
        if (!deck) return;
        const dataStr = JSON.stringify(deck, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `${deck.name.replace(/ /g, '_')}.json`; a.click(); URL.revokeObjectURL(a.href);
    }
    function importDeckFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedDeck = JSON.parse(e.target.result);
                if (importedDeck && typeof importedDeck.name === 'string' && Array.isArray(importedDeck.cards)) {
                    decks.push(importedDeck); saveDecks(); renderDecks();
                    showNotification(`Mazo "${importedDeck.name}" importado.`);
                } else { showNotification('Error: Archivo de mazo no válido.', 'error'); }
            } catch (error) { showNotification('Error al leer el archivo.', 'error'); }
            deckFileInput.value = "";
        };
        reader.readAsText(file);
    }
     function showDeckSelector(callback) {
        onDeckSelectedCallback = callback;
        deckSelectorList.innerHTML = '';
        if (decks.length === 0) {
            showNotification('Primero debes crear un mazo.', 'error');
            return;
        }
        decks.forEach((deck, index) => {
            const deckItem = document.createElement('div');
            deckItem.className = 'deck-selector-item';
            deckItem.textContent = deck.name;
            deckItem.dataset.index = index;
            deckSelectorList.appendChild(deckItem);
        });
        deckSelectorModal.style.display = 'block';
    }


    // --- LÓGICA DE NOTAS ---
    function saveDocs() { localStorage.setItem('studyDocs', JSON.stringify(docs)); }
    function renderDocs() {
        docsList.innerHTML = '';
        Object.keys(docs).sort().forEach(subject => {
            const group = document.createElement('div');
            group.className = 'doc-group';
            group.innerHTML = `<h3>${subject}</h3>`;
            docs[subject].forEach(doc => {
                const item = document.createElement('div');
                item.className = 'doc-item';
                item.innerHTML = `<span>${doc.title}</span><div class="doc-item-buttons"><button class="read-doc-btn" data-id="${doc.id}">Leer</button><button class="edit-doc-btn" data-id="${doc.id}">Editar</button><button class="delete-doc-btn" data-id="${doc.id}">Eliminar</button></div>`;
                group.appendChild(item);
            });
            docsList.appendChild(group);
        });
    }
    function showNoteEditor(docId = null) {
        editingDocId = docId;
        if (docId) {
            let docToEdit, subject;
            for (const subj in docs) { docToEdit = docs[subj].find(d => d.id === docId); if (docToEdit) { subject = subj; break; } }
            if (docToEdit) {
                docTitleInput.value = docToEdit.title; docSubjectInput.value = subject; quill.root.innerHTML = docToEdit.content;
                downloadDocBtn.style.display = 'inline-block';
            }
        } else {
            docTitleInput.value = ''; docSubjectInput.value = ''; quill.setText('');
            downloadDocBtn.style.display = 'none';
        }
        docsListView.style.display = 'none'; docEditorView.style.display = 'block';
    }
    function saveCurrentDoc() {
        const subject = docSubjectInput.value.trim() || 'General'; const title = docTitleInput.value.trim(); const content = quill.root.innerHTML;
        if (!title) return showNotification('El título es obligatorio.', 'error');
        if (editingDocId) {
            for (const subj in docs) {
                const docIndex = docs[subj].findIndex(d => d.id === editingDocId);
                if (docIndex !== -1) {
                    const [doc] = docs[subj].splice(docIndex, 1);
                    if (docs[subj].length === 0) delete docs[subj];
                    if (!docs[subject]) docs[subject] = [];
                    docs[subject].push({ ...doc, title, content }); break;
                }
            }
        } else {
            if (!docs[subject]) docs[subject] = [];
            docs[subject].push({ id: Date.now().toString(), title, content });
        }
        saveDocs(); renderDocs();
        docsListView.style.display = 'block'; docEditorView.style.display = 'none';
        showNotification('Nota guardada con éxito.');
    }
    function downloadNote() {
        const title = docTitleInput.value.trim() || "nota_sin_titulo";
        const content = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title></head><body>${quill.root.innerHTML}</body></html>`;
        const blob = new Blob([content], { type: 'text/html' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title.replace(/ /g, '_')}.html`;
        a.click(); URL.revokeObjectURL(a.href);
    }
    function importNoteFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const title = file.name.replace(/\.html$/, '').replace(/_/g, ' ');
            const content = e.target.result; const subject = 'Importado';
            if (!docs[subject]) docs[subject] = [];
            docs[subject].push({ id: Date.now().toString(), title, content });
            saveDocs(); renderDocs(); showNotification(`Nota "${title}" importada.`);
            docFileInput.value = "";
        };
        reader.readAsText(file);
    }

    // --- LÓGICA DE TAREAS ---
    function saveTasks() { localStorage.setItem('studyTasks', JSON.stringify(tasks)); }
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = task.completed ? 'completed' : '';
            li.innerHTML = `<span class="task-text" data-index="${index}">${task.text}</span><button class="delete-task-btn" data-index="${index}">X</button>`;
            taskList.appendChild(li);
        });
    }

    // --- LÓGICA DE POMODORO (ROBUSTA) ---
    let pomodoroInterval;

    function pomodoroTick() {
        const state = JSON.parse(localStorage.getItem('pomodoroState'));
        if (!state || state.status !== 'running') {
            clearInterval(pomodoroInterval);
            return;
        }

        const timeLeft = Math.round((state.endTime - Date.now()) / 1000);

        if (timeLeft < 0) {
            clearInterval(pomodoroInterval);
            const nextIsStudy = state.sessionType !== 'study';
            const nextDuration = nextIsStudy ? (pomodoroStudyTimeInput.value || 25) : (pomodoroBreakTimeInput.value || 5);
            
            startPomodoroTimer(nextIsStudy, nextDuration * 60);
            return;
        }
        updatePomodoroDisplay(timeLeft, state.sessionType);
    }

    function updatePomodoroDisplay(seconds, sessionType) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        pomodoroTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        pomodoroTimerDisplay.className = sessionType === 'study' ? 'pomodoro-study' : 'pomodoro-break';
    }
    
    function startPomodoroTimer(isStudySession, durationSeconds) {
        const now = Date.now();
        const endTime = now + durationSeconds * 1000;
        const state = {
            status: 'running',
            sessionType: isStudySession ? 'study' : 'break',
            endTime: endTime,
            timeLeftOnPause: null
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
        clearInterval(pomodoroInterval);
        pomodoroInterval = setInterval(pomodoroTick, 1000);
        pomodoroTick(); 
    }

    function handleStartClick() {
        let state = JSON.parse(localStorage.getItem('pomodoroState'));
        if (!state || state.status === 'stopped') {
            startPomodoroTimer(true, (pomodoroStudyTimeInput.value || 25) * 60);
        } else if (state.status === 'paused') {
            const durationSeconds = state.timeLeftOnPause;
            startPomodoroTimer(state.sessionType === 'study', durationSeconds);
        }
    }

    function handlePauseClick() {
        clearInterval(pomodoroInterval);
        let state = JSON.parse(localStorage.getItem('pomodoroState'));
        if (state && state.status === 'running') {
            const timeLeftOnPause = Math.round((state.endTime - Date.now()) / 1000);
            state.status = 'paused';
            state.timeLeftOnPause = timeLeftOnPause > 0 ? timeLeftOnPause : 0;
            localStorage.setItem('pomodoroState', JSON.stringify(state));
        }
    }

    function handleResetClick() {
        clearInterval(pomodoroInterval);
        localStorage.removeItem('pomodoroState');
        const studyTime = pomodoroStudyTimeInput.value || 25;
        updatePomodoroDisplay(studyTime * 60, 'study');
    }

    function initializePomodoro() {
        const state = JSON.parse(localStorage.getItem('pomodoroState'));
        if (!state) {
            handleResetClick();
            return;
        }
        if (state.status === 'running') {
            pomodoroInterval = setInterval(pomodoroTick, 1000);
            pomodoroTick();
        } else if (state.status === 'paused') {
            updatePomodoroDisplay(state.timeLeftOnPause, state.sessionType);
        } else {
            handleResetClick();
        }
    }

    // --- LÓGICA DE CALENDARIO ---
    function saveCalendarEvents() { localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents)); }
    function saveEventTypes() { localStorage.setItem('calendarEventTypes', JSON.stringify(eventTypes)); }
    function renderEventTypes() {
        eventTypesList.innerHTML = '';
        eventTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'event-type-item'; item.style.backgroundColor = type.color;
            item.innerHTML = `<span>${type.name}</span><span class="delete-event-btn" data-id="${type.id}"> X</span>`;
            eventTypesList.appendChild(item);
        });
    }
    function renderCalendar() {
        calendarGrid.innerHTML = ''; const year = currentDate.getFullYear(); const month = currentDate.getMonth();
        const monthKey = `${year}-${month}`;
        currentMonthDisplay.textContent = new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) calendarGrid.insertAdjacentHTML('beforeend', '<div class="day-box empty"></div>');
        for (let day = 1; day <= daysInMonth; day++) {
            const box = document.createElement('div');
            box.className = 'day-box'; box.textContent = day; box.dataset.day = day;
            const eventId = calendarEvents[monthKey]?.[day];
            if (eventId) { const eventType = eventTypes.find(t => t.id === eventId); if (eventType) box.style.backgroundColor = eventType.color; }
            calendarGrid.appendChild(box);
        }
    }
    function handleDayClick(e) {
        document.querySelector('.day-event-menu')?.remove();
        const dayBox = e.target.closest('.day-box');
        if (!dayBox || !dayBox.dataset.day) return;
        const day = dayBox.dataset.day; const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        const menu = document.createElement('div'); menu.className = 'day-event-menu';
        eventTypes.forEach(type => {
            const item = document.createElement('div'); item.textContent = type.name; item.style.backgroundColor = type.color;
            item.onclick = () => { if (!calendarEvents[monthKey]) calendarEvents[monthKey] = {}; calendarEvents[monthKey][day] = type.id; saveCalendarEvents(); renderCalendar(); menu.remove(); };
            menu.appendChild(item);
        });
        const removeItem = document.createElement('div'); removeItem.textContent = 'Quitar evento';
        removeItem.onclick = () => { if (calendarEvents[monthKey]?.[day]) { delete calendarEvents[monthKey][day]; saveCalendarEvents(); renderCalendar(); } menu.remove(); };
        menu.appendChild(removeItem); dayBox.appendChild(menu);
    }

    // ======================= EVENT LISTENERS =======================
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target; showSection(target);
            if (target === 'deck-list-container') renderDecks(); if (target === 'docs-container') renderDocs(); if (target === 'tasks-container') renderTasks();
            if (target === 'study-log-container') { renderCalendar(); renderEventTypes(); }
        });
    });
    themeLightBtn.addEventListener('click', () => setTheme('theme-light'));
    themeGrayBtn.addEventListener('click', () => setTheme('theme-gray'));
    themeSolarizedBtn.addEventListener('click', () => setTheme('theme-solarized'));
    themeBlackBtn.addEventListener('click', () => setTheme('theme-black'));
    helpBtn.addEventListener('click', () => helpModal.style.display = 'block');
    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', (e) => e.target.closest('.modal').style.display = 'none'));
    window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });

    // FLASHCARDS
    addDeckBtn.addEventListener('click', () => { const deckName = prompt('Nombre del nuevo mazo:'); if (deckName && deckName.trim()) { decks.push({ name: deckName.trim(), cards: [] }); saveDecks(); renderDecks(); } });
    deckList.addEventListener('click', e => {
        const target = e.target.closest('.delete-deck-btn');
        if(target) { const index = target.dataset.index; if (confirm(`¿Seguro que quieres eliminar el mazo "${decks[index].name}"?`)) { decks.splice(index, 1); saveDecks(); renderDecks(); } }
    });
    importDeckBtn.addEventListener('click', () => deckFileInput.click());
    deckFileInput.addEventListener('change', importDeckFromFile);
    addCardBtn.addEventListener('click', () => showSection('add-card-container'));
    backToDecksBtn.addEventListener('click', () => showSection('deck-list-container'));
    nextBtn.addEventListener('click', showNextCard);
    downloadDeckBtn.addEventListener('click', downloadDeck);
    ratingButtons.forEach(button => {
        button.addEventListener('click', e => {
            decks[currentDeckIndex].cards[currentCardIndex].masteryLevel = parseInt(e.target.dataset.rating, 10);
            saveDecks(); updateDeckProgress(); showNextCard();
        });
    });
    cancelAddBtn.addEventListener('click', () => showSection('flashcard-view-container'));
    addCardForm.addEventListener('submit', (e) => {
        e.preventDefault(); const frontText = document.getElementById('front').value.trim(); const backText = document.getElementById('back').value.trim();
        if (currentDeckIndex < 0) return showNotification("No hay un mazo seleccionado.", 'error');
        if (!frontText || !backText) return showNotification("Ambos lados deben tener contenido.", 'error');
        decks[currentDeckIndex].cards.push({ front: frontText, back: backText, masteryLevel: 1 });
        saveDecks(); addCardForm.reset(); showNotification('Flashcard añadida con éxito.'); showSection('flashcard-view-container');
    });
    singleCardModeBtn.addEventListener('click', () => { singleCardModeBtn.classList.add('active'); bulkImportModeBtn.classList.remove('active'); addCardForm.style.display = 'block'; bulkImportForm.style.display = 'none'; });
    bulkImportModeBtn.addEventListener('click', () => { bulkImportModeBtn.classList.add('active'); singleCardModeBtn.classList.remove('active'); bulkImportForm.style.display = 'block'; addCardForm.style.display = 'none'; });
    bulkImportForm.addEventListener('submit', (e) => {
        e.preventDefault(); const text = document.getElementById('bulk-text').value.trim(); const lines = text.split('\n').filter(line => line.trim() !== ''); let importedCount = 0;
        if (currentDeckIndex < 0) return showNotification("No hay un mazo seleccionado.", 'error');
        lines.forEach(line => {
            const parts = line.split(/[,;\t]/);
            if (parts.length >= 2) {
                const front = parts[0].trim(); const back = parts.slice(1).join(', ').trim();
                if (front && back) { decks[currentDeckIndex].cards.push({ front, back, masteryLevel: 1 }); importedCount++; }
            }
        });
        if (importedCount > 0) { saveDecks(); bulkImportForm.reset(); showNotification(`${importedCount} flashcards importadas.`); showSection('flashcard-view-container'); showNextCard(); } 
        else { showNotification("No se encontraron flashcards válidas. Revisa el formato.", 'error'); }
    });
    addFlashcardGlobalBtn.addEventListener('click', () => {
        showDeckSelector((deckIndex) => {
            currentDeckIndex = deckIndex;
            document.getElementById('add-card-title').textContent = `Añadir a "${decks[deckIndex].name}"`;
            deckSelectorModal.style.display = 'none';
            showSection('add-card-container');
        });
    });
    deckSelectorList.addEventListener('click', e => {
        const target = e.target.closest('.deck-selector-item');
        if (target && onDeckSelectedCallback) {
            const deckIndex = parseInt(target.dataset.index, 10);
            onDeckSelectedCallback(deckIndex);
            onDeckSelectedCallback = null; 
        }
    });

    // NOTAS
    addDocBtn.addEventListener('click', () => showNoteEditor());
    importDocBtn.addEventListener('click', () => docFileInput.click());
    docFileInput.addEventListener('change', importNoteFromFile);
    saveDocBtn.addEventListener('click', saveCurrentDoc);
    downloadDocBtn.addEventListener('click', downloadNote);
    cancelDocBtn.addEventListener('click', () => { docsListView.style.display = 'block'; docEditorView.style.display = 'none'; });
    docsList.addEventListener('click', e => {
        const readBtn = e.target.closest('.read-doc-btn'); const editBtn = e.target.closest('.edit-doc-btn'); const deleteBtn = e.target.closest('.delete-doc-btn');
        if (readBtn) {
            const docId = readBtn.dataset.id;
            const allDocs = Object.values(docs).flat();
            const docToRead = allDocs.find(d => d.id === docId);
            if (docToRead) { 
                docReaderTitle.textContent = docToRead.title; 
                docReaderContent.innerHTML = docToRead.content; 
                docReaderModal.style.display = 'block'; 
            }
        }
        if (editBtn) { showNoteEditor(editBtn.dataset.id); }
        if (deleteBtn) {
            if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
                const docId = deleteBtn.dataset.id; let found = false;
                for (const subject in docs) {
                    const initialLength = docs[subject].length;
                    docs[subject] = docs[subject].filter(d => d.id !== docId);
                    if (docs[subject].length < initialLength) {
                        found = true; if (docs[subject].length === 0) delete docs[subject]; break;
                    }
                }
                if (found) { saveDocs(); renderDocs(); showNotification('Nota eliminada.'); }
            }
        }
    });
    createFlashcardFromNoteBtn.addEventListener('click', () => {
        const selection = window.getSelection();
        const frontText = selection.toString().trim();
        if (!frontText) {
            return showNotification('Por favor, selecciona el texto para el frente de la tarjeta.', 'error');
        }
        const backText = prompt('Introduce el reverso para esta flashcard:', '');
        if (backText === null || backText.trim() === '') {
            return showNotification('Creación de flashcard cancelada.', 'error');
        }
        const newCard = { front: frontText, back: backText.trim(), masteryLevel: 1 };
        showDeckSelector((deckIndex) => {
            decks[deckIndex].cards.push(newCard);
            saveDecks();
            showNotification(`Flashcard guardada en "${decks[deckIndex].name}".`);
            deckSelectorModal.style.display = 'none';
            docReaderModal.style.display = 'none';
            renderDecks();
        });
    });

    // TAREAS
    addTaskForm.addEventListener('submit', e => { e.preventDefault(); const text = taskInput.value.trim(); if (text) { tasks.push({ text: text, completed: false }); saveTasks(); renderTasks(); taskInput.value = ''; } });
    taskList.addEventListener('click', e => {
        const index = e.target.dataset.index;
        if (e.target.closest('.task-text')) { tasks[index].completed = !tasks[index].completed; saveTasks(); renderTasks(); }
        if (e.target.closest('.delete-task-btn')) { tasks.splice(index, 1); saveTasks(); renderTasks(); }
    });
    
    // POMODORO Y CALENDARIO (LISTENERS)
    pomodoroStartBtn.addEventListener('click', handleStartClick);
    pomodoroPauseBtn.addEventListener('click', handlePauseClick);
    pomodoroResetBtn.addEventListener('click', handleResetClick);
    pomodoroStudyTimeInput.addEventListener('change', handleResetClick);
    pomodoroBreakTimeInput.addEventListener('change', handleResetClick);
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    addEventTypeForm.addEventListener('submit', e => { e.preventDefault(); const name = eventTypeNameInput.value.trim(); if (name) { eventTypes.push({ id: Date.now().toString(), name, color: eventTypeColorInput.value }); saveEventTypes(); renderEventTypes(); addEventTypeForm.reset(); } });
    eventTypesList.addEventListener('click', e => {
        const deleteBtn = e.target.closest('.delete-event-btn');
        if (deleteBtn) { eventTypes = eventTypes.filter(t => t.id !== deleteBtn.dataset.id); saveEventTypes(); renderEventTypes(); renderCalendar(); }
    });
    calendarGrid.addEventListener('click', handleDayClick);
    
    // --- Inicialización ---
    setTheme(localStorage.getItem('selectedTheme') || 'theme-light');
    showSection('deck-list-container');
    renderDecks();
    pomodoroStudyTimeInput.value = localStorage.getItem('pomodoroStudyTime') || 25;
    pomodoroBreakTimeInput.value = localStorage.getItem('pomodoroBreakTime') || 5;
    initializePomodoro();
});


