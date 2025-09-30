let idleTimer = null;
let isDragging = false;

const { MIN_WAIT, MAX_WAIT, DEFAULT_IMG, DRAG_IMG, idleImages, hourlyImages } = window.appConfig;
document.addEventListener("DOMContentLoaded", () => {
    mascot.src = DEFAULT_IMG;
});

setupEvents();
startIdleCycle();

function setupEvents() {
    const menu_button = document.getElementById('menu_button');
    const menu = document.getElementById('menu');
    const mascot = document.getElementById('mascot');
    const app_colse = document.getElementById('app_colse');

    // メニュー
    menu_button.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.electronAPI) {
            window.electronAPI.showContextMenu();
        } else {
            console.error("electronAPI が存在しません");
        }
    });
    // ×ボタン
    app_colse.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.electronAPI) {
            window.electronAPI.closeApp();
        } else {
            console.error("electronAPI が存在しません");
        }
    });


    // ドラッグイベント    
    let offset = { x: 0, y: 0 };
    let dragWidth = 0;
    let dragHeight = 0;

    mascot.addEventListener('mousedown', async (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        clearTimeout(idleTimer);
        mascot.src = DRAG_IMG;

        const bounds = await window.electronAPI.getWindowBounds();
        offset = { x: e.screenX - bounds.x, y: e.screenY - bounds.y };

        dragWidth = bounds.width;
        dragHeight = bounds.height;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = Math.round(e.screenX - offset.x);
        const y = Math.round(e.screenY - offset.y);
        window.electronAPI.moveWindow({ x, y, width: dragWidth, height: dragHeight });
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        mascot.src = DEFAULT_IMG;
        menu.classList.remove("hovered");
        startIdleCycle();
    });

};

function pickRandomImage() {
    const totalWeight = idleImages.reduce((sum, img) => sum + img.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const img of idleImages) {
        if (rand < img.weight) {
            return img;
        }
        rand -= img.weight;
    }
    return 'error';
}
function startIdleCycle(skipWait = false) {
    clearTimeout(idleTimer);

    const wait = skipWait ? 0 : MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);

    idleTimer = setTimeout(() => {
        if (!isDragging) {
            const pickedImage = pickRandomImage();
            if (pickedImage == 'error' || pickedImage.default_continue) {
                startIdleCycle();
                return;
            }

            let uptimeMs = pickedImage.uptime_range
                ? pickedImage.uptime + wait
                : pickedImage.uptime;

            if (pickedImage.move) {
                if (pickedImage.move == "horizontal") {
                    if (Math.random() < 0.5) {
                        mascot.style.transform = "rotateY(180deg)";
                        window.electronAPI.walkRight(uptimeMs, pickedImage.move);
                    } else {
                        mascot.style.transform = "rotateY(0deg)";
                        window.electronAPI.walkLeft(uptimeMs, pickedImage.move);
                    }
                } else if (pickedImage.move == "vertical") {
                    mascot.style.transform = "rotateY(0deg)";
                    if (Math.random() < 0.5) {
                        window.electronAPI.walkUp(uptimeMs, pickedImage.move);
                    } else {
                        window.electronAPI.walkDown(uptimeMs, pickedImage.move);
                    }
                }
            }

            mascot.src = pickedImage.src;

            setTimeout(() => {
                if (!isDragging) {
                    window.electronAPI.stopWalking();

                    if (pickedImage.move && Math.random() < 0.1) {
                        startIdleCycle(true);
                    } else {
                        mascot.src = DEFAULT_IMG;
                        startIdleCycle();
                    }
                }
            }, uptimeMs);
        }
    }, wait);
}

setInterval(() => {
    const now = new Date();
    if (now.getMinutes() === 0) {
        // if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        checkHourlyEvent();
    }
}, 60000);
// }, 1000);

function checkHourlyEvent() {
    const now = new Date();
    const h = now.getHours().toString();

    const configEntry = hourlyImages[h] || hourlyImages["default"];
    if (!configEntry) return;

    clearTimeout(idleTimer);

    mascot.src = configEntry.src;

    const uptimeMs = configEntry.uptime || 3000;

    setTimeout(() => {
        mascot.src = DEFAULT_IMG;
        startIdleCycle();
    }, uptimeMs);
}

