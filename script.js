/* ========================================
   SISTEMA DE VIDEOMONITORAMENTO HUC
   JavaScript - Lógica da Aplicação (V3 - Final)
   ======================================== */

// Dados Iniciais
let cameraStatus = [];
let currentNvr = 1;
let occurrences = [];
let editingId = null;

// Configurações
const occurrenceTypes = ['Movimento suspeito', 'Acesso não autorizado', 'Tentativa de furto', 'Furto consumado', 'Vandalismo', 'Violação de perímetro', 'Alarme disparado', 'Falha de equipamento', 'Apoio operacional', 'Acidente', 'Confusão', 'Outros'];
const operators = ['Wagner', 'Ernesto', 'Glaucia', 'Arnaldo'];

/**
 * INICIALIZAÇÃO DO SISTEMA
 */
function init() {
    console.log("Iniciando Sistema...");
    loadFromLocalStorage();
    initCameraData();
    updateTime();
    setInterval(updateTime, 1000);
    
    populateFilters();
    populateFormSelects();
    renderOccurrences();
    updateStats();
    drawCharts();
    
    // Configura o formulário de câmera via Event Listener robusto
    const camForm = document.getElementById('cameraStatusForm');
    if (camForm) {
        camForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveCameraStatus(e);
        });
    }

    // Configura o formulário de ocorrência
    const occForm = document.getElementById('occurrenceForm');
    if (occForm) {
        occForm.addEventListener('submit', saveOccurrence);
    }
}

/**
 * PERSISTÊNCIA DE DADOS (LocalStorage)
 */
function loadFromLocalStorage() {
    try {
        const savedOcc = localStorage.getItem('huc_occurrences');
        if (savedOcc) occurrences = JSON.parse(savedOcc);
        
        const savedCam = localStorage.getItem('huc_cameras');
        if (savedCam) cameraStatus = JSON.parse(savedCam);
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('huc_occurrences', JSON.stringify(occurrences));
        localStorage.setItem('huc_cameras', JSON.stringify(cameraStatus));
        console.log("Dados salvos com sucesso!");
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
        alert("Erro ao salvar dados no navegador!");
    }
}

/**
 * GESTÃO DE CÂMERAS
 */
function initCameraData() {
    // Se não houver dados, gera 288 câmeras (9 NVRs x 32 CAMs)
    if (cameraStatus.length === 0) {
        for (let n = 1; n <= 9; n++) {
            for (let c = 1; c <= 32; c++) {
                cameraStatus.push({
                    id: `NVR${n}-CAM${String(c).padStart(2, '0')}`,
                    nvr: n,
                    number: c,
                    status: 'Online',
                    observations: '',
                    lastUpdate: new Date().toISOString()
                });
            }
        }
        saveToLocalStorage();
    }
}

function renderNvrSelector() {
    const selector = document.getElementById('nvrSelector');
    if (!selector) return;
    selector.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = `nvr-btn ${i === currentNvr ? 'active' : ''}`;
        btn.textContent = `NVR ${i}`;
        btn.onclick = (e) => {
            e.preventDefault();
            currentNvr = i;
            renderNvrSelector();
            renderCameraGrid(i);
        };
        selector.appendChild(btn);
    }
}

