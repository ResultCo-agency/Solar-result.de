/* ============================================
   SOLARRESULT - Meta Tracking Module
   Pixel + Conversions API with Deduplication
   ============================================ */

(function() {
    'use strict';

    const META_PIXEL_ID = '1769505890332213';
    const META_CAPI_TOKEN = 'EAAUZCdMdY8NgBQ28WMVNyXqUqe5kZAVAheBaJqTX3KtweH0S4SdPn4BeBGKnRbS9qI0G25fD3ZAILNhRisjq4b5nqVZAjCyewOOjksxmLK6KYkt0o53IdK8luapGiok6yfE0ZCCZCJVbVuZB6OHMprwGhZBP3DYbcXuGp1I3vs4SGBoo5k2jd2cJdPt9EkA2AK2DGAZDZD';
    const META_CAPI_URL = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

    // Generate unique event ID for deduplication between Pixel and CAPI
    function generateEventId() {
        return 'sr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    }

    // Get hashed user data for CAPI (SHA-256)
    async function hashValue(value) {
        if (!value) return null;
        const normalized = value.trim().toLowerCase();
        const encoder = new TextEncoder();
        const data = encoder.encode(normalized);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Get user agent and URL info
    function getClientInfo() {
        return {
            client_user_agent: navigator.userAgent,
            event_source_url: window.location.href,
            fbc: getCookie('_fbc') || null,
            fbp: getCookie('_fbp') || null
        };
    }

    // Get cookie by name
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    // Send event to Conversions API
    async function sendCAPI(eventName, eventId, userData, customData) {
        const clientInfo = getClientInfo();

        const eventData = {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            event_source_url: clientInfo.event_source_url,
            action_source: 'website',
            user_data: {
                client_user_agent: clientInfo.client_user_agent,
                client_ip_address: null // Will be filled by Meta from the request
            }
        };

        // Add Facebook cookie identifiers for matching
        if (clientInfo.fbc) eventData.user_data.fbc = clientInfo.fbc;
        if (clientInfo.fbp) eventData.user_data.fbp = clientInfo.fbp;

        // Add hashed user data if available
        if (userData) {
            if (userData.email) {
                eventData.user_data.em = [await hashValue(userData.email)];
            }
            if (userData.phone) {
                eventData.user_data.ph = [await hashValue(userData.phone)];
            }
            if (userData.name) {
                // Split name into first/last
                const parts = userData.name.trim().split(/\s+/);
                if (parts.length > 0) {
                    eventData.user_data.fn = [await hashValue(parts[0])];
                }
                if (parts.length > 1) {
                    eventData.user_data.ln = [await hashValue(parts[parts.length - 1])];
                }
            }
        }

        // Add custom data
        if (customData) {
            eventData.custom_data = customData;
        }

        try {
            await fetch(META_CAPI_URL + '?access_token=' + META_CAPI_TOKEN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [eventData] })
            });
        } catch (e) {
            console.warn('CAPI send failed:', e);
        }
    }

    // ── PUBLIC API ──
    window.SRTracking = {

        /**
         * Track Lead event (when contact form is submitted in Step 1)
         */
        trackLead: function(userData) {
            const eventId = generateEventId();

            // Pixel (browser-side)
            if (typeof fbq === 'function') {
                fbq('track', 'Lead', {
                    content_name: 'Solar Erstgespräch',
                    content_category: 'booking_form'
                }, { eventID: eventId });
            }

            // CAPI (server-side)
            sendCAPI('Lead', eventId, userData, {
                content_name: 'Solar Erstgespräch',
                content_category: 'booking_form'
            });
        },

        /**
         * Track Schedule event (when booking is confirmed in Step 3)
         */
        trackSchedule: function(userData, appointmentData) {
            const eventId = generateEventId();

            // Pixel
            if (typeof fbq === 'function') {
                fbq('track', 'Schedule', {
                    content_name: 'Erstgespräch gebucht',
                    content_category: 'appointment',
                    appointment_date: appointmentData.date || null
                }, { eventID: eventId });
            }

            // CAPI
            sendCAPI('Schedule', eventId, userData, {
                content_name: 'Erstgespräch gebucht',
                content_category: 'appointment',
                appointment_date: appointmentData.date || null
            });
        },

        /**
         * Track custom event
         */
        trackCustom: function(eventName, data) {
            const eventId = generateEventId();

            if (typeof fbq === 'function') {
                fbq('trackCustom', eventName, data || {}, { eventID: eventId });
            }

            sendCAPI(eventName, eventId, null, data);
        }
    };

})();
