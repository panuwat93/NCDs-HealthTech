document.addEventListener('DOMContentLoaded', () => {
    const loggedInUserStr = sessionStorage.getItem('loggedInUser');
    if (!loggedInUserStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(loggedInUserStr);

    // --- DOM Elements ---
    const userGreetingEl = document.getElementById('user-greeting');
    const currentDateEl = document.getElementById('current-date');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebar = document.querySelector('.sidebar');
    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    const closeBtn = document.querySelector('.close-btn');
    const contentContainer = document.getElementById('page-content');
    const menuLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const profilePicEl = document.getElementById('profile-pic');
    const profilePicUploadEl = document.getElementById('profile-pic-upload');

    // --- Initial Setup ---
    function initializeApp() {
        if (userGreetingEl) userGreetingEl.textContent = `สวัสดี, ${user.firstName}`;
        if (currentDateEl) {
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            currentDateEl.textContent = today.toLocaleDateString('th-TH', options);
        }

        menuToggleBtn?.addEventListener('click', () => sidebar.classList.toggle('open'));
        closeBtn?.addEventListener('click', () => sidebar.classList.remove('open'));
        logoutBtn?.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
        profilePicEl?.addEventListener('click', () => profilePicUploadEl.click());
        profilePicUploadEl?.addEventListener('change', handleProfilePicUpload);
        
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = e.target.closest('a').dataset.page;
                if (pageName) {
                    loadPage(pageName);
                    menuLinks.forEach(l => l.classList.remove('active'));
                    e.target.closest('a').classList.add('active');
                    if (window.innerWidth <= 768) sidebar.classList.remove('open');
                }
            });
        });
        
        loadProfilePicture();
        loadPage('home');
    }

    // --- Page Loading ---
    function loadPage(pageName) {
        const pageRenderers = {
            'home': renderHomePage,
            'ncds-list': renderNCDsListPage,
            'health-data': renderHealthDataPage,
            'bmi-calculator': renderBMIPage,
            'exercise-recommendations': renderExercisePage,
            'food-recommendations': renderFoodPage,
            'tracking-record': renderTrackingRecordPage,
            'emergency': renderEmergencyPage,
        };
        const renderer = pageRenderers[pageName] || renderHomePage;
        contentContainer.innerHTML = renderer();
        addPageEventListeners(pageName);
    }

    function addPageEventListeners(pageName) {
        const eventListeners = {
            'home': addHomePageEventListeners,
            'ncds-list': addNCDsPageEventListeners,
            'health-data': addHealthDataPageEventListeners,
            'bmi-calculator': addBMIPageEventListeners,
            'exercise-recommendations': addExercisePageEventListeners,
            'food-recommendations': addFoodPageEventListeners,
            'tracking-record': addTrackingRecordPageEventListeners,
        };
        const listener = eventListeners[pageName];
        if (listener) listener();
    }
    
    // --- Profile Picture ---
    async function handleProfilePicUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageDataUrl = e.target.result;
            try {
                await DBPut('userProfile', { username: user.username, pic: imageDataUrl });
                profilePicEl.src = imageDataUrl;
                alert('เปลี่ยนรูปโปรไฟล์สำเร็จ');
            } catch (error) {
                console.error('Failed to save profile picture:', error);
                alert('ไม่สามารถบันทึกรูปโปรไฟล์ได้');
            }
        };
        reader.readAsDataURL(file);
    }

    async function loadProfilePicture() {
        try {
            const profile = await DBGet('userProfile', user.username);
            if (profile && profile.pic) {
                profilePicEl.src = profile.pic;
            }
        } catch (error) {
            console.error('Failed to load profile picture:', error);
        }
    }

    // --- Page Render Functions ---
    function renderHomePage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-home"></i> หน้าหลัก</h2>
            </div>
            <div class="home-grid">
                <div class="welcome-card card">
                    <h3>ยินดีต้อนรับ!</h3>
                    <p><strong>SICU1 NCDs HealthTech</strong> พร้อมช่วยให้คุณติดตามสุขภาพและให้ความรู้เกี่ยวกับกลุ่มโรคไม่ติดต่อเรื้อรัง (NCDs) เพื่อการดูแลตนเองที่ดีขึ้น</p>
                    <p>กรุณาเลือกเมนูทางด้านซ้ายเพื่อเริ่มต้นใช้งาน</p>
                </div>
                <div class="news-feed-card card">
                    <h3><i class="fas fa-newspaper"></i> ข่าวสารล่าสุดเกี่ยวกับสุขภาพ</h3>
                    <div id="news-feed-container">
                        <p class="loading-news">กำลังโหลดข่าวสาร...</p>
                    </div>
                </div>
            </div>
            `;
    }

    // --- NCDs Page ---
    function renderNCDsListPage() {
        const listHtml = NCDsData.map(disease => `
            <div class="ncd-card" data-id="${disease.id}">
                <i class="${disease.icon}"></i>
                <h3>${disease.name}</h3>
                <p>คลิกเพื่อดูรายละเอียด</p>
            </div>
        `).join('');
        return `
            <div class="page-header">
                <h2><i class="fas fa-book-medical"></i> โรคไม่ติดต่อเรื้อรัง (NCDs)</h2>
                <p>เลือกหัวข้อโรคที่คุณสนใจเพื่อดูข้อมูลโดยละเอียด</p>
            </div>
            <div class="ncd-list">${listHtml}</div>`;
    }

    function renderNCDsDetailPage(diseaseId) {
        const disease = NCDsData.find(d => d.id === diseaseId);
        if (!disease) return;
        const detailHtml = `
            <div class="page-header">
                 <button class="btn-back" id="back-to-ncds-list"><i class="fas fa-arrow-left"></i> กลับไปที่รายการ</button>
                 <h2>${disease.name}</h2>
            </div>
            <div class="ncd-detail-content">
                <div class="detail-section"><h3><i class="fas fa-info-circle"></i> รายละเอียด</h3>${disease.details.description}</div>
                <div class="detail-section"><h3><i class="fas fa-exclamation-triangle"></i> ความเสี่ยง</h3>${disease.details.risk}</div>
                <div class="detail-section"><h3><i class="fas fa-shield-alt"></i> การป้องกัน</h3>${disease.details.prevention}</div>
                <div class="detail-section"><h3><i class="fas fa-hand-holding-medical"></i> การดูแล</h3>${disease.details.care}</div>
                <div class="detail-section"><h3><i class="fas fa-briefcase-medical"></i> การรักษา</h3>${disease.details.treatment}</div>
            </div>`;
        contentContainer.innerHTML = detailHtml;
        document.getElementById('back-to-ncds-list').addEventListener('click', () => loadPage('ncds-list'));
    }

    function addNCDsPageEventListeners() {
        document.querySelectorAll('.ncd-card').forEach(card => {
            card.addEventListener('click', () => {
                renderNCDsDetailPage(card.dataset.id);
            });
        });
    }

    // --- Health Data Page ---
    function renderHealthDataPage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-heart-pulse"></i> ข้อมูลสุขภาพ</h2>
                <p>ข้อมูลนี้จะช่วยให้แอปพลิเคชันแนะนำโปรแกรมที่เหมาะสมกับคุณได้ดียิ่งขึ้น</p>
            </div>
            <div class="form-container" id="health-form-container"><p>กำลังโหลดข้อมูล...</p></div>`;
    }

    async function addHealthDataPageEventListeners() {
        const container = document.getElementById('health-form-container');
        try {
            const healthData = await DBGet('healthProfile', user.username);
            renderHealthDataView(container, healthData);
        } catch (error) {
            container.innerHTML = `<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
        }
    }

    function renderHealthDataView(container, healthData) {
        const data = healthData || {};
        container.innerHTML = `
            <div class="health-data-view">
                <div class="data-item"><label>โรคประจำตัว:</label><p>${data.chronicDiseases || '-'}</p></div>
                <div class="data-item"><label>ประวัติการผ่าตัด:</label><p>${data.surgeryHistory || '-'}</p></div>
                <div class="data-item"><label>ประวัติการแพ้ยา:</label><p>${data.drugAllergies || '-'}</p></div>
                <div class="data-item"><label>ประวัติการแพ้อาหาร:</label><p>${data.foodAllergies || '-'}</p></div>
                <button id="edit-health-data-btn" class="button-primary">แก้ไขข้อมูล</button>
            </div>`;
        document.getElementById('edit-health-data-btn').addEventListener('click', () => renderHealthDataEdit(container, data));
    }
    
    function renderHealthDataEdit(container, healthData) {
        const data = healthData || {};
        container.innerHTML = `
            <form id="health-data-form">
                <div class="input-group"><label for="chronicDiseases">โรคประจำตัว (หากไม่มีให้ใส่ -)</label><textarea id="chronicDiseases" rows="3">${data.chronicDiseases || ''}</textarea></div>
                <div class="input-group"><label for="surgeryHistory">ประวัติการผ่าตัด (หากไม่มีให้ใส่ -)</label><textarea id="surgeryHistory" rows="3">${data.surgeryHistory || ''}</textarea></div>
                <div class="input-group"><label for="drugAllergies">ประวัติการแพ้ยา (หากไม่มีให้ใส่ -)</label><textarea id="drugAllergies" rows="3">${data.drugAllergies || ''}</textarea></div>
                <div class="input-group"><label for="foodAllergies">ประวัติการแพ้อาหาร (หากไม่มีให้ใส่ -)</label><textarea id="foodAllergies" rows="3">${data.foodAllergies || ''}</textarea></div>
                <div class="form-actions">
                    <button type="submit" class="button-primary">บันทึก</button>
                    <button type="button" id="cancel-edit-btn" class="button-secondary">ยกเลิก</button>
                </div>
            </form>`;

        document.getElementById('health-data-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedData = {
                username: user.username,
                chronicDiseases: document.getElementById('chronicDiseases').value.trim() || '-',
                surgeryHistory: document.getElementById('surgeryHistory').value.trim() || '-',
                drugAllergies: document.getElementById('drugAllergies').value.trim() || '-',
                foodAllergies: document.getElementById('foodAllergies').value.trim() || '-',
            };
            await DBPut('healthProfile', updatedData);
            alert('บันทึกข้อมูลสำเร็จ!');
            renderHealthDataView(container, updatedData);
        });
        document.getElementById('cancel-edit-btn').addEventListener('click', () => renderHealthDataView(container, data));
    }

    // --- BMI Page ---
    function renderBMIPage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-calculator"></i> คำนวณดัชนีมวลกาย (BMI)</h2>
                <p>กรอกข้อมูลเพื่อคำนวณ BMI และดูผลลัพธ์</p>
            </div>
            <div class="bmi-grid">
                <div class="form-container form-card">
                    <form id="bmi-form">
                        <div class="input-group">
                            <label for="weight">น้ำหนัก (กิโลกรัม)</label>
                            <input type="number" id="weight" step="0.1" required>
                        </div>
                        <div class="input-group">
                            <label for="height">ส่วนสูง (เซนติเมตร)</label>
                            <input type="number" id="height" required>
                        </div>
                        <button type="submit" class="button-primary">คำนวณ</button>
                    </form>
                </div>
                <div id="bmi-result-container" class="bmi-result-card card" style="display: none;">
                    <h3>ผลลัพธ์ BMI ของคุณ</h3>
                    <p class="bmi-value"></p>
                    <p class="bmi-category"></p>
                    <div class="bmi-interpretation"></div>
                </div>
            </div>`;
    }

    async function addBMIPageEventListeners() {
        const form = document.getElementById('bmi-form');
        const weightInput = document.getElementById('weight');
        const heightInput = document.getElementById('height');

        try {
            const trackingData = await DBGetAll('tracking');
            if (trackingData.length > 0) {
                const latestRecord = trackingData.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                if (latestRecord.weight) weightInput.value = latestRecord.weight;
                if (latestRecord.height) heightInput.value = latestRecord.height;
            }
        } catch (e) { console.error("Could not load latest tracking data for BMI"); }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            displayBMIResult(weightInput.value, heightInput.value);
        });
    }

    function displayBMIResult(weight, height) {
        const resultContainer = document.getElementById('bmi-result-container');
        if (!weight || !height || height <= 0) {
            resultContainer.style.display = 'none';
            return;
        }
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
        const details = getBMIDetails(bmi);

        resultContainer.querySelector('.bmi-value').textContent = `BMI: ${bmi}`;
        resultContainer.querySelector('.bmi-category').textContent = `เกณฑ์: ${details.category}`;
        resultContainer.querySelector('.bmi-interpretation').innerHTML = `<p>${details.interpretation}</p>`;
        resultContainer.querySelector('.bmi-category').style.color = details.color;
        resultContainer.style.display = 'block';
    }

    function getBMIDetails(bmi) {
        if (bmi < 18.5) return { category: 'น้ำหนักน้อย / ผอม', interpretation: 'ควรรับประทานอาหารที่มีคุณภาพและออกกำลังกายเพื่อเสริมสร้างกล้ามเนื้อ', color: '#3498db' };
        if (bmi >= 18.5 && bmi <= 22.9) return { category: 'ปกติ (สุขภาพดี)', interpretation: 'รักษาน้ำหนักและวิถีชีวิตเพื่อสุขภาพที่ดีต่อไป', color: '#2ecc71' };
        if (bmi >= 23 && bmi <= 24.9) return { category: 'ท้วม / น้ำหนักเกิน', interpretation: 'ควรควบคุมอาหารและเพิ่มการออกกำลังกายเพื่อลดความเสี่ยงต่อโรค', color: '#f1c40f' };
        if (bmi >= 25 && bmi <= 29.9) return { category: 'อ้วนระดับ 1', interpretation: 'มีความเสี่ยงต่อการเกิดโรคไม่ติดต่อเรื้อรัง ควรปรึกษาแพทย์หรือนักโภชนาการ', color: '#e67e22' };
        if (bmi >= 30) return { category: 'อ้วนระดับ 2 (อันตราย)', interpretation: 'มีความเสี่ยงสูงมากต่อการเกิดโรคร้ายแรง ควรปรึกษาแพทย์เพื่อรับการรักษาอย่างจริงจัง', color: '#e74c3c' };
        return { category: '', interpretation: '', color: '#000' };
    }

    function renderExercisePage() {
        const filtersHtml = exerciseTypes.map(type => `<button class="button-secondary" data-type="${type.type}">${type.name}</button>`).join('');
        return `
            <div class="page-header">
                <h2><i class="fas fa-dumbbell"></i> แนะนำการออกกำลังกาย</h2>
                <p>เลือกประเภทการออกกำลังกายที่คุณสนใจ</p>
            </div>
            <div id="exercise-filters">${filtersHtml}</div>
            <div id="exercise-list" class="exercise-grid"></div>`;
    }

    async function addExercisePageEventListeners() {
        const filtersContainer = document.getElementById('exercise-filters');
        const listContainer = document.getElementById('exercise-list');
        
        function renderList(filter = 'all') {
            const filteredData = filter === 'all' ? exerciseData : exerciseData.filter(ex => ex.type === filter);
            if (filteredData.length === 0) {
                listContainer.innerHTML = '<p>ไม่พบข้อมูลการออกกำลังกายในประเภทนี้</p>';
                return;
            }
            const listHtml = filteredData.map(ex => `
                <div class="exercise-card card" data-id="${ex.id}">
                    <div class="card-content">
                        <h3>${ex.name}</h3>
                        <div class="card-details">
                            <span><i class="fas fa-tag"></i> ${exerciseTypes.find(t => t.type === ex.type)?.name || ''}</span>
                            <span><i class="fas fa-clock"></i> ${ex.duration}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            listContainer.innerHTML = listHtml;

            document.querySelectorAll('.exercise-card').forEach(card => {
                card.addEventListener('click', () => {
                    const exercise = exerciseData.find(ex => ex.id === parseInt(card.dataset.id));
                    if (exercise) renderExerciseDetail(exercise);
                });
            });
        }

        function renderExerciseDetail(exercise) {
            const detailHtml = `
                <div class="page-header">
                    <button class="btn-back" id="back-to-exercise-list"><i class="fas fa-arrow-left"></i> กลับไปที่รายการ</button>
                    <h2>${exercise.name}</h2>
                </div>
                <div class="exercise-detail-content card">
                    <h3><i class="fas fa-bullseye"></i> ประโยชน์</h3>
                    <p>${exercise.benefits}</p>
                    <h3><i class="fas fa-walking"></i> ขั้นตอนการปฏิบัติ</h3>
                    <ol>${exercise.steps.map(step => `<li>${step}</li>`).join('')}</ol>
                </div>
            `;
            contentContainer.innerHTML = detailHtml;
            document.getElementById('back-to-exercise-list').addEventListener('click', () => loadPage('exercise-recommendations'));
        }

        filtersContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelectorAll('#exercise-filters button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderList(e.target.dataset.type);
            }
        });

        renderList('all'); // Initial render
        filtersContainer.querySelector('button[data-type="all"]')?.classList.add('active');
    }

    function renderFoodPage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-utensils"></i> แนะนำอาหาร</h2>
                <p>ตัวอย่างแผนอาหารเพื่อสุขภาพใน 1 สัปดาห์</p>
            </div>
            <div class="food-plan-header">
                <p>แผนอาหารนี้เป็นเพียงตัวอย่าง ควรปรับเปลี่ยนให้เหมาะสมกับความต้องการและข้อจำกัดของแต่ละบุคคล</p>
            </div>
            <div id="food-plan-container" class="food-plan-grid"></div>
        `;
    }

    async function addFoodPageEventListeners() {
        const container = document.getElementById('food-plan-container');
        const planHtml = foodData.map(day => `
            <div class="day-card card">
                <h4>${day.day}</h4>
                <div class="meal">
                    <span class="meal-type">เช้า:</span>
                    <p>${day.meals.breakfast}</p>
                </div>
                <div class="meal">
                    <span class="meal-type">กลางวัน:</span>
                    <p>${day.meals.lunch}</p>
                </div>
                <div class="meal">
                    <span class="meal-type">เย็น:</span>
                    <p>${day.meals.dinner}</p>
                </div>
            </div>
        `).join('');
        container.innerHTML = planHtml;
    }

    function renderTrackingRecordPage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-chart-line"></i> บันทึกการเปลี่ยนแปลง</h2>
                <p>บันทึกและติดตามข้อมูลสุขภาพของคุณ เช่น น้ำหนัก ส่วนสูง ความดันโลหิต และระดับน้ำตาลในเลือด</p>
            </div>
            <div class="tracking-grid">
                <div class="form-container-grid form-card card">
                     <h3>บันทึกข้อมูลวันนี้</h3>
                    <form id="tracking-form">
                        <div class="input-group">
                            <label for="track-date">วันที่</label>
                            <input type="date" id="track-date" required>
                        </div>
                        <div class="input-group">
                            <label for="track-weight">น้ำหนัก (kg)</label>
                            <input type="number" step="0.1" id="track-weight">
                        </div>
                        <div class="input-group">
                            <label for="track-height">ส่วนสูง (cm)</label>
                            <input type="number" step="0.1" id="track-height">
                        </div>
                        <div class="input-group">
                            <label for="track-bp">ความดันโลหิต (เช่น 120/80)</label>
                            <input type="text" id="track-bp" placeholder="ค่าบน/ค่าล่าง">
                        </div>
                        <div class="input-group">
                            <label for="track-glucose">ระดับน้ำตาลในเลือด (mg/dL)</label>
                            <input type="number" id="track-glucose">
                        </div>
                        <button type="submit" class="button-primary">บันทึก</button>
                    </form>
                </div>
                <div class="chart-card card">
                    <h3>กราฟติดตามผล</h3>
                    <div class="chart-controls">
                        <select id="chart-type">
                            <option value="weight">น้ำหนัก</option>
                            <option value="bp">ความดันโลหิต</option>
                            <option value="glucose">ระดับน้ำตาล</option>
                        </select>
                    </div>
                    <canvas id="tracking-chart"></canvas>
                    <div class="export-btn-container">
                        <button id="export-csv-btn" class="button-secondary">ส่งออกเป็น CSV</button>
                    </div>
                </div>
            </div>
            `;
    }

    function addTrackingRecordPageEventListeners() {
        document.getElementById('track-date').valueAsDate = new Date();
        const chartTypeSelect = document.getElementById('chart-type');

        document.getElementById('tracking-form').addEventListener('submit', saveTrackingRecord);
        chartTypeSelect.addEventListener('change', renderTrackingChart);
        document.getElementById('export-csv-btn').addEventListener('click', exportTrackingDataToCSV);

        renderTrackingChart();
    }

    async function saveTrackingRecord(event) {
        event.preventDefault();
        const record = {
            id: Date.now(),
            username: user.username,
            date: document.getElementById('track-date').value,
            weight: document.getElementById('track-weight').value || null,
            height: document.getElementById('track-height').value || null,
            bp: document.getElementById('track-bp').value || null,
            glucose: document.getElementById('track-glucose').value || null,
        };

        if (record.bp && !/^\d{2,3}\/\d{2,3}$/.test(record.bp)) {
            alert('รูปแบบความดันโลหิตไม่ถูกต้อง กรุณใช้รูปแบบ "ค่าบน/ค่าล่าง" เช่น 120/80');
            return;
        }

        try {
            await DBPut('tracking', record);
            alert('บันทึกข้อมูลสำเร็จ!');
            event.target.reset();
            document.getElementById('track-date').valueAsDate = new Date();
            renderTrackingChart();
        } catch (error) {
            console.error('Failed to save tracking record:', error);
            alert('ไม่สามารถบันทึกข้อมูลได้');
        }
    }
    
    let chartInstance = null;
    async function renderTrackingChart() {
        const chartType = document.getElementById('chart-type').value;
        const ctx = document.getElementById('tracking-chart').getContext('2d');
        const trackingData = (await DBGetAll('tracking')).filter(d => d.username === user.username).sort((a,b) => new Date(a.date) - new Date(b.date));

        if (chartInstance) {
            chartInstance.destroy();
        }

        let chartConfig = {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: false } }
            }
        };

        switch (chartType) {
            case 'weight':
                chartConfig.data.labels = trackingData.map(d => d.date);
                chartConfig.data.datasets.push({
                    label: 'น้ำหนัก (kg)',
                    data: trackingData.map(d => d.weight),
                    borderColor: '#3498db',
                    fill: false
                });
                break;
            case 'bp':
                chartConfig.data.labels = trackingData.filter(d => d.bp).map(d => d.date);
                chartConfig.data.datasets.push({
                    label: 'ความดัน (ตัวบน)',
                    data: trackingData.filter(d => d.bp).map(d => d.bp.split('/')[0]),
                    borderColor: '#e74c3c',
                    fill: false
                }, {
                    label: 'ความดัน (ตัวล่าง)',
                    data: trackingData.filter(d => d.bp).map(d => d.bp.split('/')[1]),
                    borderColor: '#f1c40f',
                    fill: false
                });
                break;
            case 'glucose':
                chartConfig.data.labels = trackingData.filter(d => d.glucose).map(d => d.date);
                chartConfig.data.datasets.push({
                    label: 'ระดับน้ำตาล (mg/dL)',
                    data: trackingData.filter(d => d.glucose).map(d => d.glucose),
                    borderColor: '#2ecc71',
                    fill: false
                });
                break;
        }
        chartInstance = new Chart(ctx, chartConfig);
    }

    async function exportTrackingDataToCSV() {
        const trackingData = (await DBGetAll('tracking')).filter(d => d.username === user.username);
        if (trackingData.length === 0) {
            alert('ไม่มีข้อมูลสำหรับส่งออก');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,Date,Weight (kg),Height (cm),Blood Pressure,Glucose (mg/dL)\n";
        trackingData.forEach(row => {
            csvContent += `${row.date},${row.weight || ''},${row.height || ''},"${row.bp || ''}",${row.glucose || ''}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "health_tracking_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // --- Emergency Page ---
    function renderEmergencyPage() {
        const listHtml = emergencyData.map(contact => `
            <div class="emergency-card">
                <i class="${contact.icon}"></i>
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    <a href="tel:${contact.phone}" class="contact-number">${contact.phone}</a>
                </div>
            </div>
        `).join('');
        return `
            <div class="page-header">
                <h2><i class="fas fa-phone-volume"></i> เบอร์โทรฉุกเฉิน</h2>
                <p>เบอร์โทรศัพท์ที่สำคัญสำหรับเหตุการณ์ฉุกเฉิน</p>
            </div>
            <div class="emergency-list">${listHtml}</div>`;
    }

    function addHomePageEventListeners() {
        fetchNCDsNews();
    }

    // --- News Feed ---
    async function fetchNCDsNews() {
        const newsContainer = document.getElementById('news-feed-container');
        if (!newsContainer) return;

        // Using a CORS proxy to fetch the WHO RSS feed
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const rssUrl = 'https://www.who.int/rss-feeds/news-english.xml';
        
        try {
            const response = await fetch(proxyUrl + rssUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const str = await response.text();
            const data = new window.DOMParser().parseFromString(str, "text/xml");
            const items = data.querySelectorAll("item");
            
            let html = ``;
            items.forEach((el, index) => {
                if (index >= 5) return; // Limit to 5 news items
                const title = el.querySelector("title").textContent;
                const link = el.querySelector("link").textContent;
                const pubDate = new Date(el.querySelector("pubDate").textContent).toLocaleDateString('th-TH');
                
                html += `
                    <div class="news-item">
                        <h4><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h4>
                        <p class="news-date">${pubDate}</p>
                    </div>
                `;
            });

            if (items.length === 0) {
                 newsContainer.innerHTML = '<p>ไม่พบข่าวสารในขณะนี้</p>';
                 return;
            }

            newsContainer.innerHTML = html;

        } catch (error) {
            console.error("Error fetching WHO news feed:", error);
            if (newsContainer) {
                newsContainer.innerHTML = `<p>ขออภัย, ไม่สามารถโหลดข่าวสารได้ในขณะนี้ กรุณาลองใหม่ในภายหลัง</p>`;
            }
        }
    }

    // --- Init ---
    initializeApp();
});