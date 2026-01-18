// background.js
console.log(">>> [System] Steam账户管理 V4.1 后台就绪");

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    handle(msg).then(sendResponse).catch(err => sendResponse({success:false, error:err.toString()}));
    return true; 
});

async function handle(msg) {
    switch(msg.type) {
        case "SYNC_ACCOUNTS": return await syncAccounts();
        case "CREATE_ACCOUNT": return await createAcc(msg.name);
        case "OPEN_ACCOUNT": openTab(msg.containerId); return {success:true};
        case "DELETE_ACCOUNT": return await deleteAcc(msg.id);
        case "UPDATE_FULL_INFO": return await updateFullInfo(msg.id, msg.name, msg.color, msg.tags, msg.note);
        
        // 新增：处理排序保存
        case "REORDER_ACCOUNTS": return await saveOrder(msg.accounts);
            
        default: return {success:false};
    }
}

// 直接覆盖保存新的账号列表顺序
async function saveOrder(newAccounts) {
    await browser.storage.local.set({ accounts: newAccounts });
    return { success: true };
}

async function createAcc(name) {
    const colors = ["blue", "turquoise", "green", "yellow", "orange", "red", "pink", "purple"];
    const color = colors[Math.floor(Math.random()*colors.length)];
    
    const container = await browser.contextualIdentities.create({ name: name, color: color, icon: "fingerprint" });
    
    const store = await browser.storage.local.get('accounts');
    const list = store.accounts || [];
    list.push({ id: container.cookieStoreId, name, color, tags:[], note:"" });
    
    await browser.storage.local.set({ accounts: list });
    browser.tabs.create({ url: "https://store.steampowered.com/login/", cookieStoreId: container.cookieStoreId });
    return {success:true};
}

async function updateFullInfo(id, name, color, tags, note) {
    try {
        await browser.contextualIdentities.update(id, { name: name, color: color });
    } catch(e) { console.error("容器更新失败", e); }

    const store = await browser.storage.local.get('accounts');
    const list = store.accounts || [];
    const target = list.find(a => a.id === id);
    if (target) {
        target.name = name; target.color = color; target.tags = tags; target.note = note;
        await browser.storage.local.set({ accounts: list });
    }
    return { success: true };
}

async function deleteAcc(id) {
    try { await browser.contextualIdentities.remove(id); } catch(e){}
    const store = await browser.storage.local.get('accounts');
    const list = (store.accounts||[]).filter(a => a.id !== id);
    await browser.storage.local.set({ accounts: list });
    return {success:true};
}

async function syncAccounts() {
    const store = await browser.storage.local.get('accounts');
    const list = store.accounts || [];
    const containers = await browser.contextualIdentities.query({});
    const realIds = new Set(containers.map(c=>c.cookieStoreId));
    
    const valid = list.filter(a => realIds.has(a.id));
    valid.forEach(a => {
        const c = containers.find(x => x.cookieStoreId === a.id);
        if(c && c.color !== a.color) a.color = c.color; 
    });
    
    if (valid.length !== list.length) {
        await browser.storage.local.set({ accounts: valid });
    }
    return { success: true, accounts: valid };
}

function openTab(id) {
    browser.tabs.create({ url: "https://store.steampowered.com/", cookieStoreId: id });
}