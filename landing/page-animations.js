/**
 * Creative Jam — Page Animations (Subpages)
 * GSAP ScrollTrigger animations for features, pricing, company, cases pages.
 * Automatically detects page elements and applies relevant animations.
 */
(function () {
    'use strict';

    // Bail if GSAP not loaded
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Respect reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ══════════════════════════════════════════════════════════
    //  UNIVERSAL ANIMATIONS (all subpages)
    //  NOTE: Hero, section-title, and CTA fade-ins are now
    //  handled by inline scripts in each HTML page to avoid
    //  CDN dependency issues. Only non-conflicting GSAP
    //  animations remain here.
    // ══════════════════════════════════════════════════════════

    // ─── CTA big text parallax ───
    var ctaBigText = document.querySelector('.cta-big-text');
    if (ctaBigText) {
        gsap.to(ctaBigText, {
            yPercent: -15, ease: 'none',
            scrollTrigger: {
                trigger: '.final-cta-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5
            }
        });
    }

    // ══════════════════════════════════════════════════════════
    //  FEATURES PAGE
    // ══════════════════════════════════════════════════════════

    // ─── Feature blocks — alternate slide-in ───
    gsap.utils.toArray('.feat-section').forEach(function (section, i) {
        var block = section.querySelector('.feat-block');
        if (!block) return;

        var isReversed = block.classList.contains('feat-block--reverse');
        var xDir = isReversed ? -60 : 60;

        // Chip + heading
        var chip = section.querySelector('.feat-chip');
        var heading = section.querySelector('.feat-heading');
        var desc = section.querySelector('.feat-desc');

        if (chip) {
            gsap.from(chip, {
                x: xDir * 0.5, opacity: 0, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: section, start: 'top 75%' }
            });
        }
        if (heading) {
            gsap.from(heading, {
                x: xDir, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.1,
                scrollTrigger: { trigger: section, start: 'top 75%' }
            });
        }
        if (desc) {
            gsap.from(desc, {
                y: 20, opacity: 0, duration: 0.7, ease: 'power2.out', delay: 0.25,
                scrollTrigger: { trigger: section, start: 'top 75%' }
            });
        }

        // Checklist items — stagger
        var checkItems = section.querySelectorAll('.feat-points li');
        if (checkItems.length) {
            gsap.from(checkItems, {
                x: xDir * 0.3, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.35,
                scrollTrigger: { trigger: section, start: 'top 70%' }
            });
        }

        // CTA button
        var btn = section.querySelector('.btn');
        if (btn) {
            gsap.from(btn, {
                y: 15, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.6,
                scrollTrigger: { trigger: section, start: 'top 70%' }
            });
        }
    });

    // ─── Comparison table rows ───
    gsap.utils.toArray('.pricing-compare-table tbody tr').forEach(function (row, i) {
        gsap.from(row, {
            y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', delay: i * 0.08,
            scrollTrigger: { trigger: row, start: 'top 90%' }
        });
    });


    // ══════════════════════════════════════════════════════════
    //  PRICING PAGE
    // ══════════════════════════════════════════════════════════

    // ─── Pricing cards — fast entrance ───
    var pricingCards = document.querySelectorAll('.pricing-v3-card');
    if (pricingCards.length) {
        var pricingToggle = document.querySelector('.pricing-toggle');
        var trustStrip = document.querySelector('.pricing-v3-trust');
        var pricingGrid = pricingCards[0].parentElement;

        // Cards: fast stagger
        gsap.from(pricingCards, {
            y: 40, opacity: 0,
            duration: 0.5, stagger: 0.1, ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: pricingGrid, start: 'top 80%' }
        });

        // Toggle: appears with cards
        if (pricingToggle) {
            gsap.from(pricingToggle, {
                y: 15, opacity: 0, duration: 0.4, ease: 'power2.out',
                scrollTrigger: { trigger: pricingGrid, start: 'top 80%' }
            });
        }

        // Trust strip: appears right after cards
        if (trustStrip) {
            gsap.from(trustStrip, {
                y: 15, opacity: 0, duration: 0.4, delay: 0.3, ease: 'power2.out',
                scrollTrigger: { trigger: pricingGrid, start: 'top 80%' }
            });
        }
    }

    // ─── FAQ items stagger ───
    var faqItems = document.querySelectorAll('.faq-v3-item');
    if (faqItems.length) {
        gsap.from(faqItems, {
            y: 25, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
            scrollTrigger: {
                trigger: faqItems[0].parentElement,
                start: 'top 75%'
            }
        });
    }


    // ══════════════════════════════════════════════════════════
    //  COMPANY PAGE
    // ══════════════════════════════════════════════════════════

    // ─── Stats counter animation ───
    gsap.utils.toArray('.company-stat-num').forEach(function (el) {
        var text = el.textContent.trim();
        var match = text.match(/[\d]+/);
        if (!match) return;
        var num = parseInt(match[0], 10);
        if (!num) return;

        var idx = text.indexOf(match[0]);
        var prefix = text.substring(0, idx);
        var suffix = text.substring(idx + match[0].length);

        var obj = { val: 0 };
        gsap.to(obj, {
            val: num,
            duration: 2,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
            onUpdate: function () {
                el.textContent = prefix + Math.round(obj.val) + suffix;
            }
        });
    });

    // ─── Stats row — fade-in ───
    var stats = document.querySelectorAll('.company-stat');
    if (stats.length) {
        gsap.from(stats, {
            y: 30, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out',
            scrollTrigger: { trigger: stats[0].parentElement, start: 'top 80%' }
        });
    }

    // ─── Values grid — stagger cards ───
    var valueCards = document.querySelectorAll('.company-value-card');
    if (valueCards.length) {
        gsap.from(valueCards, {
            y: 40, opacity: 0, scale: 0.95, duration: 0.6, stagger: 0.1, ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
                trigger: valueCards[0].parentElement,
                start: 'top 75%'
            }
        });
    }

    // ─── Timeline items — sequential reveal ───
    var timelineItems = document.querySelectorAll('.company-timeline-item');
    if (timelineItems.length) {
        timelineItems.forEach(function (item, i) {
            var dot = item.querySelector('.company-timeline-dot');
            var year = item.querySelector('.company-timeline-year');
            var text = item.querySelector('.company-timeline-text');

            if (dot) {
                gsap.from(dot, {
                    scale: 0, duration: 0.4, ease: 'back.out(2)', delay: i * 0.2,
                    scrollTrigger: { trigger: item, start: 'top 80%' }
                });
            }
            if (year) {
                gsap.from(year, {
                    x: -30, opacity: 0, duration: 0.5, ease: 'power2.out', delay: i * 0.2 + 0.1,
                    scrollTrigger: { trigger: item, start: 'top 80%' }
                });
            }
            if (text) {
                gsap.from(text, {
                    x: 30, opacity: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.2 + 0.15,
                    scrollTrigger: { trigger: item, start: 'top 80%' }
                });
            }
        });
    }

    // ─── Vision paragraph ───
    var visionP = document.querySelector('.section p[style*="muted-foreground"]');
    if (visionP) {
        gsap.from(visionP, {
            y: 25, opacity: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: visionP, start: 'top 85%' }
        });
    }


    // ══════════════════════════════════════════════════════════
    //  CASES PAGE
    // ══════════════════════════════════════════════════════════

    // ─── Case cards — fast appear ───
    var caseCards = document.querySelectorAll('.case-detail-card');
    if (caseCards.length) {
        gsap.from(caseCards, {
            y: 30, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
                trigger: caseCards[0].parentElement,
                start: 'top 100%'
            }
        });
    }

    // Filter pills: no animation — always visible as navigation elements

    // ─── Case metrics counter ───
    gsap.utils.toArray('.case-detail-metric-val').forEach(function (el) {
        var text = el.textContent.trim();
        var match = text.match(/[\d]+/);
        if (!match) return;
        var num = parseInt(match[0], 10);
        if (!num) return;

        var idx = text.indexOf(match[0]);
        var prefix = text.substring(0, idx);
        var suffix = text.substring(idx + match[0].length);

        var obj = { val: 0 };
        gsap.to(obj, {
            val: num,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
            onUpdate: function () {
                el.textContent = prefix + Math.round(obj.val) + suffix;
            }
        });
    });

    // ─── Case quotes — fade-in ───
    gsap.utils.toArray('.case-detail-quote').forEach(function (quote) {
        gsap.from(quote, {
            y: 15, opacity: 0, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: quote, start: 'top 90%' }
        });
    });

})();
