/**
 * Creative Jam — Cookie Consent Manager
 * Manages cookie consent banner, settings modal, and conditional script loading.
 */
(function () {
    'use strict';

    const COOKIE_NAME = 'cj_cookie_consent';
    const COOKIE_DAYS = 365;

    // ── Helpers ──────────────────────────────────────────────
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) +
            ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) {
            try { return JSON.parse(decodeURIComponent(match[2])); } catch (e) { return null; }
        }
        return null;
    }

    // ── Default consent state ────────────────────────────────
    function getDefaults() {
        return { necessary: true, analytics: false, marketing: false };
    }

    // ── Load scripts conditionally ───────────────────────────
    function loadConditionalScripts(consent) {
        // --- Analytics (Yandex.Metrika / Google Analytics) ---
        if (consent.analytics) {
            // ⬇ YANDEX METRIKA — replace XXXXXXXX with your counter ID
            /*
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
            ym(XXXXXXXX, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
            */

            // ⬇ GOOGLE ANALYTICS — replace G-XXXXXXXXXX with your measurement ID
            /*
            var gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
            document.head.appendChild(gtagScript);
            gtagScript.onload = function() {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-XXXXXXXXXX');
            };
            */
            console.log('[CookieConsent] Analytics scripts enabled');
        }

        // --- Marketing (Facebook Pixel, VK Pixel, etc.) ---
        if (consent.marketing) {
            // ⬇ FACEBOOK PIXEL — replace XXXXXXXXXXXXXXXX with your pixel ID
            /*
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'XXXXXXXXXXXXXXXX');
            fbq('track', 'PageView');
            */

            // ⬇ VK PIXEL — replace XXXXXXX with your pixel ID
            /*
            !function(){var t=document.createElement("script");
            t.type="text/javascript",t.async=!0,t.src="https://vk.com/js/api/openapi.js?169",
            t.onload=function(){VK.Retargeting.Init("XXXXXXX"),VK.Retargeting.Hit()},
            document.head.appendChild(t)}();
            */
            console.log('[CookieConsent] Marketing scripts enabled');
        }
    }

    // ── Build Banner HTML ────────────────────────────────────
    function createBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.id = 'cookieBanner';
        banner.innerHTML =
            '<div class="cookie-banner-inner">' +
            '<div class="cookie-banner-text">' +
            '<p>Мы используем cookies для улучшения работы сайта. ' +
            'Подробнее — в <a href="#">Политике конфиденциальности</a>.</p>' +
            '</div>' +
            '<div class="cookie-banner-actions">' +
            '<button class="cookie-btn cookie-btn-settings" id="cookieOpenSettings">Настроить</button>' +
            '<button class="cookie-btn cookie-btn-reject" id="cookieReject">Отклонить</button>' +
            '<button class="cookie-btn cookie-btn-accept" id="cookieAcceptAll">Принять все</button>' +
            '</div>' +
            '</div>';
        document.body.appendChild(banner);
        return banner;
    }

    // ── Build Modal HTML ─────────────────────────────────────
    function createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'cookie-modal-overlay';
        overlay.id = 'cookieModalOverlay';
        overlay.innerHTML =
            '<div class="cookie-modal">' +
            '<div class="cookie-modal-header">' +
            '<h3 class="cookie-modal-title">Настройки cookie</h3>' +
            '<button class="cookie-modal-close" id="cookieModalClose">✕</button>' +
            '</div>' +
            '<p class="cookie-modal-desc">Выберите, какие категории cookies вы хотите разрешить. ' +
            'Необходимые cookies нельзя отключить — они обеспечивают базовую работу сайта.</p>' +

            // Necessary
            '<div class="cookie-category">' +
            '<div class="cookie-category-header">' +
            '<div class="cookie-category-info">' +
            '<div class="cookie-category-name">🔒 Необходимые</div>' +
            '<div class="cookie-category-desc">Обеспечивают работу сайта: навигация, безопасность, сохранение настроек.</div>' +
            '</div>' +
            '<span class="cookie-category-always">Всегда вкл.</span>' +
            '</div>' +
            '</div>' +

            // Analytics
            '<div class="cookie-category">' +
            '<div class="cookie-category-header">' +
            '<div class="cookie-category-info">' +
            '<div class="cookie-category-name">📊 Аналитические</div>' +
            '<div class="cookie-category-desc">Помогают понять, как пользователи взаимодействуют с сайтом (Яндекс.Метрика, Google Analytics).</div>' +
            '</div>' +
            '<label class="cookie-toggle">' +
            '<input type="checkbox" id="cookieAnalytics">' +
            '<span class="cookie-toggle-track"></span>' +
            '</label>' +
            '</div>' +
            '</div>' +

            // Marketing
            '<div class="cookie-category">' +
            '<div class="cookie-category-header">' +
            '<div class="cookie-category-info">' +
            '<div class="cookie-category-name">📣 Маркетинговые</div>' +
            '<div class="cookie-category-desc">Используются для показа персонализированной рекламы (Facebook Pixel, VK Pixel).</div>' +
            '</div>' +
            '<label class="cookie-toggle">' +
            '<input type="checkbox" id="cookieMarketing">' +
            '<span class="cookie-toggle-track"></span>' +
            '</label>' +
            '</div>' +
            '</div>' +

            '<div class="cookie-modal-footer">' +
            '<button class="cookie-btn cookie-btn-reject" id="cookieSaveSelected">Сохранить выбор</button>' +
            '<button class="cookie-btn cookie-btn-accept" id="cookieAcceptAllModal">Принять все</button>' +
            '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    // ── Init ─────────────────────────────────────────────────
    function init() {
        const existing = getCookie(COOKIE_NAME);

        // If consent already given, load scripts and exit
        if (existing) {
            loadConditionalScripts(existing);
            return;
        }

        // Build UI
        const banner = createBanner();
        const modalOverlay = createModal();

        // Show banner after short delay
        setTimeout(function () { banner.classList.add('visible'); }, 800);

        // ── Banner buttons ───
        document.getElementById('cookieAcceptAll').addEventListener('click', function () {
            var consent = { necessary: true, analytics: true, marketing: true };
            setCookie(COOKIE_NAME, consent, COOKIE_DAYS);
            banner.classList.remove('visible');
            loadConditionalScripts(consent);
        });

        document.getElementById('cookieReject').addEventListener('click', function () {
            var consent = getDefaults();
            setCookie(COOKIE_NAME, consent, COOKIE_DAYS);
            banner.classList.remove('visible');
        });

        document.getElementById('cookieOpenSettings').addEventListener('click', function () {
            modalOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });

        // ── Modal buttons ───
        document.getElementById('cookieModalClose').addEventListener('click', function () {
            modalOverlay.classList.remove('visible');
            document.body.style.overflow = '';
        });

        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('visible');
                document.body.style.overflow = '';
            }
        });

        document.getElementById('cookieAcceptAllModal').addEventListener('click', function () {
            var consent = { necessary: true, analytics: true, marketing: true };
            setCookie(COOKIE_NAME, consent, COOKIE_DAYS);
            banner.classList.remove('visible');
            modalOverlay.classList.remove('visible');
            document.body.style.overflow = '';
            loadConditionalScripts(consent);
        });

        document.getElementById('cookieSaveSelected').addEventListener('click', function () {
            var consent = {
                necessary: true,
                analytics: document.getElementById('cookieAnalytics').checked,
                marketing: document.getElementById('cookieMarketing').checked
            };
            setCookie(COOKIE_NAME, consent, COOKIE_DAYS);
            banner.classList.remove('visible');
            modalOverlay.classList.remove('visible');
            document.body.style.overflow = '';
            loadConditionalScripts(consent);
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
