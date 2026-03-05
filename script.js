/* ========================================
   UIU CGPA Calculator — JavaScript
   ======================================== */

// ---------- Grade Mapping (UIU Official) ----------
const GRADE_MAP = {
    'A': 4.00,
    'A-': 3.67,
    'B+': 3.33,
    'B': 3.00,
    'B-': 2.67,
    'C+': 2.33,
    'C': 2.00,
    'C-': 1.67,
    'D+': 1.33,
    'D': 1.00,
    'F': 0.00
};

const CREDIT_OPTIONS = [0.75, 1, 1.5, 2, 3, 4];

const GRADE_LABELS = {
    'A': 'Outstanding',
    'A-': 'Excellent',
    'B+': 'Very Good',
    'B': 'Good',
    'B-': 'Above Average',
    'C+': 'Average',
    'C': 'Below Average',
    'C-': 'Poor',
    'D+': 'Very Poor',
    'D': 'Pass',
    'F': 'Fail'
};

// ---------- DOM References ----------
const coursesList = document.getElementById('coursesList');
const addCourseBtn = document.getElementById('addCourse');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetAll');
const toggleGradingBtn = document.getElementById('toggleGradingTable');
const gradingModal = document.getElementById('gradingModal');
const closeModalBtn = document.getElementById('closeModal');

const prevCGPAInput = document.getElementById('prevCGPA');
const prevCreditsInput = document.getElementById('prevCredits');

const currentGPAEl = document.getElementById('currentGPA');
const cumulativeCGPAEl = document.getElementById('cumulativeCGPA');
const trimesterCreditsEl = document.getElementById('trimesterCredits');
const earnedCreditsEl = document.getElementById('earnedCredits');
const totalCreditsEl = document.getElementById('totalCredits');
const totalCreditsSubEl = document.getElementById('totalCreditsSub');
const gpaTagEl = document.getElementById('gpaTag');
const cgpaTagEl = document.getElementById('cgpaTag');

let courseCount = 0;

// ---------- Initialize ----------
function init() {
    loadFromStorage();
    if (courseCount === 0) {
        for (let i = 0; i < 5; i++) addCourseRow();
    }
    bindEvents();
    calculate();
}

// ---------- Events ----------
function bindEvents() {
    addCourseBtn.addEventListener('click', () => {
        addCourseRow();
        saveToStorage();
    });

    calculateBtn.addEventListener('click', () => {
        calculate();
        animateResults();
    });

    resetBtn.addEventListener('click', resetAll);

    toggleGradingBtn.addEventListener('click', () => gradingModal.classList.add('active'));
    closeModalBtn.addEventListener('click', () => gradingModal.classList.remove('active'));
    gradingModal.addEventListener('click', (e) => {
        if (e.target === gradingModal) gradingModal.classList.remove('active');
    });

    prevCGPAInput.addEventListener('input', () => { calculate(); saveToStorage(); });
    prevCreditsInput.addEventListener('input', () => { calculate(); saveToStorage(); });

    // Escape to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') gradingModal.classList.remove('active');
    });
}

