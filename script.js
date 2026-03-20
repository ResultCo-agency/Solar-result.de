/* ============================================
   SOLARRESULT - Animations & Interactivity
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Top Banner close ----
    const bannerClose = document.getElementById('bannerClose');
    const topBanner = document.getElementById('siteTopBanner');
    if (bannerClose && topBanner) {
        bannerClose.addEventListener('click', () => {
            topBanner.classList.add('hidden');
        });
    }

    // ---- Navbar scroll effect ----
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ---- Mobile menu ----
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.remove('active'));
        });
    }

    // ---- Smooth scroll for anchor links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- Sale Badge Animation (smooth cycling) ----
    const badges = document.querySelectorAll('.sale-badge');
    const badgeAmounts = [
        '15.800', '17.200', '22.400', '19.600', '14.300',
        '28.900', '16.500', '21.100', '13.700', '25.600',
        '18.400', '20.800', '11.900', '23.500', '15.200'
    ];
    const activeBadges = new Set();

    function showRandomBadge() {
        const badgeArray = Array.from(badges);
        const available = badgeArray.filter((_, i) => !activeBadges.has(i));
        if (available.length === 0 || activeBadges.size >= 3) return;

        const randomAvailable = available[Math.floor(Math.random() * available.length)];
        const idx = badgeArray.indexOf(randomAvailable);
        const badge = randomAvailable;
        const amount = badgeAmounts[Math.floor(Math.random() * badgeAmounts.length)];

        badge.querySelector('.badge-amount').textContent = amount + ' \u20AC';
        badge.classList.remove('hiding');
        badge.classList.add('visible');
        activeBadges.add(idx);

        // Hide after 3-5 seconds (longer = less hectic)
        const hideDelay = 3000 + Math.random() * 2000;
        setTimeout(() => {
            badge.classList.remove('visible');
            badge.classList.add('hiding');
            setTimeout(() => {
                badge.classList.remove('hiding');
                activeBadges.delete(idx);
            }, 400);
        }, hideDelay);
    }

    // Staggered start
    setTimeout(() => showRandomBadge(), 800);
    setTimeout(() => showRandomBadge(), 2000);
    setTimeout(() => showRandomBadge(), 3200);

    // Keep cycling at a calm pace
    setInterval(() => {
        if (activeBadges.size < 3) {
            showRandomBadge();
        }
    }, 2500);

    // ---- Counter Animation ----
    function animateCounter(element, target, duration, prefix, suffix) {
        prefix = prefix || '';
        suffix = suffix || '';
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * eased);

            if (target >= 1000) {
                element.textContent = prefix + current.toLocaleString('de-DE') + suffix;
            } else {
                element.textContent = prefix + current + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Start hero counters after a short delay
    setTimeout(() => {
        const el1 = document.getElementById('counterLeads');
        const el2 = document.getElementById('counterTermine');
        const el3 = document.getElementById('counterUmsatz');
        if (el1) animateCounter(el1, 47, 2000, '', '');
        if (el2) animateCounter(el2, 32, 2200, '', '');
        if (el3) animateCounter(el3, 127, 2500, '', 'k');
    }, 800);

    // ---- Live Feed Animation (FIXED: smooth, no resize) ----
    const feedData = [
        { title: 'PV-Anlage 9.8 kWp', meta: 'Einfamilienhaus \u2022 Raum M\u00FCnchen', amount: '15.800 \u20AC' },
        { title: 'PV + Speicher 12.4 kWp', meta: 'Neubau \u2022 Raum Stuttgart', amount: '22.400 \u20AC' },
        { title: 'PV-Anlage 7.2 kWp', meta: 'Bestandsgeb\u00E4ude \u2022 Raum K\u00F6ln', amount: '12.900 \u20AC' },
        { title: 'PV-Anlage 11.0 kWp', meta: 'Reihenhaus \u2022 Raum Hamburg', amount: '19.200 \u20AC' },
        { title: 'PV + Wallbox 8.8 kWp', meta: 'Einfamilienhaus \u2022 Raum Frankfurt', amount: '24.600 \u20AC' },
        { title: 'PV-Anlage 6.5 kWp', meta: 'Doppelhaush\u00E4lfte \u2022 Raum Berlin', amount: '11.800 \u20AC' },
        { title: 'PV + Speicher 14.2 kWp', meta: 'Neubau \u2022 Raum D\u00FCsseldorf', amount: '28.400 \u20AC' },
        { title: 'PV-Anlage 10.5 kWp', meta: 'Bestand \u2022 Raum N\u00FCrnberg', amount: '17.600 \u20AC' },
        { title: 'PV + Speicher 9.0 kWp', meta: 'Einfamilienhaus \u2022 Raum Hannover', amount: '21.200 \u20AC' },
        { title: 'PV-Anlage 13.6 kWp', meta: 'Villa \u2022 Raum M\u00FCnster', amount: '26.800 \u20AC' },
    ];

    let feedIndex = 3; // Start after the 3 initial items
    const liveFeed = document.getElementById('liveFeed');
    let feedAnimating = false;

    function addFeedItem() {
        if (!liveFeed || feedAnimating) return;
        feedAnimating = true;

        const data = feedData[feedIndex % feedData.length];
        feedIndex++;

        // Create new item
        const item = document.createElement('div');
        item.className = 'feed-item entering';
        item.innerHTML = `
            <div class="feed-item-icon">\u26A1</div>
            <div class="feed-item-content">
                <span class="feed-item-title">${data.title}</span>
                <span class="feed-item-meta">${data.meta}</span>
            </div>
            <span class="feed-item-amount">${data.amount}</span>
        `;

        // Get existing items
        const items = liveFeed.querySelectorAll('.feed-item:not(.exiting)');

        // Mark the last item for removal if we have 3+
        if (items.length >= 3) {
            const lastItem = items[items.length - 1];
            lastItem.classList.add('exiting');

            // Remove after animation completes
            lastItem.addEventListener('animationend', () => {
                lastItem.remove();
            }, { once: true });
        }

        // Insert at the top
        liveFeed.insertBefore(item, liveFeed.firstChild);

        // Remove entering class after animation
        item.addEventListener('animationend', () => {
            item.classList.remove('entering');
            feedAnimating = false;
        }, { once: true });

        // Safety fallback
        setTimeout(() => { feedAnimating = false; }, 800);
    }

    // Cycle feed every 5 seconds (calmer pace)
    setInterval(addFeedItem, 5000);

    // ---- Tabs ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
            animateVisibleBars();
        });
    });

    // ---- Scroll-triggered animations ----
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animate stat numbers
                if (entry.target.classList.contains('stat-card')) {
                    const numEl = entry.target.querySelector('.stat-number');
                    if (numEl && !numEl.dataset.animated) {
                        numEl.dataset.animated = 'true';
                        const target = parseInt(numEl.dataset.target);
                        const suffix = numEl.dataset.suffix || '';
                        animateCounter(numEl, target, 2000, '', suffix);
                    }
                }

                // Animate metric bars
                if (entry.target.classList.contains('visual-card') ||
                    entry.target.classList.contains('tab-panel')) {
                    animateVisibleBars();
                }
            }
        });
    }, observerOptions);

    // Add fade-up and observe
    const animateElements = document.querySelectorAll(
        '.stat-card, .result-card, .bento-card, .process-step, .tab-info, .visual-card, .booking-info, .booking-calendar'
    );

    animateElements.forEach((el, i) => {
        el.classList.add('fade-up');
        el.style.transitionDelay = `${(i % 4) * 0.1}s`;
        observer.observe(el);
    });

    document.querySelectorAll('.section-title, .section-subtitle, .section-label').forEach(el => {
        el.classList.add('fade-up');
        observer.observe(el);
    });

    // ---- Metric bar animation ----
    function animateVisibleBars() {
        document.querySelectorAll('.metric-fill').forEach(bar => {
            const panel = bar.closest('.tab-panel');
            if (!panel || panel.classList.contains('active')) {
                const targetWidth = bar.style.width;
                bar.style.width = '0';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        bar.style.width = targetWidth;
                    });
                });
            }
        });
    }

    setTimeout(animateVisibleBars, 500);

    // ---- Parallax for suburb scene ----
    const suburbScene = document.getElementById('suburbScene');
    if (suburbScene) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const heroEl = document.getElementById('hero');
            if (!heroEl) return;
            const heroHeight = heroEl.offsetHeight;
            if (scrollY < heroHeight) {
                const progress = scrollY / heroHeight;
                suburbScene.style.opacity = 0.65 - progress * 0.5;
                suburbScene.style.transform = `translate(-50%, calc(-55% + ${scrollY * 0.15}px))`;
            }
        }, { passive: true });
    }

    // ---- Total amount gentle pulse ----
    const totalEl = document.getElementById('totalAmount');
    if (totalEl) {
        const amounts = [127400, 134800, 119600, 142200, 138500, 125900, 147300, 131700];
        let amountIndex = 0;

        setInterval(() => {
            amountIndex = (amountIndex + 1) % amounts.length;
            const target = amounts[amountIndex];
            totalEl.textContent = target.toLocaleString('de-DE') + ' \u20AC';
            totalEl.style.transform = 'scale(1.03)';
            setTimeout(() => {
                totalEl.style.transform = 'scale(1)';
            }, 300);
        }, 6000);
    }

});
