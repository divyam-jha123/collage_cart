/************ Device & Storage helpers ************/
const DEVICE_KEY = 'campus_connect_device_id';
function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = 'dev_' + Math.random().toString(36).slice(2, 9); localStorage.setItem(DEVICE_KEY, id); }
    return id;
}
const deviceId = getDeviceId();

/************ Utility helpers ************/
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const toast = (t) => { const el = qs('#toast'); el.textContent = t; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 2200) }
const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}
const uid = () => 'id' + Math.random().toString(36).slice(2, 9);

/************ Storage keys and sample data ************/
const STORAGE_PRODUCTS = 'campus_connect_products_v2';
const STORAGE_COLLABS = 'campus_connect_collabs_v2';
const STORAGE_THEME = 'campus_connect_theme';

const sampleProducts = [
    { id: uid(), title: 'Physics Notes (Sem1)', price: '₹50', desc: 'Handwritten neat notes. 40 pages.', seller: 'Ravi', contact: '9876543210', img: 'https://image.pollinations.ai/prompt/handwritten%20physics%20notes%20on%20paper', ts: Date.now() - 1000 * 60 * 30, ownerId: deviceId },
    { id: uid(), title: 'Charger Type-C', price: '₹200', desc: 'Genuine cable, lightly used.', seller: 'Neha', contact: '9876543211', img: 'https://image.pollinations.ai/prompt/usb%20type%20c%20charger%20cable', ts: Date.now() - 1000 * 60 * 60 * 2, ownerId: 'dev_other' },
    { id: uid(), title: 'Pocket Calculator', price: '₹150', desc: 'Casio-style calculator.', seller: 'Aman', contact: '9876543212', img: 'https://image.pollinations.ai/prompt/scientific%20calculator', ts: Date.now() - 1000 * 60 * 5, ownerId: 'dev_other2' }
];
const sampleCollabs = [
    { id: uid(), title: 'Need 2 for Hackathon', cat: 'Hackathon', desc: 'Forming a team for InnovEdam. Need 1 dev and 1 designer.', contact: '9876543213', joined: 1, ts: Date.now() - 1000 * 60 * 90, ownerId: 'dev_other' },
    { id: uid(), title: 'Sunday Cricket Match', cat: 'Cricket', desc: 'Casual 7-a-side. Need 3 players, Sunday 4pm.', contact: 'sports@vedam.edu', joined: 2, ts: Date.now() - 1000 * 60 * 240, ownerId: deviceId },
    { id: uid(), title: 'Dance Team for Cultural Fest', cat: 'Dance', desc: 'Looking for 4 dancers and 1 choreographer.', contact: '9876543214', joined: 0, ts: Date.now() - 1000 * 60 * 60 * 5, ownerId: 'dev_other2' }
];

/************ Data helpers ************/
function loadData() {
    let products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || 'null');
    let collabs = JSON.parse(localStorage.getItem(STORAGE_COLLABS) || 'null');

    if (!products || !Array.isArray(products)) {
        products = sampleProducts;
        localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
    } else {
        // Patch: Add images to existing products if missing or if using old picsum seed
        let changed = false;
        products = products.map(p => {
            if (!p.img || p.img.includes('picsum.photos')) {
                // Use pollinations.ai for relevant images based on title
                const keyword = encodeURIComponent(p.title + ' product photo');
                p.img = `https://image.pollinations.ai/prompt/${keyword}`;
                changed = true;
            }
            return p;
        });
        if (changed) {
            localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
        }
    }

    if (!collabs || !Array.isArray(collabs)) {
        collabs = sampleCollabs;
        localStorage.setItem(STORAGE_COLLABS, JSON.stringify(collabs));
    }

    return { products, collabs };
}
function saveProducts(products) { localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products)) }
function saveCollabs(collabs) { localStorage.setItem(STORAGE_COLLABS, JSON.stringify(collabs)) }

