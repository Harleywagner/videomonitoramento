/* ========================================
   VIDEOMONITORAMENTO HUC - PREMIUM EDITION
   Lógica Avançada e Performance Otimizada
   ======================================== */

// Módulo de Estado da Aplicação
const AppState = {
    occurrences: [],
    cameras: [],
    editingId: null,
    currentNvr: 1,
    config: {
        types: ['Movimento suspeito', 'Acesso não autorizado', 'Tentativa de furto', 'Furto consumado', 'Vandalismo', 'Violação de perímetro', 'Alarme disparado', 'Falha de equipamento', 'Apoio operacional', 'Acidente', 'Confusão', 'Outros'],
        operators: ['Wagner', 'Ernesto', 'Glaucia', 'Arnaldo'],
        storageKeys: {
            occurrences: 'huc_premium_occ',
            cameras: 'huc_premium_cam'
        }
    }
};

/**
 * INICIALIZAÇÃO
 */
document.addEventListener('DOMContentLoaded', () => {
    PremiumApp.init();
});

const PremiumApp = {
    init() {
        console.log("🚀 Inicializando Sistema Premium...");
        this.loadData();
        this.setupEventListeners();
        this.startClock();
        this.refreshUI();
    },

    loadData() {
        try {
            const occ = localStorage.getItem(AppState.config.storageKeys.occurrences);
            AppState.occurrences = occ ? JSON.parse(occ) : [];

            const cam = localStorage.getItem(AppState.config.storageKeys.cameras);
            if (cam) {
                AppState.cameras = JSON.parse(cam);
            } else {
                this.initDefaultCameras();
            }
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            this.showNotification("Erro ao carregar dados locais.", "danger");
        }
    },

    saveData() {
        localStorage.setItem(AppState.config.storageKeys.occurrences, JSON.stringify(AppState.occurrences));
        localStorage.setItem(AppState.config.storageKeys.cameras, JSON.stringify(AppState.cameras));
    },

    initDefaultCameras() {
        AppState.cameras = [];
        for (let n = 1; n <= 9; n++) {
            for (let c = 1; c <= 32; c++) {
                AppState.cameras.push({
                    id: `NVR${n}-CAM${String(c).padStart(2, '0')}`,
                    nvr: n,
                    number: c,
                    status: 'Online',
                    obs: '',
                    updatedAt: new Date().toISOString()
                });
            }
        }
        this.saveData();
    },

    setupEventListeners() {
        // Formulário de Ocorrências
        const occForm = document.getElementById('occurrenceForm');
        if (occForm) occForm.onsubmit = (e) => this.handleOccurrenceSubmit(e);

        // Formulário de Câmeras
        const camForm = document.getElementById('cameraStatusForm');
        if (camForm) camForm.onsubmit = (e) => this.handleCameraSubmit(e);

        // Filtros em tempo real
        ['searchInput', 'typeFilter', 'statusFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.oninput = () => this.renderOccurrencesTable();
        });
    },

    startClock() {
        const update = () => {
            const el = document.getElementById('currentTime');
            if (el) el.textContent = new Date().toLocaleString('pt-BR', { 
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        };
        update();
        setInterval(update, 1000);
    },

    refreshUI() {
        this.populateSelects();
        this.updateDashboardStats();
        this.renderOccurrencesTable();
        this.drawCharts();
    },

    /**
     * GESTÃO DE OCORRÊNCIAS
     */
    handleOccurrenceSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const occurrence = {
            ...data,
            id: AppState.editingId || 'OCC-' + Date.now(),
            createdAt: new Date().toISOString()
        };

        if (AppState.editingId) {
            const index = AppState.occurrences.findIndex(o => o.id === AppState.editingId);
            if (index !== -1) AppState.occurrences[index] = occurrence;
        } else {
            AppState.occurrences.unshift(occurrence);
        }

        this.saveData();
        this.closeModal('occurrenceModal');
        this.refreshUI();
        this.showNotification(AppState.editingId ? "Ocorrência atualizada!" : "Nova ocorrência registrada!", "success");
        AppState.editingId = null;
    },

    editOccurrence(id) {
        const occ = AppState.occurrences.find(o => o.id === id);
        if (!occ) return;

        AppState.editingId = id;
        document.getElementById('modalTitle').textContent = 'Editar Ocorrência Premium';
        
        const form = document.getElementById('occurrenceForm');
        Object.keys(occ).forEach(key => {
            if (form.elements[key]) form.elements[key].value = occ[key];
        });

        this.openModal('occurrenceModal');
    },

    deleteOccurrence(id) {
        if (confirm("Deseja excluir permanentemente esta ocorrência?")) {
            AppState.occurrences = AppState.occurrences.filter(o => o.id !== id);
            this.saveData();
            this.refreshUI();
            this.showNotification("Ocorrência removida.", "warning");
        }
    },

    renderOccurrencesTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        const filtered = this.getFilteredOccurrences();
        tbody.innerHTML = filtered.length ? '' : '<tr><td colspan="7" style="text-align:center; padding:40px; color:#94a3b8;">Nenhum registro encontrado.</td></tr>';

        filtered.forEach(occ => {
            const tr = document.createElement('tr');
            tr.className = 'expandable-row';
            tr.onclick = (e) => {
                if (!e.target.closest('button')) this.toggleRowDetails(occ.id);
            };
            
            const statusClass = occ.classification === 'Encerrada' ? 'badge-success' : 'badge-warning';
            
            tr.innerHTML = `
                <td style="color:var(--primary); font-weight:bold;">#</td>
                <td>${this.formatDate(occ.occurrenceDate)} <span style="color:var(--text-muted); font-size:12px;">${occ.startTime}</span></td>
                <td><span class="badge badge-info">${occ.type}</span></td>
                <td><strong>${occ.location}</strong></td>
                <td><span class="badge ${statusClass}">${occ.classification}</span></td>
                <td>${occ.operator}</td>
                <td>
                    <button class="btn btn-outline" style="padding:5px 10px;" onclick="PremiumApp.editOccurrence('${occ.id}')">✏️</button>
                    <button class="btn btn-outline" style="padding:5px 10px; color:var(--danger);" onclick="PremiumApp.deleteOccurrence('${occ.id}')">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Detalhes (Ocultos por padrão)
            const detailTr = document.createElement('tr');
            detailTr.id = `details-${occ.id}`;
            detailTr.style.display = 'none';
            detailTr.innerHTML = `
                <td colspan="7" style="background:#f8fafc; padding:20px; border-left:4px solid var(--primary);">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                        <div><strong>Descrição Técnica:</strong><p style="margin-top:5px; font-size:13px;">${occ.technicalDescription}</p></div>
                        <div><strong>Ação Tomada:</strong><p style="margin-top:5px; font-size:13px;">${occ.actionTaken}</p></div>
                        <div><strong>Câmera:</strong><p style="margin-top:5px; font-size:13px;">${occ.camera}</p></div>
                        <div><strong>Órgãos Acionados:</strong><p style="margin-top:5px; font-size:13px;">${occ.agenciesContacted || 'Nenhum'}</p></div>
                    </div>
                </td>
            `;
            tbody.appendChild(detailTr);
        });
    },

    getFilteredOccurrences() {
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const type = document.getElementById('typeFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';

        return AppState.occurrences.filter(o => {
            const mSearch = !search || o.location.toLowerCase().includes(search) || o.camera.toLowerCase().includes(search) || o.technicalDescription.toLowerCase().includes(search);
            const mType = !type || o.type === type;
            const mStatus = !status || o.classification === status;
            return mSearch && mType && mStatus;
        });
    },

    toggleRowDetails(id) {
        const el = document.getElementById(`details-${id}`);
        if (el) el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
    },

    /**
     * GESTÃO DE CÂMERAS
     */
    renderNvrSelector() {
        const container = document.getElementById('nvrSelector');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = `btn ${i === AppState.currentNvr ? 'btn-primary' : 'btn-outline'}`;
            btn.textContent = `NVR ${i}`;
            btn.onclick = () => {
                AppState.currentNvr = i;
                this.renderNvrSelector();
                this.renderCameraGrid();
            };
            container.appendChild(btn);
        }
    },

    renderCameraGrid() {
        const grid = document.getElementById('cameraGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const cameras = AppState.cameras.filter(c => c.nvr === AppState.currentNvr);
        cameras.forEach(cam => {
            const card = document.createElement('div');
            card.className = 'camera-card';
            card.onclick = () => this.openCameraEdit(cam.id);
            
            const dotClass = cam.status === 'Online' ? 'dot-online' : (cam.status === 'Offline' ? 'dot-offline' : 'dot-defective');
            
            card.innerHTML = `
                <div class="camera-status-dot ${dotClass}"></div>
                <div style="font-size:10px; color:var(--text-muted); font-weight:700;">NVR ${cam.nvr}</div>
                <div style="font-size:18px; font-weight:800; margin:5px 0;">CAM ${cam.number}</div>
                <div style="font-size:11px; font-weight:600; color:${cam.status === 'Online' ? 'var(--success)' : 'var(--text-muted)'}">${cam.status}</div>
                ${cam.obs ? '<div style="font-size:10px; color:var(--primary); margin-top:5px;">📝 Tem Obs.</div>' : ''}
            `;
            grid.appendChild(card);
        });
    },

    openCameraEdit(id) {
        const cam = AppState.cameras.find(c => c.id === id);
        if (!cam) return;

        document.getElementById('cameraModalTitle').textContent = `Configurar ${cam.id}`;
        document.getElementById('modalCamId').value = cam.id;
        document.getElementById('modalCamStatus').value = cam.status;
        document.getElementById('modalCamObs').value = cam.obs || '';
        
        this.openModal('cameraStatusModal');
    },

    handleCameraSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('modalCamId').value;
        const status = document.getElementById('modalCamStatus').value;
        const obs = document.getElementById('modalCamObs').value;

        const index = AppState.cameras.findIndex(c => c.id === id);
        if (index !== -1) {
            AppState.cameras[index].status = status;
            AppState.cameras[index].obs = obs;
            AppState.cameras[index].updatedAt = new Date().toISOString();
            this.saveData();
            this.renderCameraGrid();
            this.updateDashboardStats();
            this.closeModal('cameraStatusModal');
            this.showNotification("Câmera atualizada com sucesso.", "success");
        }
    },

    /**
     * DASHBOARD E GRÁFICOS
     */
    updateDashboardStats() {
        const total = AppState.occurrences.length;
        const resolved = AppState.occurrences.filter(o => o.classification === 'Encerrada').length;
        const pending = total - resolved;
        const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        this.setElText('totalOccurrences', total);
        this.setElText('resolvedCount', resolved);
        this.setElText('pendingCount', pending);
        this.setElText('resolutionRate', rate + '%');

        // Stats de Câmeras
        this.setElText('totalCameras', AppState.cameras.length);
        this.setElText('onlineCameras', AppState.cameras.filter(c => c.status === 'Online').length);
        this.setElText('offlineCameras', AppState.cameras.filter(c => c.status === 'Offline').length);
        this.setElText('defectiveCameras', AppState.cameras.filter(c => c.status === 'Defeito').length);
    },

    drawCharts() {
        // Cores Premium
        const palette = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

        // 1. Tipos de Ocorrência
        const typeCounts = {};
        AppState.config.types.forEach(t => typeCounts[t] = 0);
        AppState.occurrences.forEach(o => { if(typeCounts[o.type] !== undefined) typeCounts[o.type]++; });
        this.renderBarChart('typeChart', typeCounts, palette);

        // 2. Status das Ocorrências
        const statusCounts = {
            'Encerrada': AppState.occurrences.filter(o => o.classification === 'Encerrada').length,
            'Em andamento': AppState.occurrences.filter(o => o.classification === 'Em andamento').length
        };
        this.renderBarChart('statusChart', statusCounts, ['#10b981', '#f59e0b']);

        // 3. Status das Câmeras
        const camCounts = {
            'Online': AppState.cameras.filter(c => c.status === 'Online').length,
            'Offline': AppState.cameras.filter(c => c.status === 'Offline').length,
            'Defeito': AppState.cameras.filter(c => c.status === 'Defeito').length
        };
        this.renderBarChart('cameraChart', camCounts, ['#10b981', '#ef4444', '#f59e0b']);
    },

    renderBarChart(canvasId, data, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const entries = Object.entries(data).filter(([_, v]) => v > 0);
        
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 250;
        
        if (!entries.length) {
            ctx.fillStyle = "#94a3b8";
            ctx.textAlign = "center";
            ctx.fillText("Sem dados para exibição", canvas.width/2, canvas.height/2);
            return;
        }

        const pad = 40;
        const bW = (canvas.width - pad * 2) / entries.length;
        const max = Math.max(...entries.map(e => e[1]), 1);

        entries.forEach(([lbl, val], i) => {
            const h = (val / max) * (canvas.height - pad * 2.5);
            const x = pad + i * bW;
            const y = canvas.height - pad - h;

            // Barra com Gradiente
            const grad = ctx.createLinearGradient(0, y, 0, y + h);
            const baseColor = Array.isArray(colors) ? colors[i % colors.length] : colors;
            grad.addColorStop(0, baseColor);
            grad.addColorStop(1, baseColor + 'CC');
            
            ctx.fillStyle = grad;
            this.roundRect(ctx, x + 10, y, bW - 20, h, 5);
            
            // Valor
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(val, x + bW/2, y - 8);

            // Label
            ctx.fillStyle = "#64748b";
            ctx.font = "600 10px sans-serif";
            const sLbl = lbl.length > 12 ? lbl.substring(0, 10) + '..' : lbl;
            ctx.fillText(sLbl, x + bW/2, canvas.height - pad + 15);
        });
    },

    /**
     * RELATÓRIOS
     */
    generateReport(action) {
        const period = document.getElementById('reportPeriodSelect').value;
        const now = new Date();
        
        const filtered = AppState.occurrences.filter(o => {
            const [y, m, d] = o.occurrenceDate.split('-').map(Number);
            const occDate = new Date(y, m-1, d);
            
            if (period === 'today') {
                return occDate.toDateString() === now.toDateString();
            } else if (period === 'week') {
                const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
                return occDate >= weekAgo;
            } else if (period === 'month') {
                return occDate.getMonth() === now.getMonth() && occDate.getFullYear() === now.getFullYear();
            }
            return true;
        });

        const html = `
            <div style="font-family:sans-serif; padding:40px; color:#1e293b;">
                <div style="border-bottom:3px solid #1e40af; padding-bottom:20px; margin-bottom:30px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h1 style="color:#1e40af; margin:0; font-size:24px;">RELATÓRIO DE MONITORAMENTO PREMIUM</h1>
                        <p style="color:#64748b; margin:5px 0 0 0;">Filtro: ${period.toUpperCase()} | Gerado em: ${now.toLocaleString('pt-BR')}</p>
                    </div>
                    <div style="text-align:right;">
                        <h2 style="margin:0; font-size:18px;">HUC / ISGH</h2>
                        <p style="margin:0; font-size:12px; color:#64748b;">Sistema de Segurança Eletrônica</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; margin-bottom:30px;">
                    <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Ocorrências</div>
                        <div style="font-size:24px; font-weight:800; color:#1e40af;">${filtered.length}</div>
                    </div>
                    <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Câmeras Online</div>
                        <div style="font-size:24px; font-weight:800; color:#10b981;">${AppState.cameras.filter(c=>c.status==='Online').length}</div>
                    </div>
                    <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Offline</div>
                        <div style="font-size:24px; font-weight:800; color:#ef4444;">${AppState.cameras.filter(c=>c.status==='Offline').length}</div>
                    </div>
                    <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Com Defeito</div>
                        <div style="font-size:24px; font-weight:800; color:#f59e0b;">${AppState.cameras.filter(c=>c.status==='Defeito').length}</div>
                    </div>
                </div>

                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#1e40af; color:white;">
                            <th style="padding:12px; text-align:left; font-size:12px;">DATA/HORA</th>
                            <th style="padding:12px; text-align:left; font-size:12px;">TIPO</th>
                            <th style="padding:12px; text-align:left; font-size:12px;">LOCAL</th>
                            <th style="padding:12px; text-align:left; font-size:12px;">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(o => `
                            <tr style="border-bottom:1px solid #e2e8f0;">
                                <td style="padding:12px; font-size:13px;">${this.formatDate(o.occurrenceDate)} ${o.startTime}</td>
                                <td style="padding:12px; font-size:13px;">${o.type}</td>
                                <td style="padding:12px; font-size:13px;"><strong>${o.location}</strong></td>
                                <td style="padding:12px; font-size:13px;">${o.classification}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" style="text-align:center; padding:30px;">Nenhum registro no período.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        const preview = document.getElementById('reportPreview');
        if (preview) preview.innerHTML = html;

        if (action === 'print') {
            const win = window.open('', '_blank');
            win.document.write(`<html><head><title>Relatório HUC</title></head><body onload="window.print()">${html}</body></html>`);
            win.document.close();
        }
    },

    /**
     * UTILITÁRIOS
     */
    showTab(id) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        
        document.getElementById(id).classList.add('active');
        const tab = Array.from(document.querySelectorAll('.nav-tab')).find(t => t.getAttribute('onclick').includes(id));
        if (tab) tab.classList.add('active');

        if (id === 'camera-report') {
            this.renderNvrSelector();
            this.renderCameraGrid();
        }
        if (id === 'dashboard') this.drawCharts();
    },

    openModal(id) {
        document.getElementById(id).classList.add('show');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('show');
        if (id === 'occurrenceModal') {
            AppState.editingId = null;
            document.getElementById('occurrenceForm').reset();
        }
    },

    populateSelects() {
        const tSel = document.getElementById('type');
        const tFil = document.getElementById('typeFilter');
        const oSel = document.getElementById('operator');

        if (tSel) {
            tSel.innerHTML = '<option value="">Selecione o Tipo...</option>';
            AppState.config.types.forEach(t => tSel.innerHTML += `<option value="${t}">${t}</option>`);
        }
        if (tFil) {
            tFil.innerHTML = '<option value="">Todos os Tipos</option>';
            AppState.config.types.forEach(t => tFil.innerHTML += `<option value="${t}">${t}</option>`);
        }
        if (oSel) {
            oSel.innerHTML = '<option value="">Selecione o Operador...</option>';
            AppState.config.operators.forEach(o => oSel.innerHTML += `<option value="${o}">${o}</option>`);
        }
    },

    formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    },

    setElText(id, txt) {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    },

    showNotification(msg, type = 'success') {
        const n = document.createElement('div');
        n.style = `position:fixed; bottom:30px; right:30px; background:${type==='success'?'#10b981':'#f59e0b'}; color:white; padding:16px 24px; border-radius:12px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.2); z-index:9999; font-weight:600; animation:slideIn 0.3s ease-out;`;
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => {
            n.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => n.remove(), 300);
        }, 3000);
    },

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
};

// Injeção de Estilos de Animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    .content-section { display: none; }
    .content-section.active { display: block; animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);

// Funções globais para os botões do HTML
window.showTab = (id) => PremiumApp.showTab(id);
window.openNewOccurrenceModal = () => {
    document.getElementById('modalTitle').textContent = 'Registrar Ocorrência Premium';
    PremiumApp.openModal('occurrenceModal');
};
window.closeModal = (id) => PremiumApp.closeModal(id);
window.generateReport = (action) => PremiumApp.generateReport(action);
window.closeCameraModal = () => PremiumApp.closeModal('cameraStatusModal');
