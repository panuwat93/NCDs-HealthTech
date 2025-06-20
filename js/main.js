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

        // Event Listeners
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
                    // Update active link
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
                <h2><i class="fas fa-calculator"></i> คำนวณ BMI</h2>
                <p>บันทึกน้ำหนักและส่วนสูงเพื่อคำนวณดัชนีมวลกายของคุณ</p>
            </div>
            <div class="bmi-grid">
                <div class="form-container">
                    <form id="bmi-form">
                        <div class="input-group">
                            <label for="height">ส่วนสูง (cm)</label>
                            <input type="number" id="height" required>
                        </div>
                        <div class="input-group">
                            <label for="weight">น้ำหนัก (kg)</label>
                            <input type="number" id="weight" step="0.1" required>
                        </div>
                        <button type="submit" class="button-primary">คำนวณและบันทึก</button>
                    </form>
                    <p id="bmi-notice" class="notice-message" style="display:none;">คุณสามารถบันทึกน้ำหนักได้วันละ 1 ครั้ง</p>
                </div>
                <div id="bmi-result-container"></div>
            </div>`;
    }

    async function addBMIPageEventListeners() {
        const form = document.getElementById('bmi-form');
        const heightInput = document.getElementById('height');
        const noticeEl = document.getElementById('bmi-notice');

        // Load last used height
        const lastBmiRecord = (await DBGetAll('bmiRecords')).filter(r => r.username === user.username).pop();
        if (lastBmiRecord && lastBmiRecord.height) {
            heightInput.value = lastBmiRecord.height;
        }

        // Check if already recorded today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = (await DBGetAll('bmiRecords')).find(r => r.username === user.username && r.date === todayStr);
        if (todayRecord) {
            form.querySelector('button').disabled = true;
            noticeEl.style.display = 'block';
            displayBMIResult(todayRecord.weight, todayRecord.height);
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const height = parseFloat(heightInput.value);
            const weight = parseFloat(document.getElementById('weight').value);
            const date = new Date().toISOString().split('T')[0];
            const record = { id: `${user.username}-${date}`, username: user.username, date, weight, height };
            
            await DBPut('bmiRecords', record);
            alert('บันทึกข้อมูล BMI สำเร็จ');
            displayBMIResult(weight, height);
            form.querySelector('button').disabled = true;
            noticeEl.style.display = 'block';
        });
    }

    function displayBMIResult(weight, height) {
        const bmi = weight / ((height / 100) ** 2);
        const { category, color, interpretation } = getBMIDetails(bmi);
        const resultContainer = document.getElementById('bmi-result-container');
        resultContainer.innerHTML = `
            <div class="bmi-result-card" style="border-top: 5px solid ${color};">
                <h3>ผลลัพธ์ BMI ของคุณ</h3>
                <div class="bmi-value" style="color: ${color};">${bmi.toFixed(2)}</div>
                <div class="bmi-category" style="background-color: ${color};">${category}</div>
                <div class="bmi-interpretation"><p>${interpretation}</p></div>
            </div>`;
    }

    function getBMIDetails(bmi) {
        if (bmi < 18.5) return { category: 'น้ำหนักน้อย', color: '#3498db', interpretation: 'คุณมีน้ำหนักตัวน้อยเกินไป ควรเพิ่มน้ำหนักด้วยการรับประทานอาหารที่มีประโยชน์และมีแคลอรี่สูงขึ้น' };
        if (bmi < 23) return { category: 'สมส่วน', color: '#2ecc71', interpretation: 'คุณมีน้ำหนักตัวที่เหมาะสม ดีแล้ว! รักษาน้ำหนักนี้ไว้ด้วยการทานอาหารที่ดีและออกกำลังกายสม่ำเสมอ' };
        if (bmi < 25) return { category: 'น้ำหนักเกิน', color: '#f1c40f', interpretation: 'คุณเริ่มมีน้ำหนักตัวเกิน ควรควบคุมอาหารและเพิ่มการออกกำลังกายเพื่อลดความเสี่ยงต่อโรคต่างๆ' };
        if (bmi < 30) return { category: 'โรคอ้วนระดับ 1', color: '#e67e22', interpretation: 'คุณอยู่ในภาวะอ้วนระดับที่ 1 ซึ่งมีความเสี่ยงต่อโรคเบาหวานและความดันโลหิตสูง ควรปรึกษาแพทย์เพื่อวางแผนลดน้ำหนัก' };
        return { category: 'โรคอ้วนระดับ 2', color: '#c0392b', interpretation: 'คุณอยู่ในภาวะอ้วนระดับอันตราย มีความเสี่ยงสูงมากต่อโรค NCDs ควรปรึกษาแพทย์หรือนักโภชนาการเพื่อลดน้ำหนักอย่างเร่งด่วน' };
    }

    // --- Exercise Page ---
    function renderExercisePage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-dumbbell"></i> แนะนำการออกกำลังกาย</h2>
                <p>โปรแกรมออกกำลังกายที่เหมาะสมสำหรับคุณโดยเฉพาะ</p>
            </div>
            <div id="exercise-content" class="exercise-list"><p>กำลังวิเคราะห์ข้อมูลและสร้างคำแนะนำ...</p></div>`;
    }

    async function addExercisePageEventListeners() {
        const container = document.getElementById('exercise-content');
        const filters = document.querySelectorAll('#exercise-filters input[type="checkbox"]');

        function renderList() {
            const selectedIntensities = Array.from(filters)
                .filter(cb => cb.checked && cb.name === 'intensity')
                .map(cb => cb.value);

            const filteredData = exerciseData.filter(ex => 
                selectedIntensities.length === 0 || selectedIntensities.includes(ex.intensity.toLowerCase())
            );

            if (filteredData.length === 0) {
                container.innerHTML = '<p>ไม่พบรายการออกกำลังกายที่ตรงกับเงื่อนไข</p>';
                return;
            }

            container.innerHTML = filteredData.map(ex => `
                <div class="exercise-card">
                    <div class="card-content">
                        <h3>${ex.name}</h3>
                        <p>${ex.description}</p>
                        <div class="card-details">
                            <span><strong>ประเภท:</strong> ${ex.category}</span>
                            <span><strong>ความหนัก:</strong> ${ex.intensity}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add click listeners to new cards
            document.querySelectorAll('.exercise-card').forEach((card, index) => {
                card.addEventListener('click', () => {
                    // Use the index to find the correct data from the *filtered* list
                    renderExerciseDetail(filteredData[index]);
                });
            });
        }

        function renderExerciseDetail(exercise) {
            const detailHtml = `
                <div class="page-header">
                    <button class="btn-back" id="back-to-exercise-list"><i class="fas fa-arrow-left"></i> กลับไปที่รายการ</button>
                    <h2>${exercise.name}</h2>
                </div>
                <div class="exercise-detail-content">
                    <p><strong>ประเภท:</strong> ${exercise.category} | <strong>ความหนัก:</strong> ${exercise.intensity}</p>
                    <p>${exercise.description}</p>
                    <h3><i class="fas fa-shoe-prints"></i> ขั้นตอนการปฏิบัติ</h3>
                    <ol>${exercise.steps.map(step => `<li>${step}</li>`).join('')}</ol>
                </div>`;
            document.getElementById('page-content').innerHTML = detailHtml;
            document.getElementById('back-to-exercise-list').addEventListener('click', () => loadPage('exercise-recommendations'));
        }

        filters.forEach(cb => cb.addEventListener('change', renderList));
        renderList();
    }

    // --- Food Page ---
    function renderFoodPage() {
        return `
           <div class="page-header">
               <h2><i class="fas fa-utensils"></i> แนะนำแผนอาหาร</h2>
               <p>แผนอาหารที่เหมาะสำหรับสุขภาพและเป้าหมายของคุณ</p>
           </div>
           <div id="food-content"><p>กำลังวิเคราะห์ข้อมูลและสร้างคำแนะนำ...</p></div>`;
    }

    async function addFoodPageEventListeners() {
        const contentEl = document.getElementById('food-content');
        try {
            const healthProfile = await DBGet('healthProfile', user.username);
            const allBmiRecords = await DBGetAll('bmiRecords');
            const userBmiRecords = allBmiRecords.filter(r => r.username === user.username).sort((a, b) => new Date(b.date) - new Date(a.date));
            const userTags = new Set(['all']);
            if (userBmiRecords.length > 0) {
                const bmi = userBmiRecords[0].weight / ((userBmiRecords[0].height / 100) ** 2);
                if (bmi >= 23) userTags.add('overweight');
                if (bmi >= 30) userTags.add('obese');
            }
            if (healthProfile && (healthProfile.chronicDiseases.includes('เบาหวาน') || healthProfile.chronicDiseases.includes('diabetes'))) {
                userTags.add('diabetes');
            }
            let recommendedPlan = foodData.find(p => p.targetGroups.some(g => g !== 'all' && userTags.has(g))) || foodData.find(p => p.targetGroups.includes('all'));
            if (recommendedPlan) {
                const daysOfWeek = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
                const planHtml = daysOfWeek.map(day => `
                    <div class="day-card">
                        <h4>${day}</h4>
                        <div class="meal"><span class="meal-type">เช้า:</span><p>${recommendedPlan.weeklyPlan[day]?.breakfast || '-'}</p></div>
                        <div class="meal"><span class="meal-type">กลางวัน:</span><p>${recommendedPlan.weeklyPlan[day]?.lunch || '-'}</p></div>
                        <div class="meal"><span class="meal-type">เย็น:</span><p>${recommendedPlan.weeklyPlan[day]?.dinner || '-'}</p></div>
                    </div>`).join('');
                contentEl.innerHTML = `
                    <div class="food-plan-header"><h3>${recommendedPlan.name}</h3><p>${recommendedPlan.description}</p></div>
                    <div class="food-plan-grid">${planHtml}</div>`;
            } else {
                 contentEl.innerHTML = '<p>ไม่พบแผนอาหารที่เหมาะสม</p>';
            }
        } catch (error) {
            console.error("Error loading food recommendations:", error);
            contentEl.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดคำแนะนำอาหาร</p>';
        }
    }

    // --- Tracking Record Page ---
    let trackingChart = null;
    function renderTrackingRecordPage() {
        const yearOptions = Array.from({length: 5}, (_, i) => `<option value="${new Date().getFullYear() - i}">${new Date().getFullYear() - i + 543}</option>`).join('');
        const monthOptions = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map((m, i) => `<option value="${i}">${m}</option>`).join('');
        return `
            <div class="page-header">
                <h2><i class="fas fa-chart-line"></i> บันทึกการเปลี่ยนแปลง</h2>
                <p>ติดตามการเปลี่ยนแปลงของร่างกายและดูแนวโน้ม</p>
            </div>
            <div class="form-container-grid">
                <div class="form-card">
                    <h3><i class="fas fa-edit"></i> ลงบันทึกวันนี้</h3>
                    <form id="tracking-form">
                        <div class="form-group"><label for="record-date">วันที่</label><input type="date" id="record-date" required></div>
                        <div class="form-group"><label for="record-weight">น้ำหนัก (kg)</label><input type="number" id="record-weight" step="0.1" required placeholder="เช่น 65.5"></div>
                        <div class="form-group"><label for="record-chest">รอบอก (cm)</label><input type="number" id="record-chest" step="0.1" placeholder="เช่น 90"></div>
                        <div class="form-group"><label for="record-waist">รอบเอว (cm)</label><input type="number"id="record-waist" step="0.1" placeholder="เช่น 80"></div>
                        <button type="submit" class="button-primary">บันทึกข้อมูล</button>
                    </form>
                </div>
                <div class="chart-card">
                    <h3><i class="fas fa-history"></i> ดูประวัติย้อนหลัง</h3>
                     <div class="chart-controls">
                        <div class="form-group"><label for="month-select">เลือกเดือน:</label><select id="month-select">${monthOptions}</select></div>
                        <div class="form-group"><label for="year-select">เลือกปี:</label><select id="year-select">${yearOptions}</select></div>
                    </div>
                    <canvas id="tracking-chart"></canvas>
                    <button id="export-csv-btn" class="button-secondary"><i class="fas fa-file-csv"></i> ส่งออกข้อมูลเป็น CSV</button>
                </div>
            </div>`;
    }

    function addTrackingRecordPageEventListeners() {
        document.getElementById('record-date').valueAsDate = new Date();
        document.getElementById('tracking-form').addEventListener('submit', saveTrackingRecord);
        document.getElementById('month-select').addEventListener('change', renderTrackingChart);
        document.getElementById('year-select').addEventListener('change', renderTrackingChart);
        document.getElementById('export-csv-btn').addEventListener('click', exportTrackingDataToCSV);
        const today = new Date();
        document.getElementById('month-select').value = today.getMonth();
        document.getElementById('year-select').value = today.getFullYear();
        renderTrackingChart();
    }

    async function saveTrackingRecord(event) {
        event.preventDefault();
        const date = document.getElementById('record-date').value;
        const record = {
            id: `${user.username}-${date}`,
            username: user.username,
            date,
            weight: parseFloat(document.getElementById('record-weight').value),
            chest: document.getElementById('record-chest').value ? parseFloat(document.getElementById('record-chest').value) : null,
            waist: document.getElementById('record-waist').value ? parseFloat(document.getElementById('record-waist').value) : null,
        };
        try {
            await DBPut('trackingRecords', record);
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            event.target.reset();
            document.getElementById('record-date').valueAsDate = new Date();
            await renderTrackingChart();
        } catch (error) {
            alert('ไม่สามารถบันทึกซ้ำในวันเดียวกันได้ หรือเกิดข้อผิดพลาดอื่น');
        }
    }
    
    async function renderTrackingChart() {
        const month = parseInt(document.getElementById('month-select').value);
        const year = parseInt(document.getElementById('year-select').value);
        const ctx = document.getElementById('tracking-chart').getContext('2d');
        const allRecords = await DBGetAll('trackingRecords');
        const userRecords = allRecords.filter(r => r.username === user.username && new Date(r.date).getFullYear() === year && new Date(r.date).getMonth() === month).sort((a, b) => new Date(a.date) - new Date(b.date));
        if (trackingChart) trackingChart.destroy();
        trackingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: userRecords.map(r => new Date(r.date).getDate()),
                datasets: [
                    { label: 'น้ำหนัก (kg)', data: userRecords.map(r => r.weight), borderColor: '#4CAF50', yAxisID: 'y', tension: 0.1 },
                    { label: 'รอบอก (cm)', data: userRecords.map(r => r.chest), borderColor: '#FFC107', yAxisID: 'y1', tension: 0.1, hidden: true },
                    { label: 'รอบเอว (cm)', data: userRecords.map(r => r.waist), borderColor: '#2196F3', yAxisID: 'y1', tension: 0.1, hidden: true }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: `ข้อมูลประจำเดือน ${document.getElementById('month-select').options[month].text} ปี ${year + 543}` } },
                scales: {
                    y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'น้ำหนัก (kg)' } },
                    y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'ขนาด (cm)' }, grid: { drawOnChartArea: false } },
                }
            }
        });
    }
    
    async function exportTrackingDataToCSV() {
        const allRecords = await DBGetAll('trackingRecords');
        const userRecords = allRecords.filter(r => r.username === user.username).sort((a, b) => new Date(a.date) - new Date(b.date));
        if (userRecords.length === 0) return alert('ไม่พบข้อมูลสำหรับส่งออก');
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + "วันที่,น้ำหนัก (kg),รอบอก (cm),รอบเอว (cm)\r\n";
        userRecords.forEach(r => csvContent += `${r.date},${r.weight || ''},${r.chest || ''},${r.waist || ''}\r\n`);
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `tracking_data_${user.username}.csv`);
        link.click();
    }

    // --- Emergency Page ---
    function renderEmergencyPage() {
        const contactsHtml = emergencyContacts.map(contact => `
            <div class="emergency-card">
                <i class="${contact.icon}"></i>
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    <a href="tel:${contact.number}" class="contact-number">${contact.number}</a>
                </div>
            </div>`).join('');
        return `
            <div class="page-header">
                <h2><i class="fas fa-phone-volume"></i> เบอร์โทรฉุกเฉิน</h2>
                <p>รวมเบอร์โทรศัพท์ที่สำคัญสำหรับเหตุฉุกเฉิน</p>
            </div>
            <div class="emergency-list">${contactsHtml}</div>`;
    }

    async function fetchNCDsNews() {
        const newsContainer = document.getElementById('news-feed-container');
        if (!newsContainer) return;

        // Switched to a more reliable proxy service
        const RSS_URL = 'https://www.who.int/rss-feeds/news-rss.xml';
        const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Adapted for the new service's response format
            if (data && data.status === 'ok' && data.items) {
                const articles = data.items.slice(0, 5); // Get latest 5 articles
                let articlesHtml = articles.map(article => {
                    // Sanitize description and limit length
                    const description = (article.description || '').replace(/<[^>]*>/g, "").substring(0, 120);
                    return `
                    <div class="news-article">
                        <h4><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></h4>
                        <p class="news-description">${description}...</p>
                        <div class="news-footer">
                            <span>${new Date(article.pubDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="read-more">อ่านต่อ <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                `}).join('');
                newsContainer.innerHTML = articlesHtml;
            } else {
                throw new Error('Could not fetch news from source. Invalid format.');
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
            newsContainer.innerHTML = '<p>ขออภัย, ไม่สามารถโหลดข่าวสารได้ในขณะนี้</p>';
        }
    }

    function addHomePageEventListeners() {
        fetchNCDsNews();
    }

    // --- Run App ---
    initializeApp();
}); 