/************ Renderers (show edit/delete only for owner) ************/
function renderProducts(products) {
    const grid = qs('#product-grid');
    grid.innerHTML = '';
    if (!products.length) { qs('#products-empty').style.display = 'block'; return } else qs('#products-empty').style.display = 'none';
    products.sort((a, b) => b.ts - a.ts);
    for (const p of products) {
        const card = document.createElement('article'); card.className = 'product-card'; card.setAttribute('role', 'listitem');
        const img = document.createElement('img'); img.alt = p.title; img.src = p.img || placeholderFor(p.title);
        const title = document.createElement('div'); title.className = 'product-title'; title.textContent = p.title;
        const desc = document.createElement('div'); desc.className = 'product-desc'; desc.textContent = p.desc;
        const meta = document.createElement('div'); meta.className = 'meta';
        meta.innerHTML = `<div><strong>${p.price}</strong></div><div class="small-muted">${timeAgo(p.ts)}</div>`;
        const sellerRow = document.createElement('div'); sellerRow.className = 'small-muted'; sellerRow.textContent = 'Seller: ' + p.seller;
        const actions = document.createElement('div'); actions.className = 'card-actions';
        if (p.ownerId === deviceId) {
            const editBtn = document.createElement('button'); editBtn.className = 'icon-btn'; editBtn.innerHTML = '✏️'; editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => openSellModal(p));

            const delBtn = document.createElement('button'); delBtn.className = 'icon-btn'; delBtn.innerHTML = '🗑️'; delBtn.title = 'Delete';
            delBtn.style.color = '#ef4444';
            delBtn.addEventListener('click', () => deleteProduct(p.id));

            actions.append(editBtn, delBtn);
        } else {
            const contactBtn = document.createElement('button'); contactBtn.className = 'btn btn-ghost'; contactBtn.textContent = 'Contact Seller';
            contactBtn.addEventListener('click', () => openContactModal(p));
            actions.append(contactBtn);
        }
        card.append(img, title, desc, sellerRow, meta, actions);
        grid.appendChild(card);
    }
}
function renderCollabs(collabs, filter = null) {
    const grid = qs('#collab-grid'); grid.innerHTML = '';
    let list = collabs.slice().sort((a, b) => b.ts - a.ts);
    if (filter) list = list.filter(c => (c.cat || '').toLowerCase().includes(filter.toLowerCase()));
    if (!list.length) { qs('#collabs-empty').style.display = 'block'; return } else qs('#collabs-empty').style.display = 'none';
    for (const c of list) {
        const card = document.createElement('article'); card.className = 'collab-card'; card.setAttribute('role', 'listitem');
        const head = document.createElement('div'); head.className = 'collab-meta';
        head.innerHTML = `<div style="font-weight:700">${c.title}</div><div class="small-muted">${timeAgo(c.ts)}</div>`;
        const tagwrap = document.createElement('div'); tagwrap.className = 'tags';
        if (c.cat) { const tag = document.createElement('span'); tag.className = 'chip'; tag.textContent = c.cat; tagwrap.appendChild(tag); }
        const desc = document.createElement('div'); desc.className = 'product-desc'; desc.textContent = c.desc;
        const meta = document.createElement('div'); meta.className = 'small-muted'; meta.textContent = 'Posted by: ' + (c.contact || 'Anonymous');
        const actions = document.createElement('div'); actions.className = 'card-actions';
        if (c.ownerId === deviceId) {
            const editBtn = document.createElement('button'); editBtn.className = 'icon-btn'; editBtn.innerHTML = '✏️'; editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => openCollabModal(c));

            const delBtn = document.createElement('button'); delBtn.className = 'icon-btn'; delBtn.innerHTML = '🗑️'; delBtn.title = 'Delete';
            delBtn.style.color = '#ef4444';
            delBtn.addEventListener('click', () => deleteCollab(c.id));

            actions.append(editBtn, delBtn);
        } else {
            const messageBtn = document.createElement('button'); messageBtn.className = 'btn btn-primary'; messageBtn.textContent = '💬 Message';
            messageBtn.addEventListener('click', () => openMessageModal(c));
            actions.append(messageBtn);
        }
        card.append(head, tagwrap, desc, meta, actions);
        grid.appendChild(card);
    }
}