function renderCameraGrid(nvrId) {
    const grid = document.getElementById('cameraGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const nvrCameras = cameraStatus.filter(c => c.nvr === nvrId);
    
    nvrCameras.forEach(cam => {
        const card = document.createElement('div');
        card.className = `camera-card ${cam.status.toLowerCase()}`;
        card.onclick = () => openCameraModal(cam.id);
        
        let obsIcon = cam.observations ? '<span class="camera-obs-icon" title="' + cam.observations + '">📝</span>' : '';
        
        card.innerHTML = `
            ${obsIcon}
            <span class="camera-nvr-label">NVR ${cam.nvr}</span>
            <span class="camera-number">CAM ${cam.number}</span>
            <span class="camera-status-indicator cam-status-${cam.status.toLowerCase()}"></span>
            <div style="font-size: 10px; margin-top: 5px; font-weight: 600;">${cam.status}</div>
        `;
        grid.appendChild(card);
    });
}

function openCameraModal(camId) {
    const cam = cameraStatus.find(c => c.id === camId);
    if (!cam) return;
    
    document.getElementById('cameraModalTitle').textContent = `Câmera ${cam.number} - NVR ${cam.nvr}`;
    document.getElementById('modalCamId').value = cam.id;
    document.getElementById('modalCamStatus').value = cam.status;
    document.getElementById('modalCamObs').value = cam.observations || '';
    
    document.getElementById('cameraStatusModal').classList.add('show');
}

function closeCameraModal() {
    document.getElementById('cameraStatusModal').classList.remove('show');
}

function saveCameraStatus(e) {
    if (e) e.preventDefault();
    
    const id = document.getElementById('modalCamId').value;
    const status = document.getElementById('modalCamStatus').value;
    const obs = document.getElementById('modalCamObs').value;
    
    console.log(`Tentando salvar câmera ${id} com status ${status}`);
    
    const index = cameraStatus.findIndex(c => c.id === id);
    if (index !== -1) {
        // Atualiza o objeto no array
        cameraStatus[index].status = status;
        cameraStatus[index].observations = obs;
        cameraStatus[index].lastUpdate = new Date().toISOString();
        
        // Salva IMEDIATAMENTE
        saveToLocalStorage();
        
        // Atualiza a interface
        renderCameraGrid(currentNvr);
        updateCameraStats();
        closeCameraModal();
        
        // Feedback visual
        showNotification("Status da câmera atualizado!");
    } else {
        console.error("Câmera não encontrada no array:", id);
    }
    return false;
}

function updateCameraStats() {
    const total = cameraStatus.length;
    const online = cameraStatus.filter(c => c.status === 'Online').length;
    const offline = cameraStatus.filter(c => c.status === 'Offline').length;
    const defective = cameraStatus.filter(c => c.status === 'Defeito').length;
    
    const elTotal = document.getElementById('totalCameras');
    const elOnline = document.getElementById('onlineCameras');
    const elOffline = document.getElementById('offlineCameras');
    const elDefective = document.getElementById('defectiveCameras');

    if (elTotal) elTotal.textContent = total;
    if (elOnline) elOnline.textContent = online;
    if (elOffline) elOffline.textContent = offline;
    if (elDefective) elDefective.textContent = defective;
}

/**
 * GESTÃO DE OCORRÊNCIAS
 */
function saveOccurrence(e) {
    e.preventDefault();
    
    const formData = {
        id: editingId || 'OC' + Date.now(),
        registrationDate: document.getElementById('registrationDate').value,
        occurrenceDate: document.getElementById('occurrenceDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        location: document.getElementById('location').value,
        camera: document.getElementById('camera').value,
        type: document.getElementById('type').value,
        classification: document.getElementById('classification').value,
        technicalDescription: document.getElementById('technicalDescription').value,
        actionTaken: document.getElementById('actionTaken').value,
        agenciesContacted: document.getElementById('agenciesContacted').value,
        operator: document.getElementById('operator').value,
        shift: document.getElementById('shift').value,
        observations: document.getElementById('observations').value
    };

    if (editingId) {
        const index = occurrences.findIndex(o => o.id === editingId);
        if (index !== -1) occurrences[index] = formData;
    } else {
        occurrences.push(formData);
    }

    saveToLocalStorage();
    renderOccurrences();
    updateStats();
    closeModal();
    showNotification("Ocorrência salva com sucesso!");
}

function editOccurrence(id) {
    const occ = occurrences.find(o => o.id === id);
    if (!occ) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Ocorrência';
    
    // Preenche campos
    Object.keys(occ).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = occ[key];
    });

    document.getElementById('occurrenceModal').classList.add('show');
}

function deleteOccurrence(id) {
    if (confirm('Deseja realmente apagar esta ocorrência?')) {
        occurrences = occurrences.filter(o => o.id !== id);
        saveToLocalStorage();
        renderOccurrences();
        updateStats();
        showNotification("Ocorrência apagada.");
    }
}

