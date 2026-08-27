/* =============================================
   CREATIVE JAM — Static Landing Page JavaScript
   ============================================= */

(function () {
    'use strict';

    // (Preloader removed)

    // Auto-populate data-text for glitch effect
    document.querySelectorAll('.glitch-text').forEach(el => {
        el.dataset.text = el.textContent;
    });

    // Glitch animation: play only while visible
    const glitchObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            e.target.classList.toggle('in-view', e.isIntersecting);
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.glitch-text').forEach(el => glitchObserver.observe(el));

    // Custom cursor removed

    // =============================================
    // 3. SCROLL REVEAL (IntersectionObserver)
    //    Adds .is-visible when element enters viewport.
    //    After transition, adds .revealed to stop transform
    //    interference (e.g. tilt cards).
    // =============================================
    const revealSelectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur';
    const revealElements = document.querySelectorAll(revealSelectors);

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
                // After transition completes (~0.8s + max stagger 0.45s),
                // add .revealed to prevent transform jitter with tilt
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, 1300);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0) {
            // Element is above viewport — show instantly (no blank gaps on reload)
            el.classList.add('is-visible', 'revealed');
        } else {
            revealObserver.observe(el);
        }
    });

    // =============================================
    // 4. HERO PARALLAX — handled by GSAP ScrollTrigger
    // =============================================

    // =============================================
    // 5. TILT CARD EFFECT (with spring-like smoothing)
    //    Mimics Framer Motion's useSpring behavior
    // =============================================
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach((card) => {
        // Pricing cards are large → subtler tilt to match the original feel
        const isPricing = card.closest('.pricing-card') !== null;
        const maxAngle = isPricing ? 2.5 : 5;
        const springScale = isPricing ? 1.01 : 1.02;

        // Spring-like state
        let targetRotateX = 0;
        let targetRotateY = 0;
        let targetScale = 1;
        let currentRotateX = 0;
        let currentRotateY = 0;
        let currentScale = 1;
        let isHovering = false;
        let animId = null;

        // Spring parameters (stiffness=150, damping=15 → lerp factor ≈ 0.08)
        const lerpFactor = 0.08;

        function lerp(current, target, factor) {
            const diff = target - current;
            if (Math.abs(diff) < 0.001) return target;
            return current + diff * factor;
        }

        function animate() {
            currentRotateX = lerp(currentRotateX, targetRotateX, lerpFactor);
            currentRotateY = lerp(currentRotateY, targetRotateY, lerpFactor);
            currentScale = lerp(currentScale, targetScale, lerpFactor);

            card.style.transform =
                'perspective(1000px) rotateX(' + currentRotateX + 'deg) rotateY(' + currentRotateY + 'deg) scale(' + currentScale + ')';

            // Keep animating until settled
            if (
                Math.abs(currentRotateX - targetRotateX) > 0.001 ||
                Math.abs(currentRotateY - targetRotateY) > 0.001 ||
                Math.abs(currentScale - targetScale) > 0.001
            ) {
                animId = requestAnimationFrame(animate);
            } else {
                animId = null;
                // If not hovering and fully returned, clear transform
                if (!isHovering) {
                    card.style.transform = '';
                }
            }
        }

        function startAnim() {
            if (!animId) {
                animId = requestAnimationFrame(animate);
            }
        }

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const mouseXNorm = (e.clientX - centerX) / (rect.width / 2);
            const mouseYNorm = (e.clientY - centerY) / (rect.height / 2);

            targetRotateX = -mouseYNorm * maxAngle;
            targetRotateY = mouseXNorm * maxAngle;
            targetScale = springScale;
            isHovering = true;
            startAnim();
        });

        card.addEventListener('mouseleave', () => {
            targetRotateX = 0;
            targetRotateY = 0;
            targetScale = 1;
            isHovering = false;
            startAnim();
        });
    });

    // =============================================
    // 6. NEURONS BACKGROUND
    // =============================================
    function createNeurons(containerId, count) {
        const container = document.getElementById(containerId);
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const neuron = document.createElement('div');
            neuron.classList.add('neuron');

            const size = Math.random() * 4 + 2;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const dx1 = (Math.random() - 0.5) * 300;
            const dy1 = (Math.random() - 0.5) * 300;
            const dx2 = (Math.random() - 0.5) * 200;
            const dy2 = (Math.random() - 0.5) * 200;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 10;

            neuron.style.width = size + 'px';
            neuron.style.height = size + 'px';
            neuron.style.left = x + '%';
            neuron.style.top = y + '%';
            neuron.style.setProperty('--dx1', dx1 + 'px');
            neuron.style.setProperty('--dy1', dy1 + 'px');
            neuron.style.setProperty('--dx2', dx2 + 'px');
            neuron.style.setProperty('--dy2', dy2 + 'px');
            neuron.style.animationDuration = duration + 's';
            neuron.style.animationDelay = -delay + 's';

            container.appendChild(neuron);
        }
    }

    createNeurons('neuronsFeatures', 2);
    createNeurons('neuronsProcess', 2);
    createNeurons('neuronsComparison', 2);
    createNeurons('neuronsPricing', 2);
    createNeurons('neuronsCases', 2);

    // =============================================
    // 6.5. CASES CAROUSEL (infinite loop, scroll-based)
    // =============================================
    const track = document.querySelector('.case-carousel-track');
    const prevBtn = document.querySelector('.case-carousel-btn--prev');
    const nextBtn = document.querySelector('.case-carousel-btn--next');

    if (track) {
        // --- Grab original (real) cards ---
        const realCards = Array.from(track.querySelectorAll('.case-card'));
        if (realCards.length === 0) return;

        const GAP = 32; // must match CSS gap

        // --- Clone first and last for infinite illusion ---
        const firstClone = realCards[0].cloneNode(true);
        const lastClone = realCards[realCards.length - 1].cloneNode(true);
        firstClone.classList.add('case-card--clone');
        lastClone.classList.add('case-card--clone');
        firstClone.removeAttribute('id');
        lastClone.removeAttribute('id');

        track.appendChild(firstClone);           // clone of 1st → after last
        track.insertBefore(lastClone, realCards[0]); // clone of last → before first

        // All visual cards (including clones) for center-detection
        const allCards = Array.from(track.querySelectorAll('.case-card'));

        // --- Set initial scroll so first REAL card is centered ---
        // After prepending lastClone the first real card shifted right by (cloneWidth + gap)
        requestAnimationFrame(() => {
            track.style.scrollBehavior = 'auto';
            track.scrollLeft = realCards[0].offsetWidth + GAP;
            // Restore smooth after initial positioning
            requestAnimationFrame(() => {
                track.style.scrollBehavior = '';
            });
        });

        // --- Active card detection (by proximity to center) ---
        function updateActiveCard() {
            const trackRect = track.getBoundingClientRect();
            const trackCenter = trackRect.left + trackRect.width / 2;
            let closestCard = null;
            let closestDist = Infinity;

            allCards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const dist = Math.abs(trackCenter - cardCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestCard = card;
                }
            });

            allCards.forEach(c => c.classList.remove('case-card--active'));
            if (closestCard) closestCard.classList.add('case-card--active');
        }

        track.addEventListener('scroll', updateActiveCard);
        window.addEventListener('resize', updateActiveCard);
        updateActiveCard();

        // --- Snap back from clone → real card (after scroll settles) ---
        let scrollEndTimer = null;
        function onScrollEnd() {
            const active = track.querySelector('.case-card--active');
            if (!active || !active.classList.contains('case-card--clone')) return;

            // Determine which real card to jump to
            let target = null;
            if (active === firstClone) {
                target = realCards[0]; // clone of first → real first
            } else if (active === lastClone) {
                target = realCards[realCards.length - 1]; // clone of last → real last
            }

            if (target) {
                track.style.scrollBehavior = 'auto';
                target.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
                requestAnimationFrame(() => {
                    track.style.scrollBehavior = '';
                    updateActiveCard();
                });
            }
        }

        // Use 'scrollend' if supported, fallback to debounced scroll
        if ('onscrollend' in window) {
            track.addEventListener('scrollend', onScrollEnd);
        } else {
            track.addEventListener('scroll', () => {
                clearTimeout(scrollEndTimer);
                scrollEndTimer = setTimeout(onScrollEnd, 120);
            });
        }

        // --- Arrow navigation (wraps around) ---
        function scrollToCard(direction) {
            const active = track.querySelector('.case-card--active');
            if (!active) return;

            const sibling = direction === 'next'
                ? active.nextElementSibling
                : active.previousElementSibling;

            if (sibling && sibling.classList.contains('case-card')) {
                sibling.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', () => scrollToCard('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => scrollToCard('next'));

        // --- Click on any card scrolls it to center ---
        allCards.forEach(card => {
            card.addEventListener('click', () => {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            });
        });

        // --- Keyboard accessibility ---
        track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollToCard('next');
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollToCard('prev');
            }
        });
    }

    // =============================================
    // 7. CTA ELECTRON LINES
    // =============================================
    const electronsContainer = document.getElementById('ctaElectrons');
    if (electronsContainer) {
        for (let i = 0; i < 8; i++) {
            const el = document.createElement('div');
            el.classList.add('electron-h');
            el.style.top = Math.random() * 100 + '%';
            el.style.left = '-200px';
            el.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            el.style.animationDelay = (Math.random() * 2) + 's';
            electronsContainer.appendChild(el);
        }

        for (let i = 0; i < 8; i++) {
            const el = document.createElement('div');
            el.classList.add('electron-v');
            el.style.left = Math.random() * 100 + '%';
            el.style.top = '-200px';
            el.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            el.style.animationDelay = (Math.random() * 2) + 's';
            electronsContainer.appendChild(el);
        }
    }

    // =============================================
    // 9. MOBILE BURGER MENU TOGGLE
    // =============================================
    const burger = document.getElementById('navBurger');
    const mobilePanel = document.getElementById('navMobile');
    if (burger && mobilePanel) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            mobilePanel.classList.toggle('active');
            document.body.style.overflow = mobilePanel.classList.contains('active') ? 'hidden' : '';
        });
        // Close on link click
        mobilePanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                mobilePanel.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // =============================================
    // 10. SMOOTH SCROLL FOR NAV LINKS
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // =============================================
    // 10. HERO PROMO ANIMATION (looping mini-scenes)
    // =============================================
    (function initHeroPromo() {
        const scenes = [
            document.getElementById('promoScene1'),
            document.getElementById('promoScene2'),
            document.getElementById('promoScene3'),
        ];
        if (!scenes[0]) return;

        const SCENE_DURATIONS = [6500, 4500, 4000]; // ms per scene
        let current = 0;
        let typingTimeout = null;

        function showScene(index) {
            // Exit previous
            scenes.forEach(s => {
                s.classList.remove('active');
                s.classList.add('exit');
            });
            setTimeout(() => scenes.forEach(s => s.classList.remove('exit')), 600);

            current = index;
            const scene = scenes[index];
            scene.classList.add('active');

            // Trigger scene-specific effects
            if (index === 0) runTypingScene();
            if (index === 1) runMetricsScene();
            if (index === 2) runChipsScene();
        }

        function nextScene() {
            const next = (current + 1) % scenes.length;
            resetAllScenes();
            showScene(next);
            setTimeout(nextScene, SCENE_DURATIONS[next]);
        }

        function resetAllScenes() {
            // Reset scene 1
            clearTimeout(typingTimeout);
            const bubble = document.getElementById('promoTyping');
            if (bubble) bubble.innerHTML = '';
            const cards = document.getElementById('promoCards');
            if (cards) cards.classList.remove('visible');
            const roi = document.getElementById('promoROI');
            if (roi) roi.textContent = '+0%';

            // Reset scene 2
            document.querySelectorAll('.promo-metric').forEach(m => m.classList.remove('visible'));
            const pm1 = document.getElementById('pm1');
            const pm2 = document.getElementById('pm2');
            const pm3 = document.getElementById('pm3');
            if (pm1) pm1.textContent = '0%';
            if (pm2) pm2.textContent = '0';
            if (pm3) pm3.textContent = '0 сек';

            // Reset scene 3
            document.querySelectorAll('.promo-chip').forEach(c => c.classList.remove('visible'));
        }

        // --- Scene 1: Typing ---
        function runTypingScene() {
            const text = 'Запусти рекламу на WB и Ozon, бюджет 600k ₽, цель — ROAS > 2.5';
            const bubble = document.getElementById('promoTyping');
            if (!bubble) return;
            let i = 0;

            function typeChar() {
                if (i < text.length) {
                    bubble.innerHTML = text.substring(0, i + 1) + '<span class="promo-typing-cursor"></span>';
                    i++;
                    typingTimeout = setTimeout(typeChar, 25 + Math.random() * 25);
                } else {
                    bubble.innerHTML = text;
                    setTimeout(() => {
                        const cards = document.getElementById('promoCards');
                        if (cards) cards.classList.add('visible');
                        promoCountROI();
                    }, 400);
                }
            }
            setTimeout(typeChar, 500);
        }

        function promoCountROI() {
            const el = document.getElementById('promoROI');
            if (!el) return;
            let val = 0;
            const target = 218;
            const step = () => {
                val += Math.ceil((target - val) * 0.1);
                if (val >= target) val = target;
                el.textContent = '+' + val + '%';
                if (val < target) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        // --- Scene 2: Metrics ---
        function runMetricsScene() {
            const items = document.querySelectorAll('.promo-metric');
            items.forEach((item, i) => {
                setTimeout(() => item.classList.add('visible'), 200 + i * 300);
            });

            setTimeout(() => promoCount('pm1', 218, '%', 1200), 400);
            setTimeout(() => promoCount('pm2', 4700, '', 1200), 700);
            setTimeout(() => promoCount('pm3', 90, ' сек', 1000), 1000);
        }

        function promoCount(id, target, suffix, duration) {
            const el = document.getElementById(id);
            if (!el) return;
            const start = performance.now();

            function update(now) {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const val = Math.round(eased * target);
                el.textContent = (target >= 1000 ? val.toLocaleString('ru-RU') : val) + suffix;
                if (p < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
        }

        // --- Scene 3: Chips ---
        function runChipsScene() {
            const chips = document.querySelectorAll('.promo-chip');
            chips.forEach((chip, i) => {
                setTimeout(() => chip.classList.add('visible'), 200 + i * 150);
            });
        }

        // --- Start the loop ---
        showScene(0);
        setTimeout(nextScene, SCENE_DURATIONS[0]);
    })();
    // =============================================
    // 11. SHOWCASE BLOCKS — 4 independent demos
    // =============================================
    (function initShowcaseBlocks() {
        var blocks = document.querySelectorAll('.showcase-block');
        if (!blocks.length) return;

        var IFRAME_W = 1400;
        var IFRAME_H = 900;


        blocks.forEach(function (block) {
            var iframe = block.querySelector('.showcase-iframe');
            var cursor = block.querySelector('.showcase-cursor');
            var ripple = block.querySelector('.showcase-cursor-ripple');
            var viewport = block.querySelector('.showcase-viewport');
            var sections = (block.dataset.sections || '').split(',');

            if (!iframe || !cursor || !viewport || !sections.length) return;

            var state = {
                active: false,
                ready: false,
                currentSection: 0,
                scrollPos: 0,
                timeout: null,
                scrollAnim: null
            };

            function updateScale() {
                var scale = viewport.offsetWidth / IFRAME_W;
                iframe.style.transform = 'scale(' + scale + ')';
                iframe.style.width = IFRAME_W + 'px';
                // Set iframe height to exactly fill the viewport — no clipping
                var viewportH = viewport.clientHeight;
                iframe.style.height = Math.round(viewportH / scale) + 'px';
            }

            // scrollbar removed

            // ---- Load iframe lazily ----
            function loadIframe() {
                if (iframe.src && iframe.src !== 'about:blank') return;
                var src = iframe.dataset.src;
                if (!src) return;
                iframe.src = src;
                iframe.addEventListener('load', function () {
                    setTimeout(function () {
                        updateScale();
                        state.ready = true;
                        // Hide non-relevant tabs and inject cursor style
                        hideIrrelevantTabs();
                        // Navigate to the first section of this block
                        navigateToSection(sections[0]);
                        if (state.active) startTour();
                    }, 500);
                });
            }

            window.addEventListener('resize', function () {
                if (state.ready) updateScale();
            });

            // ---- Hide nav-tabs not relevant to this block ----
            function hideIrrelevantTabs() {
                try {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var css = '';
                    var allSections = ['summary', 'context', 'competitors', 'brand-dna', 'strategy-1', 'strategy-2', 'strategy-3', 'media-plan', 'sources', 'jam-studio'];
                    // Remove tabs not in our sections list from DOM entirely
                    allSections.forEach(function (s) {
                        if (sections.indexOf(s) === -1) {
                            var tab = doc.querySelector('.nav-tab[data-section="' + s + '"]');
                            if (tab) tab.remove();
                            css += '.nav-tab[data-section="' + s + '"] { display: none !important; } ';
                        }
                    });
                    // Hide export button and set cursor
                    css += '.export-pdf-trigger-modern, .export-btn, .export-button, [class*="export"] { display: none !important; } ';
                    css += '* { cursor: default !important; } ';
                    // Style iframe scrollbar — orange to match project design
                    css += 'html { scrollbar-width: thin; scrollbar-color: rgba(255,104,0,0.45) rgba(0,0,0,0.15); padding-right: 2px; } ';
                    css += '::-webkit-scrollbar { width: 8px; } ';
                    css += '::-webkit-scrollbar-track { background: rgba(0,0,0,0.15); border-radius: 4px; margin: 4px 0; } ';
                    css += '::-webkit-scrollbar-thumb { background: rgba(255,104,0,0.45); border-radius: 4px; } ';
                    css += '::-webkit-scrollbar-thumb:hover { background: rgba(255,104,0,0.7); } ';
                    var style = doc.createElement('style');
                    style.textContent = css;
                    doc.head.appendChild(style);
                } catch (e) { /* cross-origin */ }
            }

            // ---- Navigate to section ----
            function navigateToSection(sectionId) {
                try {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    // Click the nav-tab
                    var tabs = doc.querySelectorAll('.nav-tab[data-section]');
                    tabs.forEach(function (t) {
                        if (t.dataset.section === sectionId) t.click();
                    });
                } catch (e) { }
            }

            // ---- Cursor helpers ----
            function moveCursor(xPct, yPct, dur) {
                cursor.style.transition = 'left ' + (dur || 1.2) + 's cubic-bezier(0.23,1,0.32,1), top ' + (dur || 1.2) + 's cubic-bezier(0.23,1,0.32,1)';
                cursor.style.left = xPct + '%';
                cursor.style.top = yPct + '%';
            }

            function doClick() {
                ripple.classList.remove('click');
                void ripple.offsetWidth;
                ripple.classList.add('click');
            }

            // ---- Smooth scroll ----
            function smoothScroll(targetY, duration, cb) {
                try {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var el = doc.documentElement;
                    var startY = el.scrollTop;
                    var diff = targetY - startY;
                    if (Math.abs(diff) < 5) { if (cb) cb(); return; }
                    var startTime = null;
                    if (state.scrollAnim) cancelAnimationFrame(state.scrollAnim);

                    function step(ts) {
                        if (!startTime) startTime = ts;
                        var p = Math.min((ts - startTime) / duration, 1);
                        var eased = 1 - Math.pow(1 - p, 3);
                        el.scrollTop = startY + diff * eased;
                        if (p < 1) {
                            state.scrollAnim = requestAnimationFrame(step);
                        } else {
                            state.scrollAnim = null;
                            if (cb) cb();
                        }
                    }
                    state.scrollAnim = requestAnimationFrame(step);
                } catch (e) { if (cb) cb(); }
            }

            function getSectionTop(sId) {
                try {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var sec = doc.getElementById(sId);
                    return sec ? sec.offsetTop - 60 : 0;
                } catch (e) { return 0; }
            }

            function getSectionH(sId) {
                try {
                    var doc = iframe.contentDocument || iframe.contentWindow.document;
                    var sec = doc.getElementById(sId);
                    return sec ? sec.offsetHeight : 500;
                } catch (e) { return 500; }
            }


            // ---- Tour: smooth scroll through sections, cursor follows ----
            function startTour() {
                if (!state.active || !state.ready) return;
                state.currentSection = 0;
                // Small delay before starting
                state.timeout = setTimeout(function () {
                    tourSection();
                }, 1000);
            }

            function tourSection() {
                if (!state.active || !state.ready) return;
                var sId = sections[state.currentSection];

                // Navigate tab (for multi-section blocks like strategies)
                navigateToSection(sId);

                var scrollTarget = getSectionTop(sId);
                var sectionH = getSectionH(sId);

                // Move cursor to upper content area
                moveCursor(25 + Math.random() * 40, 20 + Math.random() * 15, 1.2);

                state.timeout = setTimeout(function () {
                    if (!state.active) return;
                    doClick();

                    // Scroll through the ENTIRE section content
                    var scrollAmount = sectionH;
                    var scrollDur = Math.max(scrollAmount * 4, 3000);

                    // Move cursor slowly downward as content scrolls
                    moveCursor(20 + Math.random() * 45, 55 + Math.random() * 20, scrollDur / 1000);

                    smoothScroll(scrollTarget + scrollAmount, scrollDur, function () {
                        if (!state.active) return;

                        // Pause, click somewhere interesting
                        state.timeout = setTimeout(function () {
                            if (!state.active) return;
                            doClick();
                            moveCursor(30 + Math.random() * 30, 35 + Math.random() * 20, 1.5);

                            state.timeout = setTimeout(function () {
                                if (!state.active) return;

                                // Next section or loop
                                state.currentSection = (state.currentSection + 1) % sections.length;

                                // If looping back to first section, scroll back up first
                                if (state.currentSection === 0) {
                                    smoothScroll(getSectionTop(sections[0]), 2000, function () {
                                        state.timeout = setTimeout(function () {
                                            tourSection();
                                        }, 800);
                                    });
                                } else {
                                    tourSection();
                                }
                            }, 1500);
                        }, 1000);
                    });
                }, 1200);
            }

            function stopTour() {
                if (state.timeout) { clearTimeout(state.timeout); state.timeout = null; }
                if (state.scrollAnim) { cancelAnimationFrame(state.scrollAnim); state.scrollAnim = null; }
            }

            // ---- Click-to-interact (single click) ----
            var interacting = false;
            viewport.addEventListener('click', function () {
                if (!interacting) {
                    interacting = true;
                    viewport.classList.add('interacting');
                    stopTour();
                    // Wait for pointer-events:auto to apply, then focus iframe content
                    setTimeout(function () {
                        try { iframe.contentWindow.focus(); } catch (e) { iframe.focus(); }
                    }, 0);
                }
            });

            // Click outside block to exit interaction
            document.addEventListener('click', function (e) {
                if (interacting && !block.contains(e.target)) {
                    interacting = false;
                    viewport.classList.remove('interacting');
                    if (state.active && state.ready) {
                        state.timeout = setTimeout(function () { tourSection(); }, 600);
                    }
                }
            });

            // ---- IntersectionObserver ----
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting && !state.active) {
                        state.active = true;
                        cursor.style.opacity = '1';
                        loadIframe();
                    } else if (!entry.isIntersecting && state.active) {
                        state.active = false;
                        stopTour();
                        cursor.style.opacity = '0';
                    }
                });
            }, { threshold: 0.15 });
            obs.observe(block);

            cursor.style.opacity = '0';
        });
    })();

    // Fullscreen toggle — global
    window.openPlatformFullscreen = function () {
        const overlay = document.getElementById('platformFullscreen');
        const fsIframe = document.getElementById('platformFullscreenIframe');
        if (overlay && fsIframe) {
            fsIframe.src = 'CRJ_31_-OTChET_v3 (1).html';
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closePlatformFullscreen = function () {
        const overlay = document.getElementById('platformFullscreen');
        const fsIframe = document.getElementById('platformFullscreenIframe');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            if (fsIframe) fsIframe.src = '';
        }
    };

    // Close fullscreen on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('platformFullscreen');
            if (overlay && overlay.classList.contains('active')) {
                window.closePlatformFullscreen();
            }
        }
    });

})();


