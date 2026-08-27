/**
 * TOP PROGRESS BAR — YouTube-style navigation indicator
 * Usage:
 *   TopProgress.start()   — begin animation
 *   TopProgress.done()    — complete & hide
 *   TopProgress.set(0-100) — set specific percentage
 */
const TopProgress = (() => {
    let bar = null;
    let trickleTimer = null;
    let currentWidth = 0;

    function getBar() {
        if (!bar) bar = document.getElementById('topProgress');
        return bar;
    }

    function start() {
        const el = getBar();
        if (!el) return;

        // Reset
        stop();
        currentWidth = 0;
        el.classList.remove('done');
        el.style.width = '0%';

        // Force reflow
        void el.offsetWidth;

        el.classList.add('active');

        // Trickle: advance slowly to give a sense of progress
        trickleTimer = setInterval(() => {
            if (currentWidth < 30) {
                currentWidth += 3;
            } else if (currentWidth < 60) {
                currentWidth += 2;
            } else if (currentWidth < 85) {
                currentWidth += 0.5;
            } else if (currentWidth < 95) {
                currentWidth += 0.1;
            }
            el.style.width = currentWidth + '%';
        }, 200);
    }

    function done() {
        const el = getBar();
        if (!el) return;

        stop();
        el.style.width = '100%';
        el.classList.add('done');

        setTimeout(() => {
            el.classList.remove('active', 'done');
            el.style.width = '0%';
            currentWidth = 0;
        }, 700);
    }

    function set(percent) {
        const el = getBar();
        if (!el) return;

        currentWidth = Math.min(percent, 100);
        el.classList.add('active');
        el.classList.remove('done');
        el.style.width = currentWidth + '%';
    }

    function stop() {
        if (trickleTimer) {
            clearInterval(trickleTimer);
            trickleTimer = null;
        }
    }

    return { start, done, set, stop };
})();
