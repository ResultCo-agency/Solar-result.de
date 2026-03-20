/* ============================================
   SOLARRESULT - Booking System (iClosed Style)
   Form LEFT (always visible) + Calendar RIGHT (with overlay)
   Lead capture to Google Sheet on form submit
   Cal.com API v2 for slot booking
   ============================================ */

(function() {
    'use strict';

    // ── CONFIG ──
    const CAL_USERNAME = 'phillip-kirillov';
    const CAL_EVENT_SLUG = 'erstgesprach-solar';
    const CAL_API = 'https://api.cal.com/v2';
    const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';
    const MONTHS_DE = [
        'Januar','Februar','März','April','Mai','Juni',
        'Juli','August','September','Oktober','November','Dezember'
    ];

    // Google Sheet Webhook URL (Google Apps Script Web App)
    // Replace with your deployed Apps Script URL
    const SHEET_WEBHOOK = '';

    // ── STATE ──
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let availableSlots = {};
    let selectedDate = null;
    let selectedSlot = null;
    let eventTypeId = null;
    let formUnlocked = false;
    let contactData = {};

    // ── DOM ──
    const calGrid = document.getElementById('ibp-cal-grid');
    const calTitle = document.getElementById('ibp-cal-month-title');
    const btnPrev = document.getElementById('ibp-cal-prev');
    const btnNext = document.getElementById('ibp-cal-next');
    const slotsContainer = document.getElementById('ibp-slots-container');
    const slotsArea = document.getElementById('ibp-slots-area');
    const calOverlay = document.getElementById('ibp-cal-overlay');
    const btnSubmit = document.getElementById('ibp-btn-submit');
    const apiError = document.getElementById('ibp-api-error');
    const apiErrorText = document.getElementById('ibp-api-error-text');
    const bookingError = document.getElementById('ibp-booking-error');
    const bookingErrorText = document.getElementById('ibp-booking-error-text');
    const dot1 = document.getElementById('ibp-dot-1');
    const dot2 = document.getElementById('ibp-dot-2');
    const panel = document.getElementById('ibp-panel');
    const splitView = document.getElementById('ibp-split');
    const step3 = document.getElementById('ibp-step-3');
    const formSide = document.getElementById('ibp-form-side');

    if (!calGrid) return;

    // ── INIT ──
    init();

    async function init() {
        renderCalendar();
        bindEvents();
        await fetchEventType();
        fetchSlots();
    }

    // ── FETCH EVENT TYPE ──
    async function fetchEventType() {
        try {
            const resp = await fetch(
                `${CAL_API}/event-types?username=${CAL_USERNAME}&eventSlug=${CAL_EVENT_SLUG}`,
                { headers: { 'cal-api-version': '2024-06-14' } }
            );
            const data = await resp.json();
            if (data.status === 'success' && data.data && data.data.length > 0) {
                eventTypeId = data.data[0].id;
            }
        } catch (e) {
            console.warn('Could not fetch event type ID', e);
        }
    }

    // ── FETCH SLOTS ──
    async function fetchSlots() {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth + 1, 0);
        hideError();

        let url;
        if (eventTypeId) {
            url = `${CAL_API}/slots?eventTypeId=${eventTypeId}&start=${formatDateISO(start)}&end=${formatDateISO(end)}&timeZone=${TIMEZONE}&format=range`;
        } else {
            url = `${CAL_API}/slots?eventTypeSlug=${CAL_EVENT_SLUG}&username=${CAL_USERNAME}&start=${formatDateISO(start)}&end=${formatDateISO(end)}&timeZone=${TIMEZONE}&format=range`;
        }

        try {
            const resp = await fetch(url, { headers: { 'cal-api-version': '2024-09-04' } });
            if (!resp.ok) throw new Error(`API ${resp.status}`);
            const json = await resp.json();
            availableSlots = (json.status === 'success' && json.data) ? json.data : {};
        } catch (e) {
            console.error('Slot fetch error:', e);
            showError('Termine konnten nicht geladen werden. Bitte Seite neu laden.');
            availableSlots = {};
        }

        renderCalendar();
    }

    // ── RENDER CALENDAR ──
    function renderCalendar() {
        calTitle.textContent = `${MONTHS_DE[currentMonth]} ${currentYear}`;
        const today = new Date(); today.setHours(0,0,0,0);
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        let startWeekday = firstDay.getDay() - 1;
        if (startWeekday < 0) startWeekday = 6;

        const nowMonth = new Date();
        btnPrev.disabled = (currentYear === nowMonth.getFullYear() && currentMonth <= nowMonth.getMonth());

        let html = '';
        for (let i = 0; i < startWeekday; i++) html += '<button class="ibp-cal-day empty" disabled></button>';
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(currentYear, currentMonth, d);
            const dateStr = formatDateISO(date);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const hasSlots = availableSlots[dateStr] && availableSlots[dateStr].length > 0;
            const isSelected = selectedDate === dateStr;

            let cls = 'ibp-cal-day';
            if (isPast) cls += ' disabled';
            else if (hasSlots) cls += ' available';
            if (isToday) cls += ' today';
            if (isSelected) cls += ' selected';
            html += `<button class="${cls}" data-date="${dateStr}" ${isPast ? 'disabled' : ''}>${d}</button>`;
        }
        calGrid.innerHTML = html;
    }

    // ── RENDER SLOTS ──
    function renderSlots(dateStr) {
        const slots = availableSlots[dateStr];
        if (!slots || slots.length === 0) {
            slotsContainer.innerHTML = '<div class="ibp-slots-empty">Keine Termine verfügbar.</div>';
            btnSubmit.classList.add('visible');
            btnSubmit.classList.remove('ready');
            return;
        }

        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayName = ['So','Mo','Di','Mi','Do','Fr','Sa'][dateObj.getDay()];
        const dayNum = dateObj.getDate();
        const monthShort = MONTHS_DE[dateObj.getMonth()].substring(0, 3);

        let html = `<div class="ibp-slots-date">${dayName}, ${dayNum}. ${monthShort}</div><div class="ibp-slots-scroll">`;
        slots.forEach(slot => {
            const time = new Date(slot.start);
            const timeStr = time.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', timeZone: TIMEZONE });
            html += `<button class="ibp-slot-btn" data-start="${slot.start}" data-end="${slot.end}">${timeStr}</button>`;
        });
        html += '</div>';
        slotsContainer.innerHTML = html;
        btnSubmit.classList.add('visible');
        btnSubmit.classList.remove('ready');
    }

    // ── SAVE LEAD TO GOOGLE SHEET ──
    async function saveLeadToSheet(data) {
        if (!SHEET_WEBHOOK) {
            console.log('Sheet webhook not configured. Lead data:', data);
            return;
        }
        try {
            await fetch(SHEET_WEBHOOK, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    name: data.firstname || data.name,
                    lastname: data.lastname || '',
                    email: data.email,
                    phone: data.phone,
                    company: data.company,
                    source: 'solarresult.de',
                    status: 'lead_captured',
                    meeting_duration: '30 Minuten',
                    meeting_type: 'Google Meet'
                })
            });
        } catch (e) {
            console.warn('Could not save lead to sheet:', e);
        }
    }

    // ── UPDATE LEAD STATUS (after booking) ──
    async function updateLeadStatus(email, slot) {
        if (!SHEET_WEBHOOK) return;
        try {
            await fetch(SHEET_WEBHOOK, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    email: email,
                    appointment: slot,
                    status: 'booked',
                    meeting_duration: '30 Minuten',
                    meeting_type: 'Google Meet'
                })
            });
        } catch (e) {
            console.warn('Could not update lead status:', e);
        }
    }

    // ── EVENTS ──
    function bindEvents() {

        // FORM SUBMIT → Unlock calendar + save lead
        document.getElementById('ibp-contact-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const firstName = document.getElementById('ibp-name').value.trim();
            const lastName = document.getElementById('ibp-lastname').value.trim();
            const email = document.getElementById('ibp-email').value.trim();
            const phone = document.getElementById('ibp-phone').value.trim();
            const company = document.getElementById('ibp-company').value.trim();

            // Validate
            let valid = true;
            ['ibp-fg-name', 'ibp-fg-lastname', 'ibp-fg-email'].forEach(id => {
                document.getElementById(id).classList.remove('has-error');
            });

            if (!firstName) { document.getElementById('ibp-fg-name').classList.add('has-error'); valid = false; }
            if (!lastName) { document.getElementById('ibp-fg-lastname').classList.add('has-error'); valid = false; }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('ibp-fg-email').classList.add('has-error'); valid = false; }
            if (!valid) return;

            // Store data
            contactData = {
                name: firstName + ' ' + lastName,
                firstname: firstName,
                lastname: lastName,
                email, phone: phone ? '+49' + phone.replace(/^\+?49/, '').trim() : '',
                company
            };

            // Save lead IMMEDIATELY (before booking)
            saveLeadToSheet(contactData);

            // Track Lead event
            if (window.SRTracking) {
                SRTracking.trackLead({ name: contactData.name, email, phone: contactData.phone });
            }

            // Unlock calendar
            formUnlocked = true;
            calOverlay.classList.add('hidden');
            formSide.classList.add('completed');

            // Update step indicator
            dot1.classList.remove('active');
            dot1.classList.add('done');
            dot2.classList.add('active');
        });

        // Calendar nav
        btnPrev.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            resetCalSelection();
            fetchSlots();
        });

        btnNext.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            resetCalSelection();
            fetchSlots();
        });

        // Select date
        calGrid.addEventListener('click', (e) => {
            if (!formUnlocked) return;
            const btn = e.target.closest('.ibp-cal-day');
            if (!btn || btn.disabled || btn.classList.contains('empty')) return;

            selectedDate = btn.dataset.date;
            selectedSlot = null;
            calGrid.querySelectorAll('.ibp-cal-day.selected').forEach(d => d.classList.remove('selected'));
            btn.classList.add('selected');
            renderSlots(selectedDate);
        });

        // Select slot
        slotsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.ibp-slot-btn');
            if (!btn) return;
            selectedSlot = { start: btn.dataset.start, end: btn.dataset.end };
            slotsContainer.querySelectorAll('.ibp-slot-btn.selected').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            btnSubmit.classList.add('ready');
        });

        // BOOK
        btnSubmit.addEventListener('click', async () => {
            if (!selectedSlot || !formUnlocked) return;
            hideBookingError();

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="ibp-spinner"></span> Wird gebucht\u2026';

            try {
                const body = {
                    start: selectedSlot.start,
                    attendee: {
                        name: contactData.name,
                        email: contactData.email,
                        timeZone: TIMEZONE,
                        language: 'de'
                    },
                    metadata: { source: 'solarresult.de', company: contactData.company || undefined }
                };

                if (eventTypeId) body.eventTypeId = eventTypeId;
                else { body.eventTypeSlug = CAL_EVENT_SLUG; body.username = CAL_USERNAME; }

                if (contactData.phone) body.attendee.phoneNumber = contactData.phone;

                const resp = await fetch(`${CAL_API}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'cal-api-version': '2024-08-13' },
                    body: JSON.stringify(body)
                });

                const json = await resp.json();

                if (resp.ok && json.status === 'success') {
                    // Update lead status in sheet
                    updateLeadStatus(contactData.email, selectedSlot.start);
                    showConfirmation();
                } else {
                    throw new Error(json.message || json.error || 'Unbekannter Fehler');
                }
            } catch (err) {
                console.error('Booking error:', err);
                showBookingError('Buchung fehlgeschlagen: ' + err.message);
                btnSubmit.disabled = false;
                btnSubmit.classList.add('ready');
                btnSubmit.innerHTML = 'Termin verbindlich buchen <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
            }
        });
    }

    function resetCalSelection() {
        selectedDate = null;
        selectedSlot = null;
        slotsContainer.innerHTML = '';
        btnSubmit.classList.remove('visible', 'ready');
    }

    // ── HELPERS ──
    function formatDateISO(d) {
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    function formatDateTime(startStr) {
        const d = new Date(startStr);
        const dayName = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][d.getDay()];
        return `${dayName}, ${d.getDate()}. ${MONTHS_DE[d.getMonth()]} \u00B7 ${d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:TIMEZONE})} Uhr`;
    }

    function escapeHtml(s) { const d=document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
    function showError(m) { apiErrorText.textContent=m; apiError.classList.add('visible'); }
    function hideError() { apiError.classList.remove('visible'); }
    function showBookingError(m) { bookingErrorText.textContent=m; bookingError.classList.add('visible'); }
    function hideBookingError() { bookingError.classList.remove('visible'); }

    // ── CONFIRMATION ──
    function showConfirmation() {
        if (window.SRTracking) {
            SRTracking.trackSchedule(
                { name: contactData.name, email: contactData.email, phone: contactData.phone },
                { date: selectedSlot.start }
            );
        }

        // Hide split view, show confirmation
        splitView.style.display = 'none';
        step3.classList.add('active');

        document.getElementById('ibp-confirm-details').innerHTML = `
            <div class="ibp-confirm-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span><strong>${formatDateTime(selectedSlot.start)}</strong></span>
            </div>
            <div class="ibp-confirm-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>${escapeHtml(contactData.name)}</span>
            </div>
            <div class="ibp-confirm-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>${escapeHtml(contactData.email)}</span>
            </div>
            <div class="ibp-confirm-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/></svg>
                <span>30 Min. Google Meet</span>
            </div>
        `;
    }

})();