/************ Placeholder image generator (simple base64 svg) ************/
function placeholderFor(text = 'Item') {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='300'><rect width='100%' height='100%' fill='#eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='#333'>${esc(text)}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/************ Actions ************/
let state = loadData();
renderProducts(state.products);
renderCollabs(state.collabs);

// header buttons
qs('#btn-buy').addEventListener('click', () => document.getElementById('products').scrollIntoView({ behavior: 'smooth' }));
qs('#btn-collab').addEventListener('click', () => document.getElementById('collabs').scrollIntoView({ behavior: 'smooth' }));

// open forms
qs('#open-sell').addEventListener('click', () => openSellModal());
qs('#open-collab').addEventListener('click', () => openCollabModal());

// search
qs('#product-search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = state.products.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    renderProducts(filtered);
});

/************ Modal builders ************/
const modalBack = qs('#modal-backdrop');
function openModal(html) {
    qs('#modal-content').innerHTML = html;
    modalBack.style.display = 'flex'; modalBack.setAttribute('aria-hidden', 'false');
    // focus first input if exists
    const firstInput = modalBack.querySelector('input, textarea, button');
    if (firstInput) firstInput.focus();
}
function closeModal() { modalBack.style.display = 'none'; modalBack.setAttribute('aria-hidden', 'true'); qs('#modal-content').innerHTML = ''; }

modalBack.addEventListener('click', (e) => { if (e.target === modalBack) closeModal(); });

/************ Sell product modal/form (fixed layout) ************/
function openSellModal(product = null) {
    const isEdit = !!product;
    const html = `
        <div class="modal-header">
          <h3 id="modal-title">${isEdit ? '✏️ Edit Product' : '🛒 Sell Your Product'}</h3>
          <button class="modal-close" id="modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <form id="sell-form">
            <div class="form-row">
              <div class="form-col">
                <div class="form-group">
                  <label for="title">Product Title</label>
                  <input class="form-input" id="title" name="title" type="text" required placeholder="e.g. Physics Notes (Sem1)" value="${product ? escapeHtml(product.title) : ''}"/>
                </div>
                <div style="display:flex;gap:12px">
                  <div class="form-group" style="flex:1">
                    <label for="price">Price</label>
                    <input class="form-input" id="price" name="price" type="text" required placeholder="₹200" value="${product ? escapeHtml(product.price) : ''}"/>
                  </div>
                  <div class="form-group" style="flex:1">
                    <label for="seller">Seller Name</label>
                    <input class="form-input" id="seller" name="seller" type="text" required placeholder="Your name" value="${product ? escapeHtml(product.seller) : ''}"/>
                  </div>
                </div>
                <div class="form-group">
                  <label for="desc">Description</label>
                  <textarea class="form-input" id="desc" name="desc" rows="4" placeholder="Describe your product... (e.g. Handwritten neat notes, 40 pages, excellent condition)">${product ? escapeHtml(product.desc) : ''}</textarea>
                </div>
                <div class="form-group">
                  <label for="contact">Contact (email/phone)</label>
                  <input class="form-input" id="contact" name="contact" type="text" required placeholder="your.email@vedam.edu or +91..." value="${product ? escapeHtml(product.contact) : ''}"/>
                </div>
              </div>
              <div class="form-side">
                <div class="form-group">
                  <label>Product Image</label>
                  <div class="file-upload-area" id="file-upload-area">
                    <div class="file-input-wrapper">
                      <input id="img-input" type="file" accept="image/*" />
                      <div class="file-upload-icon">📷</div>
                      <div class="file-upload-text">Click to upload or drag & drop</div>
                      <div class="file-upload-hint">PNG, JPG up to 5MB</div>
                    </div>
                  </div>
                  <div id="img-preview" class="img-preview">${product && product.img ? `<img src="${product.img}" alt="Product preview" />` : '<div class="img-preview-empty">No image selected</div>'}</div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <div class="footer-actions">
            <button type="button" class="btn btn-ghost" id="cancel-sell">Cancel</button>
            <button type="submit" form="sell-form" class="btn btn-primary">${isEdit ? '💾 Save Changes' : '➕ Add Product'}</button>
          </div>
        </div>
      `;
    openModal(html);
    // after open bind handlers
    const form = qs('#sell-form');
    const fileInput = qs('#img-input');
    const fileUploadArea = qs('#file-upload-area');
    const imgPreview = qs('#img-preview');
    let imgData = product && product.img ? product.img : '';

    // Close button
    qs('#modal-close').addEventListener('click', closeModal);

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    });

    function handleFileSelect(e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            imgData = e.target.result;
            imgPreview.innerHTML = `<img src="${imgData}" alt="Product preview" />`;
        };
        reader.readAsDataURL(f);
    }

    qs('#cancel-sell').addEventListener('click', closeModal);
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const obj = {
            id: product ? product.id : uid(),
            title: fd.get('title').trim(),
            price: fd.get('price').trim(),
            seller: fd.get('seller').trim(),
            desc: fd.get('desc').trim(),
            contact: fd.get('contact').trim(),
            img: imgData,
            ts: product ? product.ts : Date.now(),
            ownerId: product ? product.ownerId : deviceId
        };
        if (!obj.title || !obj.price) { alert('Please fill title and price'); return; }
        if (product) {
            state.products = state.products.map(p => p.id === product.id ? obj : p);
        } else {
            state.products.unshift(obj);
        }
        saveProducts(state.products);
        renderProducts(state.products);
        toast(product ? 'Product updated' : 'Product added');
        closeModal();
    });
}

