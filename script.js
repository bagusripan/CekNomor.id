// ===== VARIABLES GLOBAL =====
let scanHistory = JSON.parse(localStorage.getItem('scanHistory')) || [];

// ===== ELEMENTS =====
const phoneInput = document.getElementById('phoneInput');
const scanBtn = document.getElementById('scanBtn');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const resultNumber = document.getElementById('resultNumber');
const scanTime = document.getElementById('scanTime');
const historyList = document.getElementById('historyList');
const historySection = document.getElementById('historySection');
const modal = document.getElementById('resultModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');
const modalBtn = document.querySelector('.modal-btn');

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    // Tampilkan riwayat jika ada
    if (scanHistory.length > 0) {
        renderHistory();
        historySection.style.display = 'block';
    }
    
    // Format nomor otomatis
    phoneInput.addEventListener('input', formatPhoneNumber);
    
    // Scan button click
    scanBtn.addEventListener('click', startScan);
    
    // Enter key untuk scan
    phoneInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startScan();
    });
    
    // Modal events
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    modalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Action buttons
    setupActionButtons();
});

// ===== FUNCTIONS =====

// Format nomor telepon otomatis
function formatPhoneNumber() {
    let value = phoneInput.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        // Format: 812-3456-7890
        if (value.length <= 3) {
            value = value;
        } else if (value.length <= 7) {
            value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
        } else {
            value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
        }
    }
    
    phoneInput.value = value;
}

// Mulai proses scanning
function startScan() {
    const rawNumber = phoneInput.value.replace(/\D/g, '');
    
    // Validasi input
    if (!rawNumber || rawNumber.length < 10 || rawNumber.length > 13) {
        showError('Nomor telepon tidak valid. Masukkan 10-13 digit angka.');
        return;
    }
    
    // Format nomor untuk display
    const formattedNumber = formatForDisplay(rawNumber);
    resultNumber.textContent = formattedNumber;
    scanTime.textContent = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Tampilkan loader, sembunyikan hasil lama
    loader.style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Simulasi proses scan (2-3 detik)
    setTimeout(() => {
        loader.style.display = 'none';
        resultsSection.style.display = 'block';
        
        // Generate hasil scan
        const scanResults = generateScanResults(rawNumber);
        
        // Render hasil
        renderResults(scanResults);
        
        // Simpan ke riwayat
        saveToHistory(rawNumber, formattedNumber, scanResults.overallRisk);
        
        // Tampilkan modal peringatan jika berisiko tinggi
        if (scanResults.overallRisk === 'high') {
            showWarningModal(scanResults);
        }
        
        // Scroll ke hasil
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    }, 2000 + Math.random() * 1000); // Random delay 2-3 detik
}

// Format nomor untuk display
function formatForDisplay(number) {
    const cleaned = number.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.startsWith('62')) {
        return '+62 ' + cleaned.substring(2).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.startsWith('8')) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    
    return cleaned;
}