function renderOccurrences() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = getFilteredOccurrences();
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Nenhuma ocorrência.</td></tr>';
        return;
    }

    filtered.forEach(occ => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="expand-icon">▼</span></td>
            <td>${occ.occurrenceDate} ${occ.startTime}</td>
            <td>${occ.type}</td>
            <td>${occ.location}</td>
            <td><span class="status-${occ.classification.toLowerCase().replace(/\s+/g, '-')}">${occ.classification}</span></td>
            <td>${occ.operator}</td>
            <td>
                <button class="btn" onclick="editOccurrence('${occ.id}')">✏️</button>
                <button class="btn btn-danger" onclick="deleteOccurrence('${occ.id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getFilteredOccurrences() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const typeF = document.getElementById('typeFilter')?.value || '';
    const statusF = document.getElementById('statusFilter')?.value || '';

    return occurrences.filter(o => {
        const matchS = !search || o.location.toLowerCase().includes(search) || o.camera.toLowerCase().includes(search);
        const matchT = !typeF || o.type === typeF;
        const matchSt = !statusF || o.classification === statusF;
        return matchS && matchT && matchSt;
    });
}

/**
 * UTILITÁRIOS E UI
 */
function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    const activeTab = Array.from(document.querySelectorAll('.nav-tab')).find(t => t.innerText.toLowerCase().includes(tabId.replace('-',' ')));
    if (activeTab) activeTab.classList.add('active');

    if (tabId === 'camera-report') {
        renderNvrSelector();
        renderCameraGrid(currentNvr);
        updateCameraStats();
    }
    if (tabId === 'dashboard') drawCharts();
}

function updateTime() {
    const el = document.getElementById('currentTime');
    if (el) el.textContent = new Date().toLocaleString('pt-BR');
}

function populateFormSelects() {
    const typeSel = document.getElementById('type');
    const opSel = document.getElementById('operator');
    
    if (typeSel) {
        typeSel.innerHTML = '<option value="">Selecione...</option>';
        occurrenceTypes.forEach(t => typeSel.innerHTML += `<option value="${t}">${t}</option>`);
    }
    if (opSel) {
        opSel.innerHTML = '<option value="">Selecione...</option>';
        operators.forEach(o => opSel.innerHTML += `<option value="${o}">${o}</option>`);
    }
}

function populateFilters() {
    const typeF = document.getElementById('typeFilter');
    if (typeF) {
        typeF.innerHTML = '<option value="">Todos os tipos</option>';
        occurrenceTypes.forEach(t => typeF.innerHTML += `<option value="${t}">${t}</option>`);
    }
}

function updateStats() {
    const total = occurrences.length;
    const resolved = occurrences.filter(o => o.classification === 'Encerrada').length;
    document.getElementById('totalOccurrences').textContent = total;
    document.getElementById('resolvedCount').textContent = resolved;
    document.getElementById('pendingCount').textContent = total - resolved;
    document.getElementById('resolutionRate').textContent = (total > 0 ? Math.round((resolved/total)*100) : 0) + '%';
}