/************ Collab modal/form (category free text) ************/
function openCollabModal(collab = null) {
    const isEdit = !!collab;
    const html = `
        <div class="modal-header">
          <h3 id="modal-title">${isEdit ? '✏️ Edit Invite' : '🤝 Create Invitation'}</h3>
          <button class="modal-close" id="collab-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <form id="collab-form">
            <div class="form-row">
              <div class="form-col">
                <div class="form-group">
                  <label for="collab-title">Title</label>
                  <input class="form-input" id="collab-title" name="title" required placeholder="e.g. Need 2 devs for Hackathon" value="${collab ? escapeHtml(collab.title) : ''}"/>
                </div>
                
                <div style="display:flex;gap:12px">
                  <div class="form-group" style="flex:1">
                    <label for="collab-cat">Category</label>
                    <input class="form-input" id="collab-cat" name="cat" list="cat-suggestions" value="${collab ? escapeHtml(collab.cat) : ''}" placeholder="Type or select..." />
                    <datalist id="cat-suggestions">
                      <option value="Hackathon">
                      <option value="Sports">
                      <option value="Study Group">
                      <option value="Project">
                      <option value="Event">
                      <option value="Gaming">
                    </datalist>
                  </div>
                  <div class="form-group" style="flex:1">
                    <label for="collab-contact">Contact</label>
                    <input class="form-input" id="collab-contact" name="contact" required placeholder="Email or Phone" value="${collab ? escapeHtml(collab.contact) : ''}"/>
                  </div>
                </div>

                <div class="form-group">
                  <label for="collab-desc">Description</label>
                  <textarea class="form-input" id="collab-desc" name="desc" rows="4" placeholder="Describe what you are looking for, time, place, etc.">${collab ? escapeHtml(collab.desc) : ''}</textarea>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <div class="footer-actions">
            <button type="button" class="btn btn-ghost" id="cancel-collab">Cancel</button>
            <button type="submit" form="collab-form" class="btn btn-primary">${isEdit ? '💾 Save Changes' : '🚀 Post Invite'}</button>
          </div>
        </div>
      `;
    openModal(html);

    // Close handlers
    qs('#collab-modal-close').addEventListener('click', closeModal);
    qs('#cancel-collab').addEventListener('click', closeModal);

    // Form submit
    qs('#collab-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        const obj = {
            id: collab ? collab.id : uid(),
            title: fd.get('title').trim(),
            cat: fd.get('cat') ? fd.get('cat').trim() : '',
            desc: fd.get('desc').trim(),
            contact: fd.get('contact').trim(),
            joined: collab ? collab.joined || 0 : 0,
            ts: collab ? collab.ts : Date.now(),
            ownerId: collab ? collab.ownerId : deviceId
        };

        if (!obj.title || !obj.contact) {
            alert('Please fill Title and Contact fields');
            return;
        }

        if (collab) {
            state.collabs = state.collabs.map(c => c.id === collab.id ? obj : c);
        } else {
            state.collabs.unshift(obj);
        }
        saveCollabs(state.collabs);
        renderCollabs(state.collabs);
        toast(collab ? 'Invite updated' : 'Invite created');
        closeModal();
    });
}

