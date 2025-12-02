import { supabase } from './supabaseClient.js';

/************ Global State ************/
let currentUser = null;
let collabs = [];

/************ Utility Functions ************/
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => document.querySelectorAll(sel);

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function timeAgo(ts) {
    const now = Date.now();
    const diff = now - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function toast(msg) {
    const t = qs('#toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

/************ Auth ************/
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = './login.html';
        return;
    }
    currentUser = session.user;
    updateUserInfo();
}

function updateUserInfo() {
    if (!currentUser) return;
    const email = currentUser.email || 'user@example.com';
    const name = email.split('@')[0];
    const avatar = email.charAt(0).toUpperCase();

    if (qs('#user-name')) qs('#user-name').textContent = name;
    if (qs('#user-avatar')) qs('#user-avatar').textContent = avatar;
}

/************ Data Loading ************/
async function loadCollabs() {
    try {
        const { data, error } = await supabase
            .from('collaborations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(item => ({
            id: item.id,
            title: item.title,
            desc: item.description || '',
            cat: item.category || 'General',
            contact: item.contact_info || item.creator_id,
            ts: new Date(item.created_at).getTime(),
            ownerId: item.creator_id
        }));
    } catch (error) {
        console.error('Error loading collaborations:', error);
        toast('Failed to load collaborations');
        return [];
    }
}

