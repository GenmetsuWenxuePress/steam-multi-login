// popup.js

const COLOR_MAP = {
    "blue": "#37adff", "turquoise": "#00c79a", "green": "#51cd00", 
    "yellow": "#ffcb00", "orange": "#ff9f00", "red": "#ff613d", 
    "pink": "#ff4bda", "purple": "#af51f5", "toolbar": "#666"
};
const CONTAINER_COLORS = ["blue", "turquoise", "green", "yellow", "orange", "red", "pink", "purple"];

let g_accounts = [];
let g_dragSrcIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
    await checkLock(); 
    bindEvents();
});

// --- 初始化与锁屏 ---
async function checkLock() {
    const data = await browser.storage.local.get('privacyLock');
    if (data.privacyLock) {
        document.getElementById('lock-screen').classList.remove('hidden');
        const unlockBtn = document.getElementById('btn-unlock');
        const passInput = document.getElementById('unlock-pass');
        
        const doUnlock = async () => {
            const hash = await sha256(passInput.value);
            if (hash === data.privacyLock) {
                document.getElementById('lock-screen').classList.add('hidden');
                initApp();
            } else {
                document.getElementById('lock-msg').textContent = "密码错误";
                passInput.value = "";
            }
        };
        unlockBtn.onclick = doUnlock;
        passInput.onkeypress = (e) => { if(e.key==='Enter') doUnlock(); };
    } else {
        initApp();
    }
}

async function initApp() {
    await syncAndLoad();
    updateLockSettingsUI();
}

function bindEvents() {
    document.getElementById('btn-toggle-settings').onclick = () => {
        document.getElementById('settings-panel').classList.toggle('hidden');
    };
    document.getElementById('btn-quick-add').onclick = handleQuickAdd;
    document.getElementById('quick-add-name').onkeypress = (e) => { if(e.key==='Enter') handleQuickAdd(); };

    document.getElementById('btn-enable-lock').onclick = enableLock;
    document.getElementById('btn-modify-lock').onclick = enableLock;
    document.getElementById('btn-remove-lock').onclick = removeLock;

    document.getElementById('btn-modal-cancel').onclick = () => document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('btn-modal-save').onclick = saveAccountEdits;
    document.getElementById('btn-delete-account').onclick = deleteCurrentAccount;
    
    // Tooltip 自我维护事件 (防止滚动时消失)
    const tooltipEl = document.getElementById('custom-tooltip');
    tooltipEl.addEventListener('mouseenter', () => clearTimeout(g_tooltipTimer));
    tooltipEl.addEventListener('mouseleave', () => hideTooltip());
}

// --- 列表渲染与拖拽逻辑 ---
async function syncAndLoad() {
    try {
        const res = await browser.runtime.sendMessage({ type: "SYNC_ACCOUNTS" });
        if (res.success) {
            g_accounts = res.accounts;
            renderList(res.accounts);
        }
    } catch (e) { console.error(e); }
}

function renderList(accounts) {
    const container = document.getElementById('account-list');
    container.innerHTML = '';
    
    if (accounts.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">暂无账号</div>';
        return;
    }

    accounts.forEach((acc, index) => {
        container.appendChild(createAccountItem(acc, index));
    });
}

function createAccountItem(acc, index) {
    const div = document.createElement('div');
    div.className = 'account-item';
    div.draggable = true;
    div.dataset.index = index;
    
    const initial = acc.name.charAt(0).toUpperCase();
    const colorHex = COLOR_MAP[acc.color] || acc.color;

    const tagsHtml = (acc.tags || []).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
    
    // 备注预览
    const noteHtml = acc.note ? `<div class="note-preview" data-note="${escapeHtml(acc.note)}">📝 ${escapeHtml(acc.note)}</div>` : '';

    div.innerHTML = `
        <div class="avatar-box" style="color: ${colorHex}">
            ${initial}
        </div>
        <div class="account-info">
            <div class="account-name">${escapeHtml(acc.name)}</div>
            <div class="item-meta">${tagsHtml}</div>
            ${noteHtml}
        </div>
        <button class="btn-edit" title="编辑">✎</button>
    `;

    div.onclick = () => launch(acc.id);
    div.querySelector('.btn-edit').onclick = (e) => { e.stopPropagation(); openEdit(acc); };

    // 拖拽
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);

    // Tooltip 事件绑定 (使用延迟关闭逻辑)
    const noteEl = div.querySelector('.note-preview');
    if (noteEl) {
        noteEl.onmouseenter = (e) => showTooltip(e, acc.note);
        noteEl.onmouseleave = scheduleHideTooltip;
    }

    return div;
}

// --- 拖拽核心逻辑 ---
function handleDragStart(e) {
    g_dragSrcIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}
async function handleDrop(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');
    const dragDestIndex = parseInt(this.dataset.index);
    if (g_dragSrcIndex === dragDestIndex) return;

    const movedItem = g_accounts[g_dragSrcIndex];
    g_accounts.splice(g_dragSrcIndex, 1);
    g_accounts.splice(dragDestIndex, 0, movedItem);

    renderList(g_accounts);
    await browser.runtime.sendMessage({ type: "REORDER_ACCOUNTS", accounts: g_accounts });
}
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.account-item').forEach(el => el.classList.remove('drag-over'));
}