/************ Contact modal ************/
/************ Contact modal ************/
function openContactModal(product) {
    // Determine if contact is email or phone
    const isEmail = product.contact.includes('@');
    let actionBtn = '';

    if (isEmail) {
        actionBtn = `<a class="btn btn-primary" href="mailto:${encodeURIComponent(product.contact)}?subject=${encodeURIComponent('Interested in ' + product.title)}&body=${encodeURIComponent('Hi ' + product.seller + ',%0D%0A%0D%0AI am interested in your product ' + product.title + ' listed on CampusConnect.%0D%0APrice: ' + product.price + '%0D%0APlease let me know when I can pick it up on Vedam floor.%0D%0AThanks.')}" id="mailto" style="text-decoration:none;display:inline-block">📨 Open Mail App</a>`;
    } else {
        // WhatsApp logic
        let phone = product.contact.replace(/\D/g, '');
        // Default to India 91 if no country code seems present (length 10)
        if (phone.length === 10) phone = '91' + phone;

        const msg = "hi i am intersted to buy your item can be talk";
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

        actionBtn = `<a class="btn btn-primary" href="${waUrl}" target="_blank" style="text-decoration:none;display:inline-block;background-color:#25D366;border-color:#25D366;color:white">💬 Chat on WhatsApp</a>`;
    }

    const html = `
        <div class="modal-header">
          <h3>📧 Contact Seller</h3>
          <button class="modal-close" id="contact-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;gap:16px;align-items:flex-start">
            <img src="${product.img || placeholderFor(product.title)}" class="contact-modal-img" style="width:140px;height:100px;object-fit:cover;border-radius:12px;border:2px solid rgba(15, 23, 42, 0.1)" alt="${escapeHtml(product.title)}" />
            <div style="flex:1">
              <div style="font-weight:700;font-size:18px;color:var(--text);margin-bottom:8px">${escapeHtml(product.title)}</div>
              <div class="small-muted" style="margin-bottom:4px">Seller: ${escapeHtml(product.seller)}</div>
              <div class="small-muted" style="margin-bottom:12px">Price: <strong style="color:var(--accent)">${escapeHtml(product.price)}</strong></div>
              ${actionBtn}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="footer-actions">
            <button class="btn btn-ghost" id="close-contact">Close</button>
          </div>
        </div>
      `;
    openModal(html);
    qs('#contact-modal-close').addEventListener('click', closeModal);
    qs('#close-contact').addEventListener('click', closeModal);
}

/************ Message modal for collaboration ************/
/************ Message modal for collaboration ************/
function openMessageModal(collab) {
    let actionBtn = '';
    if (collab.contact) {
        const isEmail = collab.contact.includes('@');
        if (isEmail) {
            actionBtn = `<a class="btn btn-primary" href="mailto:${encodeURIComponent(collab.contact)}?subject=${encodeURIComponent('Re: ' + collab.title)}&body=${encodeURIComponent('Hi,%0D%0A%0D%0AI am interested in your collaboration post: ' + collab.title + '%0D%0A%0D%0A' + (collab.desc || '') + '%0D%0A%0D%0APlease let me know how I can get involved.%0D%0AThanks.')}" id="mailto" style="text-decoration:none;display:inline-block;text-align:center">📨 Open Mail App</a>`;
        } else {
            // WhatsApp logic
            let phone = collab.contact.replace(/\D/g, '');
            if (phone.length === 10) phone = '91' + phone;
            const msg = "hi i am intersted to join your team can be talk";
            const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            actionBtn = `<a class="btn btn-primary" href="${waUrl}" target="_blank" style="text-decoration:none;display:inline-block;background-color:#25D366;border-color:#25D366;color:white">💬 Chat on WhatsApp</a>`;
        }
    } else {
        actionBtn = `<div class="small-muted" style="text-align:center;padding:12px;background:rgba(15, 23, 42, 0.05);border-radius:8px">No contact information available</div>`;
    }

    const html = `
        <div class="modal-header">
          <h3>💬 Message Poster</h3>
          <button class="modal-close" id="message-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;flex-direction:column;gap:16px">
            <div>
              <div style="font-weight:700;font-size:18px;color:var(--text);margin-bottom:8px">${escapeHtml(collab.title)}</div>
              ${collab.cat ? `<div style="margin-bottom:8px"><span class="chip">${escapeHtml(collab.cat)}</span></div>` : ''}
              <div class="small-muted" style="margin-bottom:8px">${escapeHtml(collab.desc)}</div>
              <div class="small-muted" style="margin-bottom:12px">Posted by: ${escapeHtml(collab.contact || 'Anonymous')}</div>
            </div>
            ${actionBtn}
          </div>
        </div>
        <div class="modal-footer">
          <div class="footer-actions">
            <button class="btn btn-ghost" id="close-message">Close</button>
          </div>
        </div>
      `;
    openModal(html);
    qs('#message-modal-close').addEventListener('click', closeModal);
    qs('#close-message').addEventListener('click', closeModal);
}