function showNotification(msg) {
    const div = document.createElement('div');
    div.style = "position: fixed; bottom: 20px; right: 20px; background: #059669; color: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 9999; animation: slideIn 0.3s ease;";
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.animation = "slideOut 0.3s ease";
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Estilos de animação para notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

/**
 * LÓGICA DE GRÁFICOS (Canvas Puro)
 */
function drawCharts() {
    console.log("Desenhando gráficos...");
    
    // Dados para Tipo de Ocorrência
    const typeData = {};
    occurrenceTypes.forEach(t => typeData[t] = 0);
    occurrences.forEach(o => { if(typeData[o.type] !== undefined) typeData[o.type]++; });
    
    // Dados para Status
    const statusData = {
        'Encerrada': occurrences.filter(o => o.classification === 'Encerrada').length,
        'Em andamento': occurrences.filter(o => o.classification === 'Em andamento').length
    };

    drawBarChart('typeChart', typeData, '#3b82f6');
    drawBarChart('statusChart', statusData, '#059669');
}

function drawBarChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const entries = Object.entries(data).filter(([_, val]) => val > 0);
    
    // Ajuste de resolução do canvas
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 250;
    
    if (entries.length === 0) {
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText("Sem dados para exibir", canvas.width/2, canvas.height/2);
        return;
    }

    const padding = 40;
    const barWidth = (canvas.width - padding * 2) / entries.length;
    const maxVal = Math.max(...entries.map(([_, v]) => v), 1);

    entries.forEach(([label, val], i) => {
        const barHeight = (val / maxVal) * (canvas.height - padding * 2);
        const x = padding + i * barWidth;
        const y = canvas.height - padding - barHeight;

        // Barra
        ctx.fillStyle = color;
        ctx.fillRect(x + 10, y, barWidth - 20, barHeight);

        // Valor
        ctx.fillStyle = "#1e3a8a";
        ctx.textAlign = "center";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(val, x + barWidth/2, y - 5);

        // Legenda
        ctx.fillStyle = "#64748b";
        ctx.font = "10px sans-serif";
        const shortLabel = label.length > 10 ? label.substring(0, 8) + "..." : label;
        ctx.fillText(shortLabel, x + barWidth/2, canvas.height - padding + 15);
    });
}

/**
 * SISTEMA DE RELATÓRIOS
 */
function generateReport(action) {
    const period = document.getElementById('reportPeriodSelect').value;
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') startDate.setHours(0,0,0,0);
    else if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const filteredOcc = occurrences.filter(o => new Date(o.occurrenceDate) >= startDate);
    
    const reportHTML = `
        <div id="printableReport" style="font-family: sans-serif; color: #1e293b;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; color: #1e3a8a; font-size: 20px;">RELATÓRIO DE MONITORAMENTO</h1>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Período: ${period.toUpperCase()} | Gerado em: ${now.toLocaleString('pt-BR')}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: bold;">HUC/ISGH</p>
                </div>
            </div>

            <h3 style="background: #f1f5f9; padding: 8px; border-left: 4px solid #3b82f6;">1. RESUMO EXECUTIVO</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">Total de Ocorrências: <strong>${filteredOcc.length}</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">Câmeras Online: <strong>${cameraStatus.filter(c => c.status === 'Online').length}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">Câmeras Offline: <strong style="color: #dc2626;">${cameraStatus.filter(c => c.status === 'Offline').length}</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">Com Defeito: <strong style="color: #d97706;">${cameraStatus.filter(c => c.status === 'Defeito').length}</strong></td>
                </tr>
            </table>

            <h3 style="background: #f1f5f9; padding: 8px; border-left: 4px solid #3b82f6;">2. DETALHAMENTO DAS OCORRÊNCIAS</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #1e3a8a; color: white;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Data/Hora</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Tipo</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Local</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Descrição</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredOcc.map(o => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${o.occurrenceDate} ${o.startTime}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${o.type}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${o.location}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${o.technicalDescription.substring(0, 100)}${o.technicalDescription.length > 100 ? '...' : ''}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhuma ocorrência registrada no período.</td></tr>'}
                </tbody>
            </table>

            <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8;">
                Relatório gerado automaticamente pelo Sistema de Videomonitoramento HUC.
            </div>
        </div>
    `;

    document.getElementById('reportPreview').innerHTML = reportHTML;

    if (action === 'print') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Relatório HUC</title></head><body>');
        printWindow.document.write(reportHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    } else if (action === 'download') {
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_${period}_${now.toISOString().split('T')[0]}.html`;
        a.click();
    }
}

function closeModal() {
    document.getElementById('occurrenceModal').classList.remove('show');
    editingId = null;
}

function openNewOccurrenceModal() {
    editingId = null;
    document.getElementById('occurrenceForm').reset();
    document.getElementById('modalTitle').textContent = 'Nova Ocorrência';
    document.getElementById('occurrenceModal').classList.add('show');
}

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', init);