// Generate hasil scan berdasarkan algoritma
function generateScanResults(phoneNumber) {
    const lastDigit = parseInt(phoneNumber.slice(-1));
    const firstThree = phoneNumber.slice(0, 3);
    
    // Algoritma penentuan risiko
    let riskScore = 0;
    
    // Cek berdasarkan digit terakhir
    if ([0, 4, 7].includes(lastDigit)) riskScore += 2;
    if ([1, 3, 8].includes(lastDigit)) riskScore += 1;
    
    // Cek pola nomor (contoh sederhana)
    if (phoneNumber.match(/(\d)\1{2,}/)) riskScore += 2; // Angka berulang
    if (phoneNumber.match(/1234|5678|4321/)) riskScore += 1; // Urutan angka
    
    // Random faktor untuk membuat hasil lebih natural
    const randomFactor = Math.random();
    if (randomFactor > 0.7) riskScore += 1;
    if (randomFactor < 0.3) riskScore -= 1;
    
    // Tentukan level risiko
    let overallRisk, riskLabel, riskClass;
    if (riskScore >= 4) {
        overallRisk = 'high';
        riskLabel = 'TINGGI';
        riskClass = 'risk-high';
    } else if (riskScore >= 2) {
        overallRisk = 'medium';
        riskLabel = 'SEDANG';
        riskClass = 'risk-medium';
    } else {
        overallRisk = 'low';
        riskLabel = 'RENDAH';
        riskClass = 'risk-low';
    }
    
    // Generate detail hasil
    return {
        overallRisk,
        riskLabel,
        riskClass,
        details: [
            {
                id: 'provider',
                title: 'Provider & Format',
                icon: 'fas fa-sim-card',
                content: 'Nomor valid. Terdeteksi menggunakan layanan seluler utama Indonesia.',
                risk: 'safe',
                riskText: 'AMAN'
            },
            {
                id: 'reports',
                title: 'Laporan Komunitas',
                icon: 'fas fa-users',
                content: overallRisk === 'high' 
                    ? 'Terdapat beberapa laporan dari pengguna tentang nomor ini dalam 3 bulan terakhir.' 
                    : 'Tidak ada laporan penipuan dari komunitas sejauh ini.',
                risk: overallRisk,
                riskText: overallRisk === 'high' ? 'WASPADA' : 'AMAN'
            },
            {
                id: 'activity',
                title: 'Aktivitas Online',
                icon: 'fas fa-globe',
                content: randomFactor > 0.5 
                    ? 'Aktif di beberapa platform marketplace dan media sosial.' 
                    : 'Aktivitas online terbatas. Kemungkinan nomor pribadi.',
                risk: 'medium',
                riskText: 'NORMAL'
            },
            {
                id: 'recommendation',
                title: 'Rekomendasi',
                icon: 'fas fa-handshake',
                content: overallRisk === 'high'
                    ? 'Disarankan untuk tidak merespons atau menghubungi kembali. Laporkan jika menerima pesan mencurigakan.'
                    : 'Bisa dihubungi dengan normal. Tetap jaga kerahasiaan data pribadi.',
                risk: overallRisk,
                riskText: overallRisk === 'high' ? 'HATI-HATI' : 'NORMAL'
            }
        ]
    };
}

// Render hasil ke HTML
function renderResults(scanResults) {
    resultsContainer.innerHTML = '';
    
    scanResults.details.forEach(detail => {
        const card = document.createElement('div');
        card.className = `result-card ${detail.risk}`;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon">
                    <i class="${detail.icon}"></i>
                </div>
                <div>
                    <div class="card-title">${detail.title}</div>
                    <span class="risk-level ${scanResults.riskClass}">${detail.riskText}</span>
                </div>
            </div>
            <p>${detail.content}</p>
        `;
        
        resultsContainer.appendChild(card);
    });
    
    // Update overall risk display
    const overallRiskElement = document.createElement('div');
    overallRiskElement.className = `risk-level ${scanResults.riskClass}`;
    overallRiskElement.style.cssText = `
        font-size: 1.2rem;
        padding: 10px 25px;
        margin-top: 20px;
        display: inline-block;
    `;
    overallRiskElement.textContent = `RISIKO ${scanResults.riskLabel}`;
    
    resultsContainer.insertAdjacentElement('afterend', overallRiskElement);
}

// Simpan ke riwayat
function saveToHistory(rawNumber, formattedNumber, riskLevel) {
    const historyItem = {
        id: Date.now(),
        number: rawNumber,
        formatted: formattedNumber,
        risk: riskLevel,
        timestamp: new Date().toISOString(),
        timeDisplay: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        dateDisplay: new Date().toLocaleDateString('id-ID')
    };
    
    // Tambahkan ke awal array
    scanHistory.unshift(historyItem);
    
    // Simpan maksimal 10 item
    if (scanHistory.length > 10) {
        scanHistory = scanHistory.slice(0, 10);
    }
    
    // Simpan ke localStorage
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    
    // Update tampilan riwayat
    renderHistory();
    historySection.style.display = 'block';
}

// Render riwayat
function renderHistory() {
    if (scanHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clock"></i>
                <p>Belum ada riwayat pengecekan</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = scanHistory.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div>
                <div class="history-number">${item.formatted}</div>
                <div class="history-time">${item.dateDisplay} ${item.timeDisplay}</div>
            </div>
            <span class="history-status ${getRiskClass(item.risk)}">
                ${getRiskLabel(item.risk)}
            </span>
        </div>
    `).join('');
    
    // Tambahkan event listener untuk klik riwayat
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const historyItem = scanHistory.find(h => h.id === id);
            if (historyItem) {
                phoneInput.value = historyItem.number.replace(/\D/g, '');
                formatPhoneNumber();
                startScan();
            }
        });
    });
}