// --- 自定义 UI 组件 ---

// 1. Tooltip (带滚动条和延迟关闭)
let g_tooltipTimer;
const tooltipEl = document.getElementById('custom-tooltip');

function showTooltip(e, text) {
    clearTimeout(g_tooltipTimer); // 清除可能存在的关闭操作
    tooltipEl.textContent = text;
    tooltipEl.classList.remove('hidden');
    
    const rect = e.target.getBoundingClientRect();
    let top = rect.bottom + 5;
    let left = rect.left;
    if (left + 250 > window.innerWidth) left = window.innerWidth - 260; // 边界检查
    
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';
}

function scheduleHideTooltip() {
    // 延迟 200ms 关闭，给用户时间移动鼠标进入 Tooltip
    g_tooltipTimer = setTimeout(() => {
        tooltipEl.classList.add('hidden');
    }, 200);
}

function hideTooltip() {
    tooltipEl.classList.add('hidden');
}

// 2. Prompt
function showCustomPrompt(title, onConfirm) {
    const promptEl = document.getElementById('custom-prompt');
    const inputEl = document.getElementById('prompt-input');
    const confirmBtn = document.getElementById('btn-prompt-confirm');
    const cancelBtn = document.getElementById('btn-prompt-cancel');
    
    document.getElementById('prompt-title').textContent = title;
    inputEl.value = '';
    promptEl.classList.remove('hidden');
    inputEl.focus();

    const cleanUp = () => {
        promptEl.classList.add('hidden');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        inputEl.onkeypress = null;
    };

    confirmBtn.onclick = () => {
        const val = inputEl.value;
        if (val) {
            onConfirm(val);
            cleanUp();
        }
    };
    cancelBtn.onclick = cleanUp;
    inputEl.onkeypress = (e) => { if (e.key === 'Enter') confirmBtn.click(); };
}

// --- 业务操作 ---
async function enableLock() {
    showCustomPrompt("请设置新的解锁密码：", async (pass) => {
        const hash = await sha256(pass);
        await browser.storage.local.set({ privacyLock: hash });
        updateLockSettingsUI();
    });
}

async function removeLock() {
    if (confirm("确定要关闭隐私锁吗？")) {
        await browser.storage.local.remove('privacyLock');
        updateLockSettingsUI();
    }
}

async function updateLockSettingsUI() {
    const data = await browser.storage.local.get('privacyLock');
    if (data.privacyLock) {
        document.getElementById('lock-ui-enabled').classList.remove('hidden');
        document.getElementById('lock-ui-disabled').classList.add('hidden');
    } else {
        document.getElementById('lock-ui-enabled').classList.add('hidden');
        document.getElementById('lock-ui-disabled').classList.remove('hidden');
    }
}

function launch(id) {
    browser.runtime.sendMessage({ type: "OPEN_ACCOUNT", containerId: id });
    window.close();
}

function openEdit(acc) {
    const modal = document.getElementById('edit-modal');
    document.getElementById('edit-id').value = acc.id;
    document.getElementById('edit-name').value = acc.name;
    document.getElementById('edit-tags').value = (acc.tags||[]).join(', ');
    document.getElementById('edit-note').value = acc.note || "";
    
    const colorDiv = document.getElementById('edit-colors');
    colorDiv.innerHTML = '';
    CONTAINER_COLORS.forEach(c => {
        const span = document.createElement('div');
        span.className = `color-option ${acc.color===c ? 'selected':''}`;
        span.style.backgroundColor = COLOR_MAP[c];
        span.onclick = () => {
            document.querySelectorAll('.color-option').forEach(el=>el.classList.remove('selected'));
            span.classList.add('selected');
            span.dataset.val = c;
        };
        if(acc.color===c) span.dataset.val = c;
        colorDiv.appendChild(span);
    });
    modal.classList.remove('hidden');
}

async function saveAccountEdits() {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const tags = document.getElementById('edit-tags').value.split(/,|，/).map(t=>t.trim()).filter(t=>t);
    const note = document.getElementById('edit-note').value;
    const selColor = document.querySelector('.color-option.selected');
    const color = selColor ? (selColor.dataset.val || "blue") : "blue";

    await browser.runtime.sendMessage({ type: "UPDATE_FULL_INFO", id, name, color, tags, note });
    document.getElementById('edit-modal').classList.add('hidden');
    await syncAndLoad();
}

async function handleQuickAdd() {
    const input = document.getElementById('quick-add-name');
    if(!input.value.trim()) return;
    await browser.runtime.sendMessage({ type: "CREATE_ACCOUNT", name: input.value.trim() });
    input.value = '';
    await syncAndLoad();
}

async function deleteCurrentAccount() {
    if(confirm("确定删除此账号？")) {
        const id = document.getElementById('edit-id').value;
        await browser.runtime.sendMessage({ type: "DELETE_ACCOUNT", id });
        document.getElementById('edit-modal').classList.add('hidden');
        await syncAndLoad();
    }
}

async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function escapeHtml(text) {
    return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}