async function saveCollab(collab, isEdit) {
    try {
        const collabData = {
            title: collab.title,
            description: collab.desc,
            category: collab.cat || null,
            contact_info: collab.contact,
            creator_id: currentUser.id
        };

        if (isEdit && collab.id) {
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
        toast('Failed to save collaboration');
        return false;
    }
}

async function deleteCollab(id) {
    if (!confirm('Delete this collaboration?')) return;

    try {
        const { error } = await supabase
            .from('collaborations')
            .delete()
            .eq('id', id)
            .eq('creator_id', currentUser.id);

        if (error) throw error;

        toast('Collaboration deleted');
        await refreshData();
    } catch (error) {
        console.error('Error deleting collaboration:', error);
        toast('Failed to delete collaboration');
    }
}

async function refreshData() {
    collabs = await loadCollabs();
    renderCollabs(collabs);
    updateStats();
}

/************ Rendering ************/
function renderCollabs(collabsList, filter = null) {
    const grid = qs('#collab-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let list = collabsList.slice().sort((a, b) => b.ts - a.ts);
    if (filter) {
        list = list.filter(c =>
            (c.title || '').toLowerCase().includes(filter.toLowerCase()) ||
            (c.desc || '').toLowerCase().includes(filter.toLowerCase()) ||
            (c.cat || '').toLowerCase().includes(filter.toLowerCase())
        );
    }

    if (!list.length) {
        if (qs('#collabs-empty')) qs('#collabs-empty').style.display = 'block';
        return;
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

        let avatarChar = 'U';
        if (c.ownerId === currentUser?.id && currentUser.email) {
            avatarChar = currentUser.email.charAt(0).toUpperCase();
        } else if (c.contact && isNaN(parseInt(c.contact.charAt(0)))) {
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
            editBtn.className = 'btn-action btn-edit';
            editBtn.innerHTML = '<img src="/edit-icon.png" alt="Edit" />';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', () => openCollabModal(c));

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-action btn-delete';
            delBtn.innerHTML = '<img src="/delete-icon.png" alt="Delete" />';
            delBtn.title = 'Delete';
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

function updateStats() {
    const myCollabs = collabs.filter(c => c.ownerId === currentUser?.id);
    if (qs('#stat-collabs')) qs('#stat-collabs').textContent = myCollabs.length;
}

/************ Modals ************/
function openModal(html) {
    const backdrop = qs('#modal-backdrop');
    const content = qs('#modal-content');
    if (!backdrop || !content) return;
    content.innerHTML = html;
    backdrop.style.display = 'flex';
}

function closeModal() {
    const backdrop = qs('#modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
}

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
                      <option value="Project">
                      <option value="Study Group">
                      <option value="Sports">
                      <option value="Event">
                      <option value="Other">
                    </datalist>
                  </div>
                  <div class="form-group" style="flex:1">
                    <label for="collab-contact">Contact</label>
                    <input class="form-input" id="collab-contact" name="contact" required placeholder="Email or phone" value="${collab ? escapeHtml(collab.contact) : currentUser?.email || ''}"/>
                  </div>
                </div>
                <div class="form-group">
                  <label for="collab-desc">Description</label>
                  <textarea class="form-input" id="collab-desc" name="desc" rows="4" placeholder="Describe what you're looking for..." required>${collab ? escapeHtml(collab.desc) : ''}</textarea>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-collab">Cancel</button>
          <button class="btn btn-primary" id="submit-collab">${isEdit ? 'Update' : 'Create'}</button>
        </div>
    `;

    openModal(html);

    qs('#collab-modal-close').addEventListener('click', closeModal);
    qs('#cancel-collab').addEventListener('click', closeModal);
    qs('#submit-collab').addEventListener('click', async () => {
        const form = qs('#collab-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const submitBtn = qs('#submit-collab');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Saving...';

        const fd = new FormData(form);
        const obj = {
            id: collab ? collab.id : null,
            title: fd.get('title').trim(),
            desc: fd.get('desc').trim(),
            cat: fd.get('cat').trim(),
            contact: fd.get('contact').trim()
        };

        const success = await saveCollab(obj, isEdit);
        if (success) {
            toast(isEdit ? 'Collaboration updated' : 'Collaboration created');
            closeModal();
            await refreshData();
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

/**
 * Helper to format WhatsApp links robustly
 * Handles:
 * - Leading zeros (098...) -> 9198...
 * - International format (+91...) -> 91...
 * - Local 10-digit -> 91...
 */
function formatWhatsAppLink(contact, message) {
    if (!contact) return null;

    // 1. Keep only digits and +
    let clean = contact.replace(/[^\d+]/g, '');

    // 2. Check for international format (starts with +)
    let isInternational = clean.startsWith('+');

    // 3. Remove all non-digits for the final URL
    let phone = clean.replace(/\D/g, '');

    // 4. Remove leading zeros (common user error: 098...)
    phone = phone.replace(/^0+/, '');

    // 5. If it was NOT international (no +) and is exactly 10 digits, assume India (+91)
    if (!isInternational && phone.length === 10) {
        phone = '91' + phone;
    }

    // 6. Validation: WhatsApp numbers are generally 10-15 digits
    if (phone.length < 10 || phone.length > 15) {
        console.warn('Phone number invalid length for WhatsApp:', phone.length, phone);
        return null; // Invalid, caller should show fallback
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return `<a class="btn btn-primary" href="${url}" target="_blank" style="text-decoration:none;display:flex;justify-content:center;align-items:center;gap:8px;background-color:#25D366;border-color:#25D366;color:white;width:100%;padding:12px 20px;font-size:16px;font-weight:600">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        Message
    </a>`;
}

function openMessageModal(collab) {
    let actionBtn = '';
    if (collab.contact) {
        const isEmail = collab.contact.includes('@');
        if (isEmail) {
            actionBtn = `<a class="btn btn-primary" href="mailto:${encodeURIComponent(collab.contact)}?subject=${encodeURIComponent('Re: ' + collab.title)}" style="text-decoration:none;display:flex;justify-content:center;align-items:center;width:100%;padding:12px 20px;font-size:16px;font-weight:600">📨 Open Mail App</a>`;
        } else {
            const msg = "Hi, I am interested to join your team. Can we talk?";
            const waBtn = formatWhatsAppLink(collab.contact, msg);

            if (waBtn) {
                actionBtn = waBtn;
            } else {
                actionBtn = `<div class="btn btn-ghost" style="cursor:default;user-select:all;width:100%">Contact: ${escapeHtml(collab.contact)}</div>`;
            }
        }
    } else {
        actionBtn = `<div class="small-muted" style="text-align:center;padding:12px;background:rgba(15, 23, 42, 0.05);border-radius:8px">No contact information available</div>`;
    }

    const html = `
        <div class="modal-header">
          <h3>💬 Message Poster</h3>
          <button class="modal-close" id="msg-modal-close" aria-label="Close">✕</button>
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
            <button class="btn btn-ghost" id="close-msg">Close</button>
          </div>
        </div>
    `;

    openModal(html);
    qs('#msg-modal-close').addEventListener('click', closeModal);
    qs('#close-msg').addEventListener('click', closeModal);
}

/************ Event Handlers ************/
function setupEventHandlers() {
    // Create collaboration button
    const openCollabBtn = qs('#open-collab');
    if (openCollabBtn) {
        openCollabBtn.addEventListener('click', () => openCollabModal());
    }

    // Search
    const searchInput = qs('#collab-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCollabs(collabs, e.target.value);
        });
    }

    // Logout
    const logoutBtn = qs('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = './login.html';
        });
    }

    // Close modal on backdrop click
    const backdrop = qs('#modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    }
}

/************ Initialize ************/
async function init() {
    await checkAuth();
    setupEventHandlers();
    await refreshData();
}

// Start the app
init();
