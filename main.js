// Import Supabase client
import { supabase } from './supabaseClient.js';

/************ Utility helpers ************/
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const toast = (t) => { const el = qs('#toast'); el.textContent = t; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 2200) }
const timeAgo = (ts) => {
    if (!ts) return 'Just now';
    const tsDate = new Date(ts);
    const diff = Math.floor((Date.now() - tsDate.getTime()) / 1000);
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}
const STORAGE_THEME = 'campus_connect_theme';


// Current user
let currentUser = null;

/************ Authentication Check ************/
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error checking session:', error);
            toast('Error checking authentication');
            return false;
        }

        if (!session || !session.user) {
            // Not logged in, redirect to login
            console.log('No session found, redirecting to login');
            window.location.href = './login.html';
            return false;
        }

        currentUser = session.user;
        console.log('Session found for user:', currentUser.email);
        return true;
    } catch (error) {
        console.error('Error in checkAuth:', error);
        return false;
    }
}

/************ Data helpers - Supabase ************/
async function loadItems() {
    try {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform Supabase data to app format
        return (data || []).map(item => ({
            id: item.id,
            title: item.title,
            price: `₹${item.price}`,
            desc: item.description || '',
            seller: 'Seller', // We'll get this from user metadata
            contact: item.seller_id, // For now, use seller_id
            img: item.image_url || '',
            ts: new Date(item.created_at).getTime(),
            ownerId: item.seller_id,
            category: item.category || ''
        }));
    } catch (error) {
        console.error('Error loading items:', error);
        toast('Error loading items');
        return [];
    }
}

