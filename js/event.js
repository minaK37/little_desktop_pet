let idleTimer = null;
let isDragging = false;

const { MIN_WAIT, MAX_WAIT, DEFAULT_IMG, DRAG_IMG, idleImages } = window.appConfig;
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
function startIdleCycle() {
    clearTimeout(idleTimer);
    const wait = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);

    idleTimer = setTimeout(() => {
        if (!isDragging) {
            const pickedImage = pickRandomImage();
            if(pickedImage == 'error'){
                startIdleCycle();
            }
            mascot.src = pickedImage.src;
            const uptimeMs = pickedImage.uptime;

            setTimeout(() => {
                if (!isDragging) {
                    mascot.src = DEFAULT_IMG;
                    startIdleCycle();
                }
            }, uptimeMs);
        }
    }, wait);
}