// ---------- Course Row ----------
function addCourseRow(data = {}) {
    courseCount++;
    const row = document.createElement('div');
    row.className = 'course-row';
    row.dataset.id = courseCount;

    // Credit Input
    const creditInput = document.createElement('input');
    creditInput.type = 'number';
    creditInput.classList.add('course-credit');
    creditInput.placeholder = 'Credit';
    creditInput.min = '0';
    creditInput.max = '10';
    creditInput.step = '0.25';
    creditInput.value = data.credit || '';
    creditInput.addEventListener('input', () => { calculate(); saveToStorage(); });

    // Grade Select
    const gradeSelect = document.createElement('select');
    gradeSelect.classList.add('course-grade');
    const defaultGrade = document.createElement('option');
    defaultGrade.value = '';
    defaultGrade.textContent = 'Grade';
    defaultGrade.disabled = true;
    if (!data.grade) defaultGrade.selected = true;
    gradeSelect.appendChild(defaultGrade);

    Object.keys(GRADE_MAP).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = `${g} (${GRADE_MAP[g].toFixed(2)})`;
        if (data.grade === g) opt.selected = true;
        gradeSelect.appendChild(opt);
    });
    gradeSelect.addEventListener('change', () => { calculate(); saveToStorage(); });

    // Retake Toggle
    const retakeWrapper = document.createElement('div');
    retakeWrapper.className = 'retake-toggle';
    const retakeCheckbox = document.createElement('input');
    retakeCheckbox.type = 'checkbox';
    retakeCheckbox.classList.add('course-retake');
    retakeCheckbox.id = `retake-${courseCount}`;
    retakeCheckbox.checked = data.retake || false;
    const retakeLabel = document.createElement('label');
    retakeLabel.className = 'retake-switch';
    retakeLabel.htmlFor = `retake-${courseCount}`;
    retakeWrapper.appendChild(retakeCheckbox);
    retakeWrapper.appendChild(retakeLabel);

    // Previous Grade Select (for retake)
    const prevGradeSelect = document.createElement('select');
    prevGradeSelect.classList.add('prev-grade-select');
    const defaultPrevGrade = document.createElement('option');
    defaultPrevGrade.value = '';
    defaultPrevGrade.textContent = 'Old Grade';
    defaultPrevGrade.disabled = true;
    if (!data.prevGrade) defaultPrevGrade.selected = true;
    prevGradeSelect.appendChild(defaultPrevGrade);

    Object.keys(GRADE_MAP).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = `${g} (${GRADE_MAP[g].toFixed(2)})`;
        if (data.prevGrade === g) opt.selected = true;
        prevGradeSelect.appendChild(opt);
    });
    prevGradeSelect.disabled = !data.retake;
    prevGradeSelect.addEventListener('change', () => { calculate(); saveToStorage(); });

    // Toggle retake state
    retakeCheckbox.addEventListener('change', () => {
        const isRetake = retakeCheckbox.checked;
        prevGradeSelect.disabled = !isRetake;
        if (!isRetake) {
            prevGradeSelect.value = '';
            row.classList.remove('is-retake');
        } else {
            row.classList.add('is-retake');
        }
        calculate();
        saveToStorage();
    });

    if (data.retake) row.classList.add('is-retake');

    // Remove Button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove course';
    removeBtn.addEventListener('click', () => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        row.style.transition = 'all 0.25s ease';
        setTimeout(() => {
            row.remove();
            calculate();
            saveToStorage();
            if (coursesList.children.length === 0) {
                showEmptyState();
            }
        }, 250);
    });

    // Helper: wrap element in a field-group with a mobile label
    function wrapField(element, label) {
        const wrapper = document.createElement('div');
        wrapper.className = 'field-group';
        wrapper.dataset.label = label;
        wrapper.appendChild(element);
        return wrapper;
    }

    row.appendChild(wrapField(creditInput, 'Credits'));
    row.appendChild(wrapField(gradeSelect, 'Grade'));
    row.appendChild(wrapField(retakeWrapper, 'Retake'));
    row.appendChild(wrapField(prevGradeSelect, 'Prev. Grade'));
    row.appendChild(removeBtn);
    coursesList.appendChild(row);

    hideEmptyState();
    return row;
}

