let currentSection = 1;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyg6r7zjukCo6KgaB-eYhxnTf0jmoW-6gyynF-t_Cz37CMmbFNcJBQ2e6njNxzcxhx6AQ/exec';

const totalSections = 4;
const completedSections = new Set();

function switchSection(step) {
    const navItem = document.querySelector(`.nav-item[data-section="${step}"]`);

    // Prevent switching to disabled sections
    if (navItem && navItem.classList.contains('disabled')) {
        return;
    }

    // Remove active from all sections and nav items
    document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        // Restore completed class if this section was completed and not the current one
        const sectionNum = parseInt(el.getAttribute('data-section'));
        if (completedSections.has(sectionNum) && sectionNum !== step) {
            el.classList.add('completed');
        }
    });

    // Activate current section
    document.getElementById(`section-${step}`).classList.add('active');
    if (navItem) {
        navItem.classList.add('active');
        // Remove completed class from active tab to show active state instead
        navItem.classList.remove('completed');
    }

    currentSection = step;
}

function unlockSection(sectionNumber) {
    const navItem = document.querySelector(`.nav-item[data-section="${sectionNumber}"]`);
    if (navItem) {
        navItem.classList.remove('disabled');
    }
}

function markSectionCompleted(sectionNumber) {
    completedSections.add(sectionNumber);
    const navItem = document.querySelector(`.nav-item[data-section="${sectionNumber}"]`);
    if (navItem) {
        navItem.classList.add('completed');
    }
}

function toggleOption(btn, inputId, value) {
    btn.classList.toggle('active');

    const input = document.getElementById(inputId);
    const parent = btn.parentElement;
    const activeBtns = parent.querySelectorAll('.option-btn.active');

    // Use innerText to respect visible text and regex to clean whitespace/newlines
    const selectedValues = Array.from(activeBtns)
        .map(b => b.innerText.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim())
        .join(', ');

    input.value = selectedValues;

    // Remove error styling if valid
    if (selectedValues) input.style.borderColor = '';
}

function selectSingleOption(btn, inputId, value) {
    const parent = btn.parentElement;
    // Deselect all others
    parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));

    // Select clicked
    btn.classList.add('active');

    const input = document.getElementById(inputId);
    input.value = value;
    input.style.borderColor = '';
}

function nextSection() {
    if (currentSection < totalSections) {
        const section = document.getElementById(`section-${currentSection}`);
        let valid = true;
        let firstInvalidField = null;

        // Check text inputs, email, tel, date
        const textInputs = section.querySelectorAll('input[type="text"][required], input[type="email"][required], input[type="tel"][required], input[type="date"][required]');
        textInputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'red';
                valid = false;
                if (!firstInvalidField) firstInvalidField = input;
            } else {
                input.style.borderColor = '';
            }
        });

        // Check select dropdowns
        const selects = section.querySelectorAll('select[required]');
        selects.forEach(select => {
            if (!select.value || select.value === '') {
                select.style.borderColor = 'red';
                valid = false;
                if (!firstInvalidField) firstInvalidField = select;
            } else {
                select.style.borderColor = '';
            }
        });

        // Check checkboxes
        const checkboxes = section.querySelectorAll('input[type="checkbox"][required]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                valid = false;
                if (!firstInvalidField) firstInvalidField = checkbox;
            }
        });

        // Check radio button groups
        const radioGroups = {};
        section.querySelectorAll('input[type="radio"][required]').forEach(radio => {
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = [];
            }
            radioGroups[radio.name].push(radio);
        });

        for (const groupName in radioGroups) {
            const radios = radioGroups[groupName];
            const isChecked = radios.some(radio => radio.checked);
            if (!isChecked) {
                valid = false;
                if (!firstInvalidField) firstInvalidField = radios[0];
            }
        }

        // Check hidden inputs (button groups)
        const hiddenInputs = section.querySelectorAll('input[type="hidden"][required]');
        hiddenInputs.forEach(input => {
            if (!input.value) {
                valid = false;
                if (!firstInvalidField) firstInvalidField = input;
            }
        });

        if (!valid) {
            alert('Please fill out all required fields before continuing.');
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Mark current section as completed
        markSectionCompleted(currentSection);

        // Unlock next section
        if (currentSection + 1 <= totalSections) {
            unlockSection(currentSection + 1);
        }

        switchSection(currentSection + 1);
    }
}