/************ Edit/Delete/Join functions (ownership enforced) ************/
function deleteProduct(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;
    if (p.ownerId !== deviceId) { alert('Only the creator can delete this product.'); return; }
    if (!confirm('Delete this product?')) return;
    state.products = state.products.filter(p => p.id !== id);
    saveProducts(state.products); renderProducts(state.products);
    toast('Product removed');
}
function deleteCollab(id) {
    const c = state.collabs.find(x => x.id === id);
    if (!c) return;
    if (c.ownerId !== deviceId) { alert('Only the creator can delete this invite.'); return; }
    if (!confirm('Delete this invite?')) return;
    state.collabs = state.collabs.filter(c => c.id !== id);
    saveCollabs(state.collabs); renderCollabs(state.collabs);
    toast('Invitation removed');
}
function toggleJoin(id) {
    state.collabs = state.collabs.map(c => {
        if (c.id === id) { c.joined = (c.joined || 0) + 1; }
        return c;
    });
    saveCollabs(state.collabs); renderCollabs(state.collabs);
    toast('Joined!');
}

/************ Helpers ************/
function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function exportData() { return { products: state.products, collabs: state.collabs } } // developer helper
// expose for debugging in console
window.exportData = exportData;

/************ Theme toggle ************/
function applyThemeFromStorage() {
    const t = localStorage.getItem(STORAGE_THEME) || 'light';
    if (t === 'dark') document.body.classList.add('dark'); else document.body.classList.remove('dark');
    qs('#theme-toggle').textContent = t === 'dark' ? '☀️' : '🌙';
}
applyThemeFromStorage();
qs('#theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
    qs('#theme-toggle').textContent = isDark ? '☀️' : '🌙';
});

/************ Edit open helpers ************/
function openSellModalById(id) { const p = state.products.find(x => x.id === id); if (p) openSellModal(p) }
function openCollabById(id) { const c = state.collabs.find(x => x.id === id); if (c) openCollabModal(c) }

/************ Dashboard updater ************/
function updateDashboard() {
    const myProducts = state.products.filter(p => p.ownerId === deviceId).length;
    const myCollabs = state.collabs.filter(c => c.ownerId === deviceId).length;

    qs('#stat-products').textContent = myProducts;
    qs('#stat-collabs').textContent = myCollabs;

    // Mock user info
    qs('#user-avatar').textContent = 'A';
    qs('#user-name').textContent = 'Ankit';

    // Activity feed
    const activities = [];
    state.products.filter(p => p.ownerId === deviceId).forEach(p => {
        activities.push({ text: `Listed <strong>${escapeHtml(p.title)}</strong> for sale`, time: p.ts, icon: '🏷️' });
    });
    state.collabs.filter(c => c.ownerId === deviceId).forEach(c => {
        activities.push({ text: `Posted invite: <strong>${escapeHtml(c.title)}</strong>`, time: c.ts, icon: '🤝' });
    });

    activities.sort((a, b) => b.time - a.time);

    const list = qs('#activity-list');
    if (activities.length) {
        list.innerHTML = activities.slice(0, 5).map(a => `
                    <li class="activity-item">
                        <div class="activity-icon">${a.icon}</div>
                        <div class="activity-content">
                            <div class="activity-text">${a.text}</div>
                            <div class="activity-time">${timeAgo(a.time)}</div>
                        </div>
                    </li>
                `).join('');
    }
}
updateDashboard();

/************ Onload attach keyboard shortcuts for demo convenience ************/
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

/************ Sidebar Toggle ************/
qs('#sidebar-toggle').addEventListener('click', () => {
    qs('#app-sidebar').classList.toggle('collapsed');
});