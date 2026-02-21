/**
 * JepsonMath → Aeries Grade Transfer Extension
 * Popup script - manages the popup UI and orchestrates grade pasting
 */

let gradeData = null;

// DOM elements
const statusCard = document.getElementById('status-card');
const statusValue = document.getElementById('status-value');
const statsSection = document.getElementById('stats-section');
const studentCount = document.getElementById('student-count');
const standardCount = document.getElementById('standard-count');
const previewSection = document.getElementById('preview-section');
const previewHeader = document.getElementById('preview-header');
const previewBody = document.getElementById('preview-body');
const pasteBtn = document.getElementById('paste-btn');
const previewBtn = document.getElementById('preview-btn');
const clearBtn = document.getElementById('clear-btn');
const pasteArea = document.getElementById('paste-area');
const loadPasteBtn = document.getElementById('load-paste-btn');
const tryClipboardBtn = document.getElementById('try-clipboard-btn');
const messageEl = document.getElementById('message');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setupEventListeners();
});

function setupEventListeners() {
  pasteBtn.addEventListener('click', pasteGradesIntoAeries);
  previewBtn.addEventListener('click', togglePreview);
  loadPasteBtn.addEventListener('click', loadFromPasteArea);
  tryClipboardBtn.addEventListener('click', tryClipboardRead);
  clearBtn.addEventListener('click', clearData);

  // Auto-detect paste into the textarea
  pasteArea.addEventListener('paste', () => {
    // Small delay so the pasted text is in the textarea
    setTimeout(() => {
      const text = pasteArea.value.trim();
      if (text && text.includes('\t')) {
        loadFromPasteArea();
      }
    }, 100);
  });
}

/**
 * Load previously saved data from Chrome storage.
 */
async function loadFromStorage() {
  try {
    const stored = await chrome.storage.local.get('jepsonmath_grades');
    if (stored.jepsonmath_grades && stored.jepsonmath_grades.rows && stored.jepsonmath_grades.rows.length > 0) {
      gradeData = stored.jepsonmath_grades;
      updateUI();
      return;
    }
  } catch (err) {
    console.log('No stored data:', err.message);
  }

  // No stored data
  gradeData = null;
  updateUI();
}

/**
 * Load grade data from the paste textarea.
 */
function loadFromPasteArea() {
  const text = pasteArea.value.trim();

  if (!text) {
    showMessage('Paste area is empty. Copy data from JepsonMath first, then paste it here.', 'error');
    return;
  }

  if (!text.includes('\t')) {
    showMessage('Data does not appear to be tab-delimited. Make sure you copied from the "Copy Standards for Aeries" button.', 'error');
    return;
  }

  const parsed = parseClipboardData(text);
  if (!parsed) {
    showMessage('Could not parse the data. Expected format: Student ID [tab] Student Name [tab] scores...', 'error');
    return;
  }

  gradeData = parsed;

  // Save to Chrome storage for persistence
  chrome.storage.local.set({ jepsonmath_grades: gradeData });

  updateUI();
  pasteArea.value = '';
  showMessage(`Loaded ${gradeData.metadata.totalStudents} students with ${gradeData.metadata.totalStandards} standards.`, 'success');
}

/**
 * Try to auto-read from clipboard (may not work in all browsers/contexts).
 */
async function tryClipboardRead() {
  try {
    const clipText = await navigator.clipboard.readText();

    if (!clipText || !clipText.includes('\t')) {
      showMessage('Clipboard does not contain tab-delimited data. Use the paste box instead.', 'error');
      return;
    }

    const parsed = parseClipboardData(clipText);
    if (!parsed) {
      showMessage('Clipboard data could not be parsed. Try pasting manually into the box above.', 'error');
      return;
    }

    gradeData = parsed;
    chrome.storage.local.set({ jepsonmath_grades: gradeData });

    updateUI();
    showMessage(`Auto-loaded ${gradeData.metadata.totalStudents} students from clipboard.`, 'success');
  } catch (err) {
    console.log('Clipboard read failed:', err.message);
    showMessage('Clipboard auto-read not available. Please paste manually into the box above (Ctrl+V / Cmd+V).', 'error');
  }
}

/**
 * Clear stored data.
 */
async function clearData() {
  gradeData = null;
  await chrome.storage.local.remove('jepsonmath_grades');
  updateUI();
  hideMessage();
}

/**
 * Parse tab-delimited clipboard data from JepsonMath.
 */