function prevSection() {
    if (currentSection > 1) {
        switchSection(currentSection - 1);
    }
}

function handleFinalSubmit(e) {
    e.preventDefault();

    // Validate section 4 fields before submitting
    const section = document.getElementById('section-4');
    let valid = true;
    let firstInvalidField = null;

    // Check hidden inputs (button groups for days and times)
    const hiddenInputs = section.querySelectorAll('input[type="hidden"][required]');
    hiddenInputs.forEach(input => {
        if (!input.value) {
            valid = false;
            if (!firstInvalidField) firstInvalidField = input;
        }
    });

    if (!valid) {
        alert('Please fill out all required fields before submitting.');
        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Immediately show success overlay to prevent double submission
    document.getElementById('submissionOverlay').classList.add('active');

    // Collect all form data
    const formData = new FormData(e.target);

    // Convert FormData to object for sending to Google Sheets
    const data = {
        timestamp: new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
        firstName: (formData.get('firstName') || '').replace(/\b\w/g, l => l.toUpperCase()),
        lastName: (formData.get('lastName') || '').replace(/\b\w/g, l => l.toUpperCase()),
        phone: formData.get('phone') || '',
        email: formData.get('email') || '',
        preferredContact: formData.get('preferredContact') || '',
        agent: document.getElementById('agentCheckbox').checked ? 'No agent' : '',
        // Use explicit .value from elements to ensure we get the latest JS-updated values
        propertyInterest: document.getElementById('input-propertyInterest').value || '',
        bedrooms: document.getElementById('input-bedrooms').value || '',
        neighborhoods: document.getElementById('input-neighborhoods').value || '',
        moveInDate: formData.get('moveInDate') || '',
        budget: document.getElementById('input-budget').value || '',
        nonNegotiables: document.getElementById('input-negotiables').value || '',
        hasPets: document.getElementById('hasPetsCheckbox').checked ? 'Yes' : 'No',
        catCount: formData.get('catCount') || '0',
        dogCount: formData.get('dogCount') || '0',
        dogDetails: formData.get('dogDetails') || '',
        coapplicants: document.getElementById('input-coapplicants').value || '',
        evictions: document.getElementById('input-evictions').value || '',
        verifiableIncome: document.getElementById('input-verifiableIncome').value || '',
        creditScore: formData.get('creditScore') || '',
        tourDays: document.getElementById('input-tour-days').value || '',
        tourTimes: document.getElementById('input-tour-times').value || '',
        notes: formData.get('notes') || ''
    };

    // Send to Google Sheets in the background (fire and forget)
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(() => {
        // Silently handle any errors - overlay already shown
    });
}

function togglePetOptions() {
    const hasPets = document.getElementById('hasPetsCheckbox').checked;
    const petOptions = document.getElementById('petOptions');
    if (hasPets) {
        petOptions.style.display = 'block';
    } else {
        petOptions.style.display = 'none';

        // Clear values when hiding
        document.getElementById('catCount').value = '';
        document.getElementById('dogCount').value = '';
        document.getElementById('dogDetailsInput').value = '';
        toggleDogDetails();
    }
}

function toggleDogDetails() {
    const dogCount = document.getElementById('dogCount').value;
    const dogOptions = document.getElementById('dogOptions');

    // Show details if dog count is > 0
    if (dogCount && parseInt(dogCount) > 0) {
        dogOptions.style.display = 'block';
        // Make required if visible
        document.getElementById('dogDetailsInput').setAttribute('required', 'required');
    } else {
        dogOptions.style.display = 'none';
        document.getElementById('dogDetailsInput').removeAttribute('required');
    }
}

// Mobile menu toggle
function toggleMenu() {
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('active');
}
