/**
 * JepsonMath → Aeries Grade Transfer Extension
 * Content script - Aeries-specific DOM interaction
 *
 * Aeries "Scores by Class" page structure:
 * - table.students: student rows (aside.students-container), each tr has data-stuid, data-sn
 * - table.assignment-header: assignment columns, each th has data-an, tr.description has data-assignment-desc
 * - table.assignments: score grid (section.assignments-container), each td has data-sn + data-an
 *   Cells have data-edit="txt_mk" and use click-to-edit with a dynamically created <input>.
 */

console.log('🎓 JepsonMath Aeries Transfer: Content script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PASTE_GRADES') {
    handlePasteGrades(message.data)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, message: err.message }));
    return true;
  }
  if (message.action === 'DETECT_PAGE') {
    sendResponse(detectAeriesPage());
    return true;
  }
});

function detectAeriesPage() {
  return {
    url: window.location.href,
    isGradebook: !!document.querySelector('table.assignments'),
    isAeries: window.location.href.includes('aeries.net'),
  };
}

async function handlePasteGrades(gradeData) {
  console.log('📋 Starting grade paste process...');
  console.log('Data:', gradeData.metadata);

  const result = await tryAeriesScoresByClass(gradeData);
  if (result.success && result.matched > 0) return result;

  return showManualAssistOverlay(gradeData);
}

/**
 * Match and fill scores using the Aeries Scores by Class DOM structure.
 * Processes cells ONE AT A TIME with delays so Aeries can handle each edit.
 */
async function tryAeriesScoresByClass(gradeData) {
  const assignmentHeaders = document.querySelectorAll('table.assignment-header thead th[data-an]');
  const studentRows = document.querySelectorAll('table.students tbody tr.row[data-sn]');
  const scoreTable = document.querySelector('table.assignments');

  if (!assignmentHeaders.length || !studentRows.length || !scoreTable) {
    console.log('⚠️ Aeries Scores by Class tables not found');
    return { success: false, message: 'Could not find Aeries Scores by Class layout.' };
  }

  console.log(`Found ${assignmentHeaders.length} assignments, ${studentRows.length} students`);

  const aeriesAssignments = [];
  assignmentHeaders.forEach(th => {
    const an = th.getAttribute('data-an');
    const descRow = th.querySelector('tr.description[data-assignment-desc]');
    const desc = descRow ? descRow.getAttribute('data-assignment-desc') : '';
    const namePart = desc.includes(' - ') ? desc.split(' - ').slice(1).join(' - ').trim() : desc.trim();
    aeriesAssignments.push({ an, name: namePart, desc });
  });

  console.log('Aeries assignments:', aeriesAssignments.map(a => `${a.an}: "${a.name}"`));

  const aeriesStudents = [];
  studentRows.forEach(row => {
    const sn = row.getAttribute('data-sn');
    const stuid = row.getAttribute('data-stuid');
    const nameLink = row.querySelector('a.student-name-link');
    const name = nameLink ? nameLink.textContent.trim() : '';
    if (!row.classList.contains('student-status-inactive')) {
      aeriesStudents.push({ sn, stuid, name });
    }
  });

  console.log('Aeries students:', aeriesStudents.map(s => `${s.sn}: "${s.name}" (${s.stuid})`));

  const jmStandards = gradeData.headers.slice(2);

  const standardToAN = new Map();
  jmStandards.forEach((jmHeader, idx) => {
    const match = findMatchingAssignment(jmHeader, aeriesAssignments);
    if (match) {
      standardToAN.set(idx, match.an);
      console.log(`✅ Matched "${jmHeader}" → Aeries "${match.name}" (AN: ${match.an})`);
    } else {
      console.log(`❌ No match for "${jmHeader}"`);
    }
  });

  if (standardToAN.size === 0) {
    console.log('⚠️ No assignment columns matched');
    return { success: false, matched: 0, message: 'No assignment columns matched.' };
  }

  // Collect all cell edits to process sequentially
  const edits = [];
  let skipped = 0;

  gradeData.rows.forEach(row => {
    const jmStudentId = row[0];
    const jmStudentName = row[1];

    const aeriesStudent = findMatchingStudent(jmStudentId, jmStudentName, aeriesStudents);
    if (!aeriesStudent) {
      console.log(`❌ Student not found: "${jmStudentName}" (${jmStudentId})`);
      skipped++;
      return;
    }

    standardToAN.forEach((an, stdIdx) => {
      const scoreValue = row[stdIdx + 2];
      if (scoreValue === undefined || scoreValue === '') return;

      const scoreCell = scoreTable.querySelector(
        `td[data-sn="${aeriesStudent.sn}"][data-an="${an}"]`
      );

      if (scoreCell) {
        if (scoreCell.classList.contains('score-not-applicable')) return;

        const currentValue = scoreCell.getAttribute('data-original-value');
        if (currentValue === scoreValue) return;

        edits.push({ cell: scoreCell, value: scoreValue, student: jmStudentName, an });
      }
    });
  });

  console.log(`📝 Processing ${edits.length} cell edits sequentially...`);

  let matched = 0;
  for (const edit of edits) {
    const ok = await fillAeriesCell(edit.cell, edit.value);
    if (ok) {
      matched++;
      console.log(`  ✏️ Set ${edit.student} AN:${edit.an} = ${edit.value}`);
    } else {
      console.log(`  ⚠️ Failed to set ${edit.student} AN:${edit.an}`);
    }
  }

  console.log(`✅ Paste complete: ${matched}/${edits.length} scores filled, ${skipped} students not found`);
  return {
    success: true,
    matched,
    skipped,
    message: `Filled ${matched} scores. ${skipped > 0 ? `${skipped} students not found on page.` : ''}`,
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fill a score into an Aeries cell.
 *
 * Aeries click-to-edit flow:
 * 1. Click the td → Aeries shows an <input> inside or near the cell
 * 2. Type value into the input
 * 3. Press Tab or Enter → Aeries saves and moves to next cell
 *
 * We simulate this with proper mousedown/mouseup/click events and key events.
 */
async function fillAeriesCell(cell, value) {
  // First, scroll the cell into view so Aeries can detect it
  cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  await delay(30);

  // Simulate a real click (mousedown → mouseup → click)
  const rect = cell.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const eventOpts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 };

  cell.dispatchEvent(new MouseEvent('mousedown', eventOpts));
  cell.dispatchEvent(new MouseEvent('mouseup', eventOpts));
  cell.dispatchEvent(new MouseEvent('click', eventOpts));

  // Wait for Aeries to create the input field
  let input = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    await delay(50);

    // Check inside the cell first
    input = cell.querySelector('input[type="text"], input:not([type="hidden"]):not([type="checkbox"])');
    if (input) break;

    // Aeries may place the input as a floating element keyed by id
    input = document.getElementById('txt_mk');
    if (input && input.offsetParent !== null) break;

    // Also check for any visible input near the cell
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && activeEl.type !== 'hidden' && activeEl.type !== 'checkbox') {
      input = activeEl;
      break;
    }

    input = null;
  }

  if (input) {
    // Clear and set the value
    input.focus();
    input.select();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Type each character using keyboard events for Aeries validation
    for (const ch of value.toString()) {
      input.value += ch;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keypress', { key: ch, bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
    }

    // Trigger change
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Press Tab to commit and move to next cell (Aeries standard behavior)
    await delay(30);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, code: 'Tab', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', keyCode: 9, code: 'Tab', bubbles: true }));

    // Wait for Aeries to process the save
    await delay(150);

    cell.style.transition = 'background-color 0.3s';
    cell.style.backgroundColor = '#d1fae5';
    setTimeout(() => { cell.style.backgroundColor = ''; }, 3000);
    return true;
  }

  // Fallback: no input appeared. Directly modify the DOM as visual indicator.
  console.log(`  ⚠️ No input found for cell, using DOM fallback`);
  const span = cell.querySelector('span.score-value');
  if (span) {
    span.textContent = value;
    cell.setAttribute('data-original-value', value);
    cell.style.transition = 'background-color 0.3s';
    cell.style.backgroundColor = '#fef3c7';
    setTimeout(() => { cell.style.backgroundColor = ''; }, 5000);
  }
  return false;
}

// ─── Matching helpers ──────────────────────────────────────────────────────

function findMatchingAssignment(jmHeader, aeriesAssignments) {
  const normalize = s => s.toLowerCase().replace(/[\s_-]+/g, '').trim();
  const jmNorm = normalize(jmHeader);

  let match = aeriesAssignments.find(a => normalize(a.name) === jmNorm);
  if (match) return match;

  match = aeriesAssignments.find(a => normalize(a.desc) === jmNorm);
  if (match) return match;

  match = aeriesAssignments.find(a => {
    const aNorm = normalize(a.name);
    return aNorm.includes(jmNorm) || jmNorm.includes(aNorm);
  });
  if (match) return match;

  return null;
}

function findMatchingStudent(jmId, jmName, aeriesStudents) {
  const numericId = jmId.replace(/^s-/, '').replace(/@.*$/, '').trim();

  let match = aeriesStudents.find(s => s.stuid === numericId);
  if (match) return match;

  match = aeriesStudents.find(s => s.stuid === jmId || jmId.includes(s.stuid));
  if (match) return match;

  if (jmName) {
    const jmParts = jmName.split(',').map(p => p.trim().toLowerCase());
    if (jmParts.length >= 2) {
      const jmLast = jmParts[0];
      const jmFirst = jmParts[1].split(' ')[0];

      match = aeriesStudents.find(s => {
        const aeriesName = s.name.toLowerCase();
        const aeriesParts = aeriesName.split(',').map(p => p.trim());
        if (aeriesParts.length >= 2) {
          const aLast = aeriesParts[0];
          const aFirst = aeriesParts[1].split(' ')[0];
          return aLast === jmLast && aFirst.startsWith(jmFirst);
        }
        return aeriesName.includes(jmLast) && aeriesName.includes(jmFirst);
      });
      if (match) return match;
    }
  }

  return null;
}

// ─── Manual Assist Overlay (fallback) ──────────────────────────────────────

function showManualAssistOverlay(gradeData) {
  const existing = document.getElementById('jepsonmath-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'jepsonmath-overlay';
  overlay.innerHTML = `
    <div class="jm-overlay-header">
      <h3>📊 JepsonMath Grade Data</h3>
      <div class="jm-overlay-controls">
        <button id="jm-minimize" title="Minimize">_</button>
        <button id="jm-close" title="Close">✕</button>
      </div>
    </div>
    <div class="jm-overlay-body" id="jm-overlay-body">
      <div class="jm-search">
        <input type="text" id="jm-search-input" placeholder="Search student..." />
      </div>
      <div class="jm-table-container" id="jm-table-container"></div>
      <p class="jm-hint">
        💡 Click a score to copy it, then click an Aeries cell and paste.
      </p>
    </div>
  `;
  document.body.appendChild(overlay);
  renderOverlayTable(gradeData, '');

  document.getElementById('jm-close').addEventListener('click', () => overlay.remove());
  document.getElementById('jm-minimize').addEventListener('click', () => {
    const body = document.getElementById('jm-overlay-body');
    body.style.display = body.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('jm-search-input').addEventListener('input', (e) => {
    renderOverlayTable(gradeData, e.target.value);
  });
  makeDraggable(overlay);

  return {
    success: true,
    matched: 0,
    skipped: 0,
    message: 'Could not auto-fill. Showing grade reference panel — click scores to copy them.',
  };
}

function renderOverlayTable(gradeData, searchTerm) {
  const container = document.getElementById('jm-table-container');
  if (!container) return;

  const filtered = searchTerm
    ? gradeData.rows.filter(row =>
        row[1].toLowerCase().includes(searchTerm.toLowerCase()) ||
        row[0].toLowerCase().includes(searchTerm.toLowerCase())
      )
    : gradeData.rows;

  let html = '<table class="jm-data-table"><thead><tr>';
  gradeData.headers.forEach(h => { html += `<th>${esc(h)}</th>`; });
  html += '</tr></thead><tbody>';

  filtered.forEach(row => {
    html += '<tr>';
    row.forEach((cell, idx) => {
      if (idx >= 2 && cell) {
        html += `<td class="jm-score-cell" data-score="${esc(cell)}" title="Click to copy">${esc(cell)}</td>`;
      } else {
        html += `<td>${esc(cell)}</td>`;
      }
    });
    html += '</tr>';
  });

  if (filtered.length === 0) {
    html += `<tr><td colspan="${gradeData.headers.length}" style="text-align:center;color:#94a3b8;padding:20px;">No match</td></tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('.jm-score-cell').forEach(cell => {
    cell.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(cell.dataset.score);
        cell.classList.add('jm-copied');
        setTimeout(() => cell.classList.remove('jm-copied'), 1000);
      } catch (err) { /* ignore */ }
    });
  });
}

function makeDraggable(el) {
  const header = el.querySelector('.jm-overlay-header');
  let dragging = false, sx, sy, sl, st;
  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    const r = el.getBoundingClientRect(); sl = r.left; st = r.top;
    header.style.cursor = 'grabbing';
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    el.style.left = (sl + e.clientX - sx) + 'px';
    el.style.top = (st + e.clientY - sy) + 'px';
    el.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; header.style.cursor = 'grab'; });
}

function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
