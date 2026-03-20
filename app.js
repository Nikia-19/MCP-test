// SAP Sales Order Dashboard — App Logic
let orders = JSON.parse(localStorage.getItem('sap_orders') || 'null') || SEED_ORDERS.map(o => ({...o}));
let editingId = null;
let deletingId = null;
let sortKey = 'date';
let sortDir = -1;
let currentPage = 1;
const PAGE_SIZE = 8;

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('f-date').valueAsDate = new Date();
  renderAll();
});

function saveToStorage() {
  localStorage.setItem('sap_orders', JSON.stringify(orders));
}

// ── RENDER ────────────────────────────────────────────
function renderAll() {
  updateKPIs();
  renderTable();
}

function updateKPIs() {
  const open = orders.filter(o => o.status === 'Open').length;
  const delivery = orders.filter(o => o.status === 'In Delivery').length;
  const complete = orders.filter(o => o.status === 'Completed').length;
  const rev = orders.reduce((s, o) => s + (o.status !== 'Cancelled' ? o.value : 0), 0);
  animateNum('kpi-total', orders.length);
  animateNum('kpi-open', open);
  animateNum('kpi-delivery', delivery);
  animateNum('kpi-complete', complete);
  document.getElementById('kpi-rev').textContent = (rev / 100000).toFixed(1);
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  const start = parseInt(el.textContent) || 0;
  const dur = 400;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(start + (target - start) * easeOut(p));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function getFiltered() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const st = document.getElementById('filter-status').value;
  const rg = document.getElementById('filter-region').value;
  return orders
    .filter(o => {
      if (q && !o.id.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q) && !o.material.toLowerCase().includes(q)) return false;
      if (st && o.status !== st) return false;
      if (rg && o.region !== rg) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') return sortDir * av.localeCompare(bv);
      return sortDir * (av - bv);
    });
}

function renderTable() {
  const filtered = getFiltered();
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > pages) currentPage = pages;
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const tbody = document.getElementById('table-body');
  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>No orders found</p></td></tr>`;
  } else {
    tbody.innerHTML = slice.map(o => `
      <tr>
        <td><span class="order-id">${o.id}</span></td>
        <td>${o.customer}</td>
        <td>${o.material}</td>
        <td>${o.qty.toLocaleString()}</td>
        <td>₹${o.value.toLocaleString('en-IN')}</td>
        <td>${o.region}</td>
        <td>${formatDate(o.date)}</td>
        <td><span class="status-badge status-${o.status.replace(' ','')}">${o.status}</span></td>
        <td><div class="action-btns">
          <button class="act-btn edit" onclick="openEdit('${o.id}')">Edit</button>
          <button class="act-btn del" onclick="openDelete('${o.id}')">Delete</button>
        </div></td>
      </tr>`).join('');
  }

  document.getElementById('table-count').textContent = `Showing ${slice.length} of ${total} orders`;
  renderPagination(pages);
}

function renderPagination(pages) {
  const el = document.getElementById('pagination');
  el.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === currentPage ? ' active' : '');
    b.textContent = i;
    b.onclick = () => { currentPage = i; renderTable(); };
    el.appendChild(b);
  }
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── FILTER / SORT ─────────────────────────────────────
function filterOrders() { currentPage = 1; renderTable(); }

function sortTable(key) {
  if (sortKey === key) sortDir *= -1;
  else { sortKey = key; sortDir = 1; }
  renderTable();
}

// ── MODAL ─────────────────────────────────────────────
function openModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Sales Order';
  document.getElementById('save-btn').textContent = 'Create Order';
  clearForm();
  document.getElementById('f-date').valueAsDate = new Date();
  document.getElementById('modal-overlay').classList.add('open');
}

function openEdit(id) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Order · ' + id;
  document.getElementById('save-btn').textContent = 'Save Changes';
  document.getElementById('f-customer').value = o.customer;
  document.getElementById('f-material').value = o.material;
  document.getElementById('f-qty').value = o.qty;
  document.getElementById('f-value').value = o.value;
  document.getElementById('f-region').value = o.region;
  document.getElementById('f-status').value = o.status;
  document.getElementById('f-date').value = o.date;
  document.getElementById('form-error').textContent = '';
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

function clearForm() {
  ['f-customer','f-material','f-qty','f-value'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-region').value = 'North';
  document.getElementById('f-status').value = 'Open';
  document.getElementById('form-error').textContent = '';
}

function saveOrder() {
  const customer = document.getElementById('f-customer').value.trim();
  const material = document.getElementById('f-material').value.trim();
  const qty = parseInt(document.getElementById('f-qty').value);
  const value = parseFloat(document.getElementById('f-value').value);
  const region = document.getElementById('f-region').value;
  const status = document.getElementById('f-status').value;
  const date = document.getElementById('f-date').value;

  if (!customer || !material || !qty || !value) {
    document.getElementById('form-error').textContent = 'Please fill all required fields.';
    return;
  }

  if (editingId) {
    const idx = orders.findIndex(o => o.id === editingId);
    orders[idx] = { ...orders[idx], customer, material, qty, value, region, status, date };
    showToast('Order updated successfully', 'success');
  } else {
    const maxNum = orders.reduce((m, o) => Math.max(m, parseInt(o.id.split('-')[1]) || 0), 10000);
    const newId = 'SO-' + (maxNum + 1);
    orders.unshift({ id: newId, customer, material, qty, value, region, status, date });
    showToast('Order ' + newId + ' created', 'success');
  }

  saveToStorage();
  renderAll();
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── DELETE ────────────────────────────────────────────
function openDelete(id) {
  deletingId = id;
  document.getElementById('del-id-label').textContent = id;
  document.getElementById('del-overlay').classList.add('open');
}

function closeDelModal(e) {
  if (e && e.target !== document.getElementById('del-overlay')) return;
  document.getElementById('del-overlay').classList.remove('open');
}

function confirmDelete() {
  orders = orders.filter(o => o.id !== deletingId);
  saveToStorage();
  renderAll();
  document.getElementById('del-overlay').classList.remove('open');
  showToast('Order ' + deletingId + ' deleted', 'success');
}

// ── EXPORT ────────────────────────────────────────────
function exportCSV() {
  const filtered = getFiltered();
  const header = ['Order ID','Customer','Material','Qty','Net Value','Region','Date','Status'];
  const rows = filtered.map(o => [o.id, o.customer, o.material, o.qty, o.value, o.region, o.date, o.status]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sales_orders_export.csv';
  a.click();
  showToast('CSV exported (' + filtered.length + ' rows)', 'success');
}

// ── TOAST ─────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.className = 'toast', 2800);
}