function parseClipboardData(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;

  const headers = lines[0].split('\t');
  // Accept data with at least 3 columns (Student ID, Student Name, + at least 1 standard)
  if (headers.length < 3) return null;

  // Validate first header looks like student ID column
  const firstHeader = headers[0].trim().toLowerCase();
  if (!firstHeader.includes('student') && !firstHeader.includes('id') && firstHeader !== '') {
    return null;
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length >= 2 && cols[0].trim()) {
      rows.push(cols);
    }
  }

  if (rows.length === 0) return null;

  return {
    headers,
    rows,
    standardCodes: headers.slice(2),
    metadata: {
      exportDate: new Date().toISOString().split('T')[0],
      totalStudents: rows.length,
      totalStandards: headers.length - 2,
      assessmentCategory: 'Standards',
    },
  };
}

/**
 * Update the popup UI with current data state.
 */
function updateUI() {
  if (gradeData && gradeData.rows && gradeData.rows.length > 0) {
    statusCard.className = 'status-card has-data';
    statusValue.className = 'status-value ready';
    statusValue.textContent = `${gradeData.metadata.totalStudents} students, ${gradeData.metadata.totalStandards} standards ready`;

    statsSection.style.display = 'block';
    studentCount.textContent = gradeData.metadata.totalStudents;
    standardCount.textContent = gradeData.metadata.totalStandards;

    pasteBtn.disabled = false;
    previewBtn.disabled = false;
  } else {
    statusCard.className = 'status-card no-data';
    statusValue.className = 'status-value empty';
    statusValue.textContent = 'No data loaded — paste below';

    statsSection.style.display = 'none';
    pasteBtn.disabled = true;
    previewBtn.disabled = true;
  }
}

/**
 * Toggle the data preview table.
 */
function togglePreview() {
  if (previewSection.style.display === 'none') {
    renderPreview();
    previewSection.style.display = 'block';
    previewBtn.textContent = '🙈 Hide Preview';
  } else {
    previewSection.style.display = 'none';
    previewBtn.textContent = '👁️ Preview Data';
  }
}

/**
 * Render a preview of the data in a table.
 */
function renderPreview() {
  if (!gradeData) return;

  const headerRow = document.createElement('tr');
  gradeData.headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  previewHeader.innerHTML = '';
  previewHeader.appendChild(headerRow);

  previewBody.innerHTML = '';
  const maxRows = Math.min(gradeData.rows.length, 10);
  for (let i = 0; i < maxRows; i++) {
    const tr = document.createElement('tr');
    gradeData.rows[i].forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    previewBody.appendChild(tr);
  }

  if (gradeData.rows.length > 10) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = gradeData.headers.length;
    td.textContent = `... and ${gradeData.rows.length - 10} more students`;
    td.style.textAlign = 'center';
    td.style.fontStyle = 'italic';
    td.style.color = '#94a3b8';
    tr.appendChild(td);
    previewBody.appendChild(tr);
  }
}

/**
 * Send grade data to the content script to paste into Aeries.
 */
async function pasteGradesIntoAeries() {
  if (!gradeData) {
    showMessage('No grade data loaded.', 'error');
    return;
  }

  pasteBtn.disabled = true;
  pasteBtn.textContent = '⏳ Pasting...';
  showMessage('Sending data to Aeries page...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showMessage('No active tab found.', 'error');
      return;
    }

    if (!tab.url || !tab.url.includes('aeries.net')) {
      showMessage('Please navigate to the Aeries gradebook first, then try again.', 'error');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'PASTE_GRADES',
      data: gradeData,
    });

    if (response && response.success) {
      const msg = response.matched > 0
        ? `Successfully pasted ${response.matched} scores!` +
          (response.skipped > 0 ? ` (${response.skipped} students not found on page)` : '')
        : response.message || 'Grade reference panel opened on the Aeries page.';
      showMessage(msg, 'success');
    } else {
      showMessage(
        response?.message || 'Could not paste grades. Make sure you are on the Aeries Scores by Class page.',
        'error'
      );
    }
  } catch (err) {
    console.error('Error pasting grades:', err);
    showMessage(
      'Could not connect to the Aeries page. Try refreshing the Aeries page and clicking again.',
      'error'
    );
  } finally {
    pasteBtn.disabled = false;
    pasteBtn.textContent = '📋 Paste Grades into Aeries';
  }
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = type;
  messageEl.style.display = 'block';
}

function hideMessage() {
  messageEl.style.display = 'none';
  messageEl.className = '';
}
