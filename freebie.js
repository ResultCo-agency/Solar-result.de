/* ============================================
   SOLARRESULT - Freebie Landing Page JS
   Step 1: Form → Lead capture + Blueprint delivery
   Step 2: Calendar → Optional booking
   Step 3: Confirmation
   ============================================ */

(function() {
    'use strict';

    const CAL_USERNAME = 'phillip-kirillov';
    const CAL_EVENT_SLUG = 'erstgesprach-solar';
    const CAL_API = 'https://api.cal.com/v2';
    const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';
    const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    const SHEET_WEBHOOK = 'https://script.google.com/a/macros/resultco.de/s/AKfycbyA7xIjqHiiXvtcMc8pE__rDrys-US37g5MXhSVVsxh6kxyX2Yh8b2PDyscGpGK3PVZ/exec';

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let availableSlots = {};
    let selectedDate = null;
    let selectedSlot = null;
    let eventTypeId = null;
    let contactData = {};

    const calGrid = document.getElementById('fb-cal-grid');
    const calTitle = document.getElementById('fb-cal-title');
    const btnBook = document.getElementById('fb-btn-book');
    const slotsEl = document.getElementById('fb-slots');
    const step1 = document.getElementById('fb-step-1');
    const step2 = document.getElementById('fb-step-2');
    const step3 = document.getElementById('fb-step-3');

    if (!calGrid) return;

    init();

    async function init() {
        renderCalendar();
        bindEvents();
        await fetchEventType();
        fetchSlots();
    }

    async function fetchEventType() {
        try {
            const r = await fetch(`${CAL_API}/event-types?username=${CAL_USERNAME}&eventSlug=${CAL_EVENT_SLUG}`, { headers: { 'cal-api-version': '2024-06-14' } });
            const d = await r.json();
            if (d.status === 'success' && d.data && d.data.length > 0) eventTypeId = d.data[0].id;
        } catch (e) { console.warn('Event type fetch failed', e); }
    }

    async function fetchSlots() {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth + 1, 0);
        let url;
        if (eventTypeId) url = `${CAL_API}/slots?eventTypeId=${eventTypeId}&start=${fmtDate(start)}&end=${fmtDate(end)}&timeZone=${TIMEZONE}&format=range`;
        else url = `${CAL_API}/slots?eventTypeSlug=${CAL_EVENT_SLUG}&username=${CAL_USERNAME}&start=${fmtDate(start)}&end=${fmtDate(end)}&timeZone=${TIMEZONE}&format=range`;
        try {
            const r = await fetch(url, { headers: { 'cal-api-version': '2024-09-04' } });
            if (!r.ok) throw new Error(r.status);
            const j = await r.json();
            availableSlots = (j.status === 'success' && j.data) ? j.data : {};
        } catch (e) { availableSlots = {}; }
        renderCalendar();
    }

    function renderCalendar() {
        calTitle.textContent = `${MONTHS_DE[currentMonth]} ${currentYear}`;
        const today = new Date(); today.setHours(0,0,0,0);
        const first = new Date(currentYear, currentMonth, 1);
        const last = new Date(currentYear, currentMonth + 1, 0);
        let sw = first.getDay() - 1; if (sw < 0) sw = 6;
        const now = new Date();
        document.getElementById('fb-cal-prev').disabled = (currentYear === now.getFullYear() && currentMonth <= now.getMonth());

        let h = '';
        for (let i = 0; i < sw; i++) h += '<button class="ibp-cal-day empty" disabled></button>';
        for (let d = 1; d <= last.getDate(); d++) {
            const dt = new Date(currentYear, currentMonth, d);
            const ds = fmtDate(dt);
            const past = dt < today;
            const hasSlots = availableSlots[ds] && availableSlots[ds].length > 0;
            let cls = 'ibp-cal-day';
            if (past) cls += ' disabled';
            else if (hasSlots) cls += ' available';
            if (dt.getTime() === today.getTime()) cls += ' today';
            if (selectedDate === ds) cls += ' selected';
            h += `<button class="${cls}" data-date="${ds}" ${past?'disabled':''}>${d}</button>`;
        }
        calGrid.innerHTML = h;
    }

    function renderSlots(dateStr) {
        const slots = availableSlots[dateStr];
        if (!slots || !slots.length) { slotsEl.innerHTML = '<div class="ibp-slots-empty">Keine Termine verfügbar.</div>'; btnBook.classList.add('visible'); btnBook.classList.remove('ready'); return; }
        const dt = new Date(dateStr+'T00:00:00');
        const dn = ['So','Mo','Di','Mi','Do','Fr','Sa'][dt.getDay()];
        let h = `<div class="ibp-slots-date">${dn}, ${dt.getDate()}. ${MONTHS_DE[dt.getMonth()].substring(0,3)}</div><div class="ibp-slots-scroll">`;
        slots.forEach(s => {
            const t = new Date(s.start).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:TIMEZONE});
            h += `<button class="ibp-slot-btn" data-start="${s.start}" data-end="${s.end}">${t}</button>`;
        });
        h += '</div>';
        slotsEl.innerHTML = h;
        btnBook.classList.add('visible');
        btnBook.classList.remove('ready');
    }

    function goToStep(n) {
        [step1, step2, step3].forEach((s,i) => s.classList.toggle('active', i === n-1));
    }

    function bindEvents() {
        // Form submit
        document.getElementById('fb-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fn = document.getElementById('fb-name').value.trim();
            const ln = document.getElementById('fb-lastname').value.trim();
            const em = document.getElementById('fb-email').value.trim();
            const ph = document.getElementById('fb-phone').value.trim();

            let valid = true;
            ['fb-fg-name','fb-fg-lastname','fb-fg-email'].forEach(id => document.getElementById(id).classList.remove('has-error'));
            if (!fn) { document.getElementById('fb-fg-name').classList.add('has-error'); valid = false; }
            if (!ln) { document.getElementById('fb-fg-lastname').classList.add('has-error'); valid = false; }
            if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { document.getElementById('fb-fg-email').classList.add('has-error'); valid = false; }
            if (!valid) return;

            contactData = { name: fn + ' ' + ln, firstname: fn, lastname: ln, email: em, phone: ph ? '+49' + ph.replace(/^\+?49/,'').trim() : '' };

            // Save lead
            saveLead(contactData);

            // Track
            if (window.SRTracking) SRTracking.trackLead({ name: contactData.name, email: em, phone: contactData.phone });
            if (typeof fbq === 'function') fbq('track', 'CompleteRegistration', { content_name: 'KI Blueprint Download' });

            goToStep(2);
        });

        // Calendar nav
        document.getElementById('fb-cal-prev').addEventListener('click', () => { currentMonth--; if (currentMonth<0){currentMonth=11;currentYear--;} selectedDate=null; selectedSlot=null; slotsEl.innerHTML=''; btnBook.classList.remove('visible','ready'); fetchSlots(); });
        document.getElementById('fb-cal-next').addEventListener('click', () => { currentMonth++; if (currentMonth>11){currentMonth=0;currentYear++;} selectedDate=null; selectedSlot=null; slotsEl.innerHTML=''; btnBook.classList.remove('visible','ready'); fetchSlots(); });

        // Select date
        calGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.ibp-cal-day');
            if (!btn || btn.disabled || btn.classList.contains('empty')) return;
            selectedDate = btn.dataset.date; selectedSlot = null;
            calGrid.querySelectorAll('.ibp-cal-day.selected').forEach(d => d.classList.remove('selected'));
            btn.classList.add('selected');
            renderSlots(selectedDate);
        });

        // Select slot
        slotsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.ibp-slot-btn');
            if (!btn) return;
            selectedSlot = { start: btn.dataset.start, end: btn.dataset.end };
            slotsEl.querySelectorAll('.ibp-slot-btn.selected').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            btnBook.classList.add('ready');
        });

        // Book
        btnBook.addEventListener('click', async () => {
            if (!selectedSlot) return;
            btnBook.disabled = true;
            btnBook.innerHTML = '<span class="fb-spinner"></span> Wird gebucht\u2026';
            try {
                const body = { start: selectedSlot.start, attendee: { name: contactData.name, email: contactData.email, timeZone: TIMEZONE, language: 'de' }, metadata: { source: 'solarresult.de/blueprint' } };
                if (eventTypeId) body.eventTypeId = eventTypeId;
                else { body.eventTypeSlug = CAL_EVENT_SLUG; body.username = CAL_USERNAME; }
                if (contactData.phone) body.attendee.phoneNumber = contactData.phone;
                const r = await fetch(`${CAL_API}/bookings`, { method:'POST', headers:{'Content-Type':'application/json','cal-api-version':'2024-08-13'}, body:JSON.stringify(body) });
                const j = await r.json();
                if (r.ok && j.status === 'success') {
                    updateLeadBooked(contactData.email, selectedSlot.start);
                    if (window.SRTracking) SRTracking.trackSchedule({ name:contactData.name, email:contactData.email, phone:contactData.phone }, { date:selectedSlot.start });
                    showConfirmation(true);
                } else throw new Error(j.message || 'Fehler');
            } catch (err) {
                const errEl = document.getElementById('fb-error');
                document.getElementById('fb-error-text').textContent = 'Buchung fehlgeschlagen: ' + err.message;
                errEl.classList.add('visible');
                btnBook.disabled = false; btnBook.classList.add('ready');
                btnBook.innerHTML = 'Termin buchen <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';
            }
        });

        // Skip
        document.getElementById('fb-skip').addEventListener('click', () => showConfirmation(false));
    }

    function showConfirmation(withBooking) {
        let html = '';
        if (withBooking && selectedSlot) {
            const d = new Date(selectedSlot.start);
            const dn = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][d.getDay()];
            const time = d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:TIMEZONE});
            html += `<div class="ibp-confirm-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span><strong>${dn}, ${d.getDate()}. ${MONTHS_DE[d.getMonth()]} \u00B7 ${time} Uhr</strong></span></div>`;
            html += `<div class="ibp-confirm-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4"/></svg><span>30 Min. Google Meet</span></div>`;
        }
        html += `<div class="ibp-confirm-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>Blueprint an <strong>${escHtml(contactData.email)}</strong></span></div>`;
        document.getElementById('fb-confirm-details').innerHTML = html;
        goToStep(3);
    }

    async function saveLead(data) {
        if (!SHEET_WEBHOOK) return;
        try {
            const p = { timestamp: new Date().toISOString(), name: data.firstname, lastname: data.lastname, email: data.email, phone: data.phone, company: '', source: 'solarresult.de/blueprint', status: 'blueprint_download', meeting_duration: '30 Minuten', meeting_type: 'Google Meet' };
            await fetch(SHEET_WEBHOOK, { method: 'POST', body: JSON.stringify(p) }).catch(() => {
                const params = new URLSearchParams(p).toString();
                return fetch(SHEET_WEBHOOK + '?' + params, { mode: 'no-cors' });
            });
        } catch (e) { console.warn('Lead save failed', e); }
    }

    async function updateLeadBooked(email, slot) {
        if (!SHEET_WEBHOOK) return;
        try {
            const p = { timestamp: new Date().toISOString(), email, appointment: slot, status: 'booked', meeting_duration: '30 Minuten', meeting_type: 'Google Meet' };
            await fetch(SHEET_WEBHOOK, { method: 'POST', body: JSON.stringify(p) }).catch(() => {
                const params = new URLSearchParams(p).toString();
                return fetch(SHEET_WEBHOOK + '?' + params, { mode: 'no-cors' });
            });
        } catch (e) { console.warn('Lead update failed', e); }
    }

    function fmtDate(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    function escHtml(s) { const d=document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

})();