async function loadCollaborations() {
    try {
        const { data, error } = await supabase
            .from('collaborations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform Supabase data to app format
        return (data || []).map(collab => ({
            id: collab.id,
            title: collab.title,
            cat: collab.category || '',
            desc: collab.description || '',
            contact: collab.contact_info || '',
            joined: 0, // Not in schema, keeping for compatibility
            ts: new Date(collab.created_at).getTime(),
            ownerId: collab.creator_id
        }));
    } catch (error) {
        console.error('Error loading collaborations:', error);
        toast('Error loading collaborations');
        return [];
    }
}

async function saveItem(item, isEdit = false) {
    try {
        const itemData = {
            title: item.title,
            description: item.desc,
            price: parseFloat(item.price.replace(/[₹,]/g, '')) || 0,
            image_url: item.img || null,
            category: item.category || null,
            is_active: true,
            seller_id: currentUser.id
        };

        if (isEdit) {
            const { error } = await supabase
                .from('items')
                .update(itemData)
                .eq('id', item.id)
                .eq('seller_id', currentUser.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('items')
                .insert([itemData]);

            if (error) throw error;
        }
        return true;
    } catch (error) {
        console.error('Error saving item:', error);
        toast('Error saving item: ' + error.message);
        return false;
    }
}

async function saveCollaboration(collab, isEdit = false) {
    try {
        const collabData = {
            title: collab.title,
            category: collab.cat || 'General',
            description: collab.desc || null,
            contact_info: collab.contact || null,
            creator_id: currentUser.id
        };

        if (isEdit) {
            const { error } = await supabase
                .from('collaborations')
                .update(collabData)
                .eq('id', collab.id)
                .eq('creator_id', currentUser.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('collaborations')
                .insert([collabData]);

            if (error) throw error;
        }
        return true;
    } catch (error) {
        console.error('Error saving collaboration:', error);
        toast('Error saving collaboration: ' + error.message);
        return false;
    }
}

async function deleteItem(id) {
    try {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id)
            .eq('seller_id', currentUser.id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting item:', error);
        toast('Error deleting item');
        return false;
    }

}

async function deleteCollaborationFromDB(id) {
    try {
        const { error } = await supabase
            .from('collaborations')
            .delete()
            .eq('id', id)
            .eq('creator_id', currentUser.id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting collaboration:', error);
        toast('Error deleting collaboration');
        return false;
    }
}

/************ Renderers ************/
function renderProducts(products) {
    const grid = qs('#product-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!products.length) {
        if (qs('#products-empty')) qs('#products-empty').style.display = 'block';
        return
    } else {
        if (qs('#products-empty')) qs('#products-empty').style.display = 'none';
    }

    products.sort((a, b) => b.ts - a.ts);
    for (const p of products) {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('role', 'listitem');
        const img = document.createElement('img');
        img.alt = p.title;
        img.src = p.img || placeholderFor(p.title);
        const title = document.createElement('div');
        title.className = 'product-title';
        title.textContent = p.title;
        const desc = document.createElement('div');
        desc.className = 'product-desc';
        desc.textContent = p.desc;
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `<div><strong>${p.price}</strong></div><div class="small-muted">${timeAgo(p.ts)}</div>`;
        const sellerRow = document.createElement('div');
        sellerRow.className = 'small-muted';
        sellerRow.textContent = 'Seller: ' + (p.seller || 'User');
        const actions = document.createElement('div');
        actions.className = 'card-actions';

        if (p.ownerId === currentUser?.id) {
            const editBtn = document.createElement('button');
            editBtn.className = 'icon-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => openSellModal(p));

            const delBtn = document.createElement('button');
            delBtn.className = 'icon-btn';
            delBtn.innerHTML = '🗑️';
            delBtn.title = 'Delete';
            delBtn.style.color = '#ef4444';
            delBtn.addEventListener('click', () => deleteProduct(p.id));

            actions.append(editBtn, delBtn);
        } else {
            const contactBtn = document.createElement('button');
            contactBtn.className = 'btn btn-ghost';
            contactBtn.textContent = 'Contact Seller';
            contactBtn.addEventListener('click', () => openContactModal(p));
            actions.append(contactBtn);
        }
        card.append(img, title, desc, sellerRow, meta, actions);
        grid.appendChild(card);
    }
}

function renderCollabs(collabs, filter = null) {
    const grid = qs('#collab-grid');
    if (!grid) return;
    grid.innerHTML = '';
    let list = collabs.slice().sort((a, b) => b.ts - a.ts);
    if (filter) list = list.filter(c => (c.cat || '').toLowerCase().includes(filter.toLowerCase()));
    if (!list.length) {
        if (qs('#collabs-empty')) qs('#collabs-empty').style.display = 'block';
        return
    } else {
        if (qs('#collabs-empty')) qs('#collabs-empty').style.display = 'none';
    }

    for (const c of list) {
        const card = document.createElement('article');
        card.className = 'collab-card';
        card.setAttribute('role', 'listitem');

        // Header: Category & Time
        const header = document.createElement('div');
        header.className = 'collab-header';

        const catChip = document.createElement('span');
        catChip.className = 'chip';
        catChip.textContent = c.cat || 'General';
        catChip.style.fontSize = '11px';
        catChip.style.padding = '4px 8px';

        const time = document.createElement('div');
        time.className = 'small-muted';
        time.textContent = timeAgo(c.ts);

        header.append(catChip, time);

        // Body: Title & Desc
        const body = document.createElement('div');
        body.className = 'collab-body';

        const title = document.createElement('div');
        title.className = 'collab-title';
        title.textContent = c.title;

        const desc = document.createElement('div');
        desc.className = 'product-desc';
        desc.textContent = c.desc;
        // Limit desc lines if needed via CSS, but keeping simple here

        body.append(title, desc);

        // Footer: Author & Actions
        const footer = document.createElement('div');
        footer.className = 'collab-footer';

        const authorDiv = document.createElement('div');
        authorDiv.style.display = 'flex';
        authorDiv.style.alignItems = 'center';
        authorDiv.style.gap = '8px';

        const avatar = document.createElement('div');
        avatar.className = 'collab-avatar';

        // Logic to determine avatar letter
        let avatarChar = 'U';
        if (c.ownerId === currentUser?.id && currentUser.email) {
            avatarChar = currentUser.email.charAt(0).toUpperCase();
        } else if (c.contact && isNaN(parseInt(c.contact.charAt(0)))) {
            // If contact starts with a letter (e.g. email or name)
            avatarChar = c.contact.charAt(0).toUpperCase();
        }

        avatar.textContent = avatarChar;

        const authorName = document.createElement('div');
        authorName.className = 'small-muted';
        authorName.style.fontWeight = '500';
        authorName.textContent = c.contact || 'Anonymous';

        authorDiv.append(avatar, authorName);

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        if (c.ownerId === currentUser?.id) {
            const editBtn = document.createElement('button');
            editBtn.className = 'icon-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => openCollabModal(c));

            const delBtn = document.createElement('button');
            delBtn.className = 'icon-btn';
            delBtn.innerHTML = '🗑️';
            delBtn.title = 'Delete';
            delBtn.style.color = '#ef4444';
            delBtn.addEventListener('click', () => deleteCollab(c.id));

            actions.append(editBtn, delBtn);
        } else {
            const messageBtn = document.createElement('button');
            messageBtn.className = 'btn btn-primary';
            messageBtn.style.padding = '6px 12px';
            messageBtn.style.fontSize = '12px';
            messageBtn.textContent = 'Message';
            messageBtn.addEventListener('click', () => openMessageModal(c));
            actions.append(messageBtn);
        }

        footer.append(authorDiv, actions);

        card.append(header, body, footer);
        grid.appendChild(card);
    }
}

/************ Placeholder image generator ************/
function placeholderFor(text = 'Item') {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='300'><rect width='100%' height='100%' fill='#eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='#333'>${esc(text)}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/************ State Management ************/
let state = { products: [], collabs: [] };

async function refreshData() {
    state.products = await loadItems();
    state.collabs = await loadCollaborations();
    renderProducts(state.products);
    renderCollabs(state.collabs);
    updateDashboard();
}

/************ Modal builders ************/
const modalBack = qs('#modal-backdrop');
function openModal(html) {
    qs('#modal-content').innerHTML = html;
    modalBack.style.display = 'flex';
    modalBack.setAttribute('aria-hidden', 'false');
    const firstInput = modalBack.querySelector('input, textarea, button');
    if (firstInput) firstInput.focus();
}
function closeModal() {
    modalBack.style.display = 'none';
    modalBack.setAttribute('aria-hidden', 'true');
    qs('#modal-content').innerHTML = '';
}

if (modalBack) {
    modalBack.addEventListener('click', (e) => { if (e.target === modalBack) closeModal(); });
}

/************ Sell product modal/form ************/
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
                    <label for="price">Price (₹)</label>
                    <input class="form-input" id="price" name="price" type="number" required placeholder="200" value="${product ? escapeHtml(product.price.replace(/[₹,]/g, '')) : ''}"/>
                  </div>
                  <div class="form-group" style="flex:1">
                    <label for="category">Category</label>
                    <input class="form-input" id="category" name="category" type="text" placeholder="Electronics, Books, etc." value="${product ? escapeHtml(product.category || '') : ''}"/>
                  </div>
                </div>
                <div class="form-group">
                  <label for="desc">Description</label>
                  <textarea class="form-input" id="desc" name="desc" rows="4" placeholder="Describe your product...">${product ? escapeHtml(product.desc) : ''}</textarea>
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

    const form = qs('#sell-form');
    const fileInput = qs('#img-input');
    const fileUploadArea = qs('#file-upload-area');
    const imgPreview = qs('#img-preview');
    let imgData = product && product.img ? product.img : '';

    qs('#modal-close').addEventListener('click', closeModal);
    fileInput.addEventListener('change', handleFileSelect);

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
    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const submitBtn = qs('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Saving...';

        const fd = new FormData(form);
        const obj = {
            id: product ? product.id : null,
            title: fd.get('title').trim(),
            price: `₹${fd.get('price').trim()}`,
            desc: fd.get('desc').trim(),
            img: imgData,
            category: fd.get('category').trim() || null
        };

        if (!obj.title || !fd.get('price')) {
            alert('Please fill title and price');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const success = await saveItem(obj, isEdit);
        if (success) {
            toast(product ? 'Product updated' : 'Product added');
            closeModal();
            await refreshData();
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

/************ Collab modal/form ************/
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
                    <input class="form-input" id="collab-cat" name="cat" list="cat-suggestions" value="${collab ? escapeHtml(collab.cat) : ''}" placeholder="Type or select..." required />
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

    qs('#collab-modal-close').addEventListener('click', closeModal);
    qs('#cancel-collab').addEventListener('click', closeModal);

    qs('#collab-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const submitBtn = qs('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Saving...';

        const fd = new FormData(ev.currentTarget);
        const obj = {
            id: collab ? collab.id : null,
            title: fd.get('title').trim(),
            cat: fd.get('cat') ? fd.get('cat').trim() : 'General',
            desc: fd.get('desc').trim(),
            contact: fd.get('contact').trim()
        };

        if (!obj.title || !obj.contact) {
            alert('Please fill Title and Contact fields');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const success = await saveCollaboration(obj, isEdit);
        if (success) {
            toast(collab ? 'Invite updated' : 'Invite created');
            closeModal();
            await refreshData();
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

/************ Contact modal ************/
function openContactModal(product) {
    const isEmail = product.contact && product.contact.includes('@');
    let actionBtn = '';

    if (isEmail) {
        actionBtn = `<a class="btn btn-primary" href="mailto:${encodeURIComponent(product.contact)}?subject=${encodeURIComponent('Interested in ' + product.title)}" style="text-decoration:none;display:inline-block">📨 Open Mail App</a>`;
    } else if (product.contact) {
        let phone = product.contact.replace(/\D/g, '');
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
              <div class="small-muted" style="margin-bottom:4px">Seller: ${escapeHtml(product.seller || 'User')}</div>
              <div class="small-muted" style="margin-bottom:12px">Price: <strong style="color:var(--accent)">${escapeHtml(product.price)}</strong></div>
              ${actionBtn || '<p class="small-muted">Contact information not available</p>'}
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
function openMessageModal(collab) {
    let actionBtn = '';
    if (collab.contact) {
        const isEmail = collab.contact.includes('@');
        if (isEmail) {
            actionBtn = `<a class="btn btn-primary" href="mailto:${encodeURIComponent(collab.contact)}?subject=${encodeURIComponent('Re: ' + collab.title)}" style="text-decoration:none;display:inline-block;text-align:center">📨 Open Mail App</a>`;
        } else {
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

/************ Delete functions ************/
async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    const success = await deleteItem(id);
    if (success) {
        toast('Product removed');
        await refreshData();
    }
}

async function deleteCollab(id) {
    if (!confirm('Delete this invite?')) return;
    const success = await deleteCollaborationFromDB(id);
    if (success) {
        toast('Invitation removed');
        await refreshData();
    }
}

/************ Helpers ************/
function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

/************ Theme toggle ************/
function applyThemeFromStorage() {
    const t = localStorage.getItem(STORAGE_THEME) || 'light';
    if (t === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    if (qs('#theme-toggle')) qs('#theme-toggle').textContent = t === 'dark' ? '☀️' : '🌙';
}
applyThemeFromStorage();



/************ Dashboard updater ************/
function updateDashboard() {
    if (!currentUser) return;

    const myProducts = state.products.filter(p => p.ownerId === currentUser.id).length;
    const myCollabs = state.collabs.filter(c => c.ownerId === currentUser.id).length;

    if (qs('#stat-products')) qs('#stat-products').textContent = myProducts;
    if (qs('#stat-collabs')) qs('#stat-collabs').textContent = myCollabs;

    if (qs('#user-avatar')) qs('#user-avatar').textContent = (currentUser.email?.[0] || 'U').toUpperCase();
    if (qs('#user-name')) qs('#user-name').textContent = currentUser.email?.split('@')[0] || 'User';
}

/************ Initialize App ************/
async function init() {
    try {
        console.log('Initializing app...');
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            return;
        }

        console.log('User authenticated:', currentUser?.email);

        // Set up event listeners
        if (qs('#btn-buy')) qs('#btn-buy').addEventListener('click', () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }));
        if (qs('#btn-collab')) qs('#btn-collab').addEventListener('click', () => document.getElementById('collabs')?.scrollIntoView({ behavior: 'smooth' }));






        // Search
        if (qs('#product-search')) {
            qs('#product-search').addEventListener('input', (e) => {
                const q = e.target.value.trim().toLowerCase();
                const filtered = state.products.filter(p =>
                    p.title.toLowerCase().includes(q) ||
                    (p.desc || '').toLowerCase().includes(q)
                );
                renderProducts(filtered);
            });
        }

        // Load initial data
        console.log('Loading data...');
        await refreshData();
        console.log('Data loaded successfully');

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        toast('Error loading app: ' + (error.message || 'Unknown error'));
        // Show error in console for debugging
        console.error('Full error:', error);
    }
}

// Show loading state
document.body.style.cursor = 'wait';

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupActionButtons();
        init().finally(() => {
            document.body.style.cursor = 'default';
        });
    });
} else {
    setupActionButtons();
    init().finally(() => {
        document.body.style.cursor = 'default';
    });
}

function setupActionButtons() {
    // Logout Button
    const logoutBtn = qs('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to log out?')) {
                toast('Logging out...');
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Error signing out:', error);
                window.location.href = './login.html';
            }
        });
    }

    // Sell Button
    const sellBtn = qs('#open-sell');
    if (sellBtn) {
        console.log('Sell button found, attaching listener');
        // Clone to remove old listeners
        const newBtn = sellBtn.cloneNode(true);
        sellBtn.parentNode.replaceChild(newBtn, sellBtn);
        newBtn.addEventListener('click', () => {
            console.log('Sell button clicked. Current user:', currentUser);
            if (!currentUser) {
                console.warn('User not logged in');
                toast('Please wait, verifying session...');
                return;
            }
            console.log('Opening sell modal');
            openSellModal();
        });
    } else {
        console.error('Sell button NOT found');
    }

    // Collab Button (Create Invite)
    const collabBtn = qs('#open-collab');
    if (collabBtn) {
        const newBtn = collabBtn.cloneNode(true);
        collabBtn.parentNode.replaceChild(newBtn, collabBtn);
        newBtn.addEventListener('click', () => {
            if (!currentUser) {
                toast('Please wait, verifying session...');
                return;
            }
            openCollabModal();
        });
    }
}

// Expose modals globally for inline onclick fallback
window.openSellModal = (product) => {
    if (!currentUser) {
        toast('Please wait, verifying session...');
        return;
    }
    // Call the local function defined in this module
    openSellModal(product);
};

window.openCollabModal = (collab) => {
    if (!currentUser) {
        toast('Please wait, verifying session...');
        return;
    }
    openCollabModal(collab);
};

// Diagnostic: Test DB Connection
async function testDbConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('items').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase connection FAILED:', error);
            // alert('Database Error: ' + error.message); // Keep silent for now, log only
        } else {
            console.log('Supabase connection SUCCESS. Item count:', data);
        }
    } catch (err) {
        console.error('Supabase connection EXCEPTION:', err);
    }
}
testDbConnection();