function showEmptyState() {
    if (document.querySelector('.empty-state')) return;
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
        <i data-lucide="book-open" style="width:48px;height:48px;"></i>
        <p>No courses added yet</p>
        <p class="hint">Click "Add Course" to get started</p>
    `;
    coursesList.appendChild(empty);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function hideEmptyState() {
    const empty = coursesList.querySelector('.empty-state');
    if (empty) empty.remove();
}

// ---------- Calculation ----------
function calculate() {
    const rows = coursesList.querySelectorAll('.course-row');
    let totalWeightedGP = 0;
    let totalCredits = 0;
    let earnedCredits = 0;
    let retakeOldWeighted = 0; // sum of credit × oldGradePoint for retake courses
    let retakeCredits = 0;     // credits from retake courses (already in previous record)

    rows.forEach(row => {
        const creditVal = row.querySelector('.course-credit')?.value;
        const gradeVal = row.querySelector('.course-grade')?.value;
        const isRetake = row.querySelector('.course-retake')?.checked || false;
        const prevGradeVal = row.querySelector('.prev-grade-select')?.value || '';

        if (!creditVal || !gradeVal) return;

        const credit = parseFloat(creditVal);
        const gradePoint = GRADE_MAP[gradeVal];

        totalWeightedGP += credit * gradePoint;
        totalCredits += credit;

        // Earned credits: D or higher (not F)
        if (gradeVal !== 'F') {
            earnedCredits += credit;
        }

        // Track retake adjustments
        if (isRetake && prevGradeVal) {
            const oldGradePoint = GRADE_MAP[prevGradeVal];
            retakeOldWeighted += credit * oldGradePoint;
            retakeCredits += credit;
        }
    });

    // Current GPA (includes all courses this trimester, retake or not)
    const gpa = totalCredits > 0 ? totalWeightedGP / totalCredits : 0;

    // Previous CGPA
    const prevCGPA = parseFloat(prevCGPAInput.value) || 0;
    const prevCredits = parseFloat(prevCreditsInput.value) || 0;

    // Cumulative CGPA
    let cgpa = gpa;
    // For earned credits: retake credits were already counted in prev, so don't double-count
    let totalEarnedWithPrev = earnedCredits + prevCredits - retakeCredits;
    // But if there's a retake where previous was F (not earned), the credit wasn't in prev earned
    // We keep it simple: retake credits are assumed already in prevCredits

    if (prevCGPA > 0 && prevCredits > 0) {
        // Remove old retake grade points, add new ones
        // prevWeighted already includes the old grades for retake courses
        const prevWeighted = prevCGPA * prevCredits;
        // Subtract old retake contribution, retake credits don't add to denominator
        const adjustedPrevWeighted = prevWeighted - retakeOldWeighted;
        const adjustedPrevCredits = prevCredits - retakeCredits;

        const combinedWeighted = adjustedPrevWeighted + totalWeightedGP;
        const combinedCredits = adjustedPrevCredits + totalCredits;
        cgpa = combinedCredits > 0 ? combinedWeighted / combinedCredits : 0;

        totalEarnedWithPrev = adjustedPrevCredits + earnedCredits;
    }

    // Update DOM
    currentGPAEl.textContent = gpa.toFixed(2);
    cumulativeCGPAEl.textContent = cgpa.toFixed(2);
    trimesterCreditsEl.textContent = totalCredits;
    earnedCreditsEl.textContent = `${earnedCredits - retakeCredits} earned`;
    totalCreditsEl.textContent = totalEarnedWithPrev;
    totalCreditsSubEl.textContent = prevCredits > 0 ? `${prevCredits} prev + ${earnedCredits - retakeCredits} new` : `${earnedCredits} earned`;

    // Tags
    gpaTagEl.textContent = getAssessment(gpa);
    cgpaTagEl.textContent = getAssessment(cgpa);

    // CGPA danger coloring
    if (cgpa > 0 && cgpa < 2.0) {
        cgpaTagEl.style.background = 'rgba(239, 68, 68, 0.12)';
        cgpaTagEl.style.color = '#ef4444';
    } else {
        cgpaTagEl.style.background = '';
        cgpaTagEl.style.color = '';
    }
}

function getAssessment(gpa) {
    if (gpa >= 3.97) return 'Outstanding';
    if (gpa >= 3.67) return 'Excellent';
    if (gpa >= 3.33) return 'Very Good';
    if (gpa >= 3.00) return 'Good';
    if (gpa >= 2.67) return 'Above Average';
    if (gpa >= 2.33) return 'Average';
    if (gpa >= 2.00) return 'Below Average';
    if (gpa >= 1.67) return 'Poor';
    if (gpa >= 1.33) return 'Very Poor';
    if (gpa >= 1.00) return 'Pass';
    if (gpa > 0) return 'Fail';
    return '—';
}

function animateResults() {
    document.querySelectorAll('.result-card').forEach((card, i) => {
        card.classList.remove('animate');
        setTimeout(() => card.classList.add('animate'), i * 80);
    });

    showToast('Calculated successfully!', 'success');
}

// ---------- Reset ----------
function resetAll() {
    prevCGPAInput.value = '';
    prevCreditsInput.value = '';
    coursesList.innerHTML = '';
    courseCount = 0;

    for (let i = 0; i < 5; i++) addCourseRow();
    calculate();
    clearStorage();
    showToast('All fields reset', 'success');
}

// ---------- Toast ----------
function showToast(msg, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast ${type}`;

    requestAnimationFrame(() => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    });
}

// ---------- Local Storage ----------
function saveToStorage() {
    const rows = coursesList.querySelectorAll('.course-row');
    const courses = [];
    rows.forEach(row => {
        courses.push({
            credit: row.querySelector('.course-credit')?.value,
            grade: row.querySelector('.course-grade')?.value,
            retake: row.querySelector('.course-retake')?.checked || false,
            prevGrade: row.querySelector('.prev-grade-select')?.value || ''
        });
    });

    const data = {
        prevCGPA: prevCGPAInput.value,
        prevCredits: prevCreditsInput.value,
        courses
    };

    localStorage.setItem('uiu-cgpa-data', JSON.stringify(data));
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem('uiu-cgpa-data');
        if (!raw) return;
        const data = JSON.parse(raw);

        if (data.prevCGPA) prevCGPAInput.value = data.prevCGPA;
        if (data.prevCredits) prevCreditsInput.value = data.prevCredits;

        if (data.courses && data.courses.length > 0) {
            data.courses.forEach(c => addCourseRow(c));
        }
    } catch (e) {
        console.warn('Failed to load saved data:', e);
    }
}

function clearStorage() {
    localStorage.removeItem('uiu-cgpa-data');
}

// ---------- Start ----------
document.addEventListener('DOMContentLoaded', init);