// Helper functions untuk risk
function getRiskClass(risk) {
    switch(risk) {
        case 'high': return 'risk-high';
        case 'medium': return 'risk-medium';
        case 'low': return 'risk-low';
        default: return '';
    }
}

function getRiskLabel(risk) {
    switch(risk) {
        case 'high': return 'Tinggi';
        case 'medium': return 'Sedang';
        case 'low': return 'Rendah';
        default: return 'Unknown';
    }
}

// Setup action buttons
function setupActionButtons() {
    // Report button
    document.querySelector('.report-btn').addEventListener('click', function() {
        if (phoneInput.value) {
            showModal(
                'Laporkan Nomor',
                `Apakah Anda yakin ingin melaporkan nomor <strong>${resultNumber.textContent}</strong>?<br><br>
                Laporan Anda akan membantu komunitas untuk lebih waspada.`,
                'Laporkan'
            );
        } else {
            showError('Masukkan nomor terlebih dahulu.');
        }
    });
    
    // Save button
    document.querySelector('.save-btn').addEventListener('click', function() {
        if (resultsSection.style.display === 'block') {
            // Simpan sebagai screenshot (simulasi)
            showModal(
                'Simpan Hasil',
                'Hasil pengecekan telah disimpan ke riwayat.<br>Anda dapat melihatnya kapan saja di bagian Riwayat.',
                'Mengerti'
            );
        }
    });
    
    // Share button
    document.querySelector('.share-btn').addEventListener('click', function() {
        if (resultsSection.style.display === 'block') {
            if (navigator.share) {
                navigator.share({
                    title: 'Hasil Cek Nomor',
                    text: `Saya baru mengecek nomor ${resultNumber.textContent} di CekNomor.id`,
                    url: window.location.href
                });
            } else {
                showModal(
                    'Bagikan Hasil',
                    'Salin link ini untuk berbagi hasil pengecekan:',
                    'Salin Link'
                );
            }
        }
    });
}

// Tampilkan modal peringatan
function showWarningModal(scanResults) {
    modalBody.innerHTML = `
        <p>Nomor <strong>${resultNumber.textContent}</strong> memiliki risiko <span class="${scanResults.riskClass}">${scanResults.riskLabel}</span>.</p>
        <br>
        <p><i class="fas fa-exclamation-circle"></i> <strong>Rekomendasi:</strong></p>
        <ul style="margin-top: 10px; padding-left: 20px;">
            <li>Jangan berikan informasi pribadi apapun</li>
            <li>Jangan mengklik link dari nomor ini</li>
            <li>Blokir jika menerima pesan mencurigakan</li>
            <li>Laporkan ke WhatsApp jika perlu</li>
        </ul>
    `;
    
    modal.style.display = 'flex';
}

// Tampilkan modal umum
function showModal(title, content, buttonText) {
    modalBody.innerHTML = `
        <h3><i class="fas fa-info-circle"></i> ${title}</h3>
        <p>${content}</p>
    `;
    
    modalBtn.textContent = buttonText;
    modal.style.display = 'flex';
}

// Tampilkan error
function showError(message) {
    modalBody.innerHTML = `
        <h3><i class="fas fa-exclamation-triangle"></i> Oops!</h3>
        <p>${message}</p>
    `;
    
    modalBtn.textContent = 'Mengerti';
    modal.style.display = 'flex';
}

// ===== INITIALIZATION =====
// Contoh data awal untuk demo
if (scanHistory.length === 0) {
    // Tambahkan beberapa contoh riwayat untuk demo
    scanHistory = [
        {
            id: 1,
            number: '08123456789',
            formatted: '0812-3456-789',
            risk: 'low',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 hari lalu
            timeDisplay: '10:30',
            dateDisplay: 'Kemarin'
        },
        {
            id: 2,
            number: '085711223344',
            formatted: '0857-1122-3344',
            risk: 'medium',
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 hari lalu
            timeDisplay: '14:45',
            dateDisplay: '2 hari lalu'
        }
    ];
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
}