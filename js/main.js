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
            console.error('Failed to load profile picture due to a database error:', error);
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
            // If data exists, render view. Otherwise, render the edit form directly.
            if (healthData) {
                renderHealthDataView(container, healthData);
            } else {
                renderHealthDataEdit(container, {});
            }
        } catch (error) {
            console.error("Error loading health data, showing edit form.", error);
            // If any error occurs, default to showing the edit form.
            renderHealthDataEdit(container, {});
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
            <div class="form-container">
                <form id="bmi-form">
                    <div class="input-group">
                        <label for="weight">น้ำหนัก (กิโลกรัม)</label>
                        <input type="number" id="weight" placeholder="เช่น 60.5" step="0.1" required>
                    </div>
                    <div class="input-group">
                        <label for="height">ส่วนสูง (เซนติเมตร)</label>
                        <input type="number" id="height" placeholder="เช่น 170" required>
                    </div>
                    <button type="submit" class="button-primary" id="bmi-submit-btn">คำนวณ BMI</button>
                </form>
                <div id="bmi-result" class="bmi-result-container" style="display:none;"></div>
            </div>`;
    }

    async function addBMIPageEventListeners() {
        const form = document.getElementById('bmi-form');
        const resultDiv = document.getElementById('bmi-result');
        
        const todayStr = new Date().toISOString().split('T')[0];
        try {
            const lastRecord = await DBGet('bmiRecords', user.username);
            if (lastRecord && lastRecord.date === todayStr) {
                displayBMIResult(lastRecord.bmi, resultDiv);
                form.style.display = 'none';
            }
        } catch (error) {
            console.log("No previous BMI record for today.");
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value);
            if (isNaN(weight) || isNaN(height) || height <= 0) {
                alert('กรุณากรอกข้อมูลให้ถูกต้อง');
                return;
            }
            const bmi = weight / ((height / 100) ** 2);
            
            await DBPut('bmiRecords', { username: user.username, bmi: bmi, date: todayStr });
            
            displayBMIResult(bmi, resultDiv);
            form.style.display = 'none';
        });
    }

    function displayBMIResult(bmi, container) {
        const result = getBMIDetails(bmi);
        container.innerHTML = `
            <h3>ผลลัพธ์ BMI ของคุณ</h3>
            <p class="bmi-value" style="color:${result.color};">${bmi.toFixed(2)}</p>
            <p class="bmi-category" style="color:${result.color};"><strong>${result.category}</strong></p>
            <p class="bmi-advice">${result.advice}</p>
        `;
        container.style.display = 'block';
    }

    function getBMIDetails(bmi) {
        if (bmi < 18.5) return { key: 'underweight', category: 'น้ำหนักน้อยกว่าเกณฑ์', advice: 'ควรรับประทานอาหารที่มีประโยชน์และออกกำลังกายเพื่อเสริมสร้างกล้ามเนื้อ', color: '#3498db' };
        if (bmi < 23) return { key: 'normal', category: 'น้ำหนักปกติ', advice: 'เยี่ยมมาก! รักษาน้ำหนักและรูปแบบการใช้ชีวิตที่ดีต่อไป', color: '#2ecc71' };
        if (bmi < 25) return { key: 'overweight', category: 'น้ำหนักเกิน (ท้วม)', advice: 'ควรควบคุมอาหารและเพิ่มการออกกำลังกายเพื่อลดความเสี่ยงต่อโรค', color: '#f39c12' };
        if (bmi < 30) return { key: 'obese1', category: 'โรคอ้วนระดับที่ 1', advice: 'มีความเสี่ยงต่อโรคเบาหวานและความดันโลหิตสูง ควรปรึกษาแพทย์หรือนักโภชนาการ', color: '#e67e22' };
        return { key: 'obese2', category: 'โรคอ้วนระดับที่ 2', advice: 'มีความเสี่ยงสูงต่อโรคต่างๆ ควรปรึกษาแพทย์เพื่อรับการดูแลอย่างใกล้ชิด', color: '#c0392b' };
    }

    // --- BMI Dependent Recommendations Data ---

    const exerciseRecommendationsByBMI = {
        underweight: ['ex03', 'ex02'],
        normal: ['ex01', 'ex02', 'ex03', 'ex04'],
        overweight: ['ex01', 'ex04', 'ex02'],
        obese1: ['ex01', 'ex04'],
        obese2: ['ex01', 'ex04']
    };

    const foodPlansByBMI = {
        underweight: {
            name: 'แผนเพิ่มน้ำหนักอย่างมีคุณภาพ',
            meals: [
                { day: 'จันทร์', breakfast: 'ข้าวต้มปลา + ไข่ลวก 2 ฟอง', lunch: 'ข้าว + แกงจืดเต้าหู้หมูสับ + ผลไม้', dinner: 'สเต็กไก่ + สลัดผัก' },
                { day: 'อังคาร', breakfast: 'โจ๊กหมูใส่ไข่', lunch: 'ก๋วยเตี๋ยวไก่ + เพิ่มเนื้อ', dinner: 'ข้าว + ผัดผักรวมมิตรใส่ไก่' },
                { day: 'พุธ', breakfast: 'แซนด์วิชทูน่าโฮลวีท', lunch: 'ข้าวผัดหมู + ไข่ดาว', dinner: 'ข้าว + ต้มยำปลา' },
                { day: 'พฤหัสบดี', breakfast: 'นม + กล้วยหอม + ขนมปังโฮลวีท', lunch: 'ข้าว + พะแนงไก่ + ผัดบรอกโคลี', dinner: 'สุกี้น้ำ' },
                { day: 'ศุกร์', breakfast: 'ข้าวเหนียวหมูปิ้ง', lunch: 'ข้าวราดแกงกะหรี่ไก่', dinner: 'ข้าว + แกงส้มชะอมไข่' },
                { day: 'เสาร์', breakfast: 'ไข่กระทะ', lunch: 'ข้าวมันไก่ (เลี่ยงหนัง)', dinner: 'ปลาเผา + ผักสด' },
                { day: 'อาทิตย์', breakfast: 'ซีเรียลโฮลเกรน + นม + ผลไม้', lunch: 'อาหารตามสั่ง (เลือกเมนูผัด/ต้ม)', dinner: 'หมูกระทะ (เน้นผักและเนื้อไม่ติดมัน)' }
            ]
        },
        normal: {
            name: 'แผนรักษาสมดุลสุขภาพดี',
            meals: [
                { day: 'จันทร์', breakfast: 'ข้าวกล้อง + ต้มเลือดหมู', lunch: 'สลัดอกไก่ + ธัญพืช', dinner: 'ข้าวกล้าย + แกงจืดวุ้นเส้น' },
                { day: 'อังคาร', breakfast: 'โยเกิร์ต + ผลไม้รวม', lunch: 'ข้าว + ผัดกะเพราไก่ (น้ำมันน้อย)', dinner: 'สเต็กปลา + มันบด' },
                { day: 'พุธ', breakfast: 'ขนมปังโฮลวีท + อะโวคาโด', lunch: 'ก๋วยเตี๋ยวลุยสวน', dinner: 'ข้าว + ต้มจับฉ่าย' },
                { day: 'พฤหัสบดี', breakfast: 'น้ำเต้าหู้ไม่หวาน + ปาท่องโก๋ 2 ตัว', lunch: 'ข้าว + ไก่ผัดขิง', dinner: 'ยำวุ้นเส้น' },
                { day: 'ศุกร์', breakfast: 'ข้าวต้มปลา', lunch: 'ส้มตำไก่ย่าง (เลี่ยงหนัง)', dinner: 'แกงเลียงกุ้งสด' },
                { day: 'เสาร์', breakfast: 'ไข่ต้ม 2 ฟอง + สลัดผัก', lunch: 'ข้าวผัดธัญพืช', dinner: 'เมี่ยงปลาทู' },
                { day: 'อาทิตย์', breakfast: 'แซนด์วิชไข่', lunch: 'เกาเหลา + ข้าวสวย', dinner: 'อาหารคลีนตามชอบ' }
            ]
        },
        overweight: {
            name: 'แผนควบคุมน้ำหนัก ลดความเสี่ยง',
            meals: [
                { day: 'จันทร์', breakfast: 'โยเกิร์ตไขมันต่ำ + กราโนล่า', lunch: 'เกาเหลา ไม่ใส่กระเทียมเจียว', dinner: 'สลัดผัก 5 สี + ไข่ต้ม 1 ฟอง' },
                { day: 'อังคาร', breakfast: 'น้ำเต้าหู้ไม่หวาน', lunch: 'ข้าวกล้อง + ต้มยำเห็ด', dinner: 'อกไก่ย่าง + ผักนึ่ง' },
                { day: 'พุธ', breakfast: 'ขนมปังโฮลวีท 1 แผ่น + เนยถั่ว', lunch: 'สุกี้น้ำไก่', dinner: 'ปลาเผา + น้ำจิ้มซีฟู้ด' },
                { day: 'พฤหัสบดี', breakfast: 'แอปเปิ้ล 1 ผล', lunch: 'ข้าว + แกงส้มผักรวม', dinner: 'ยำทูน่าในน้ำแร่' },
                { day: 'ศุกร์', breakfast: 'นมไขมันต่ำ', lunch: 'ก๋วยเตี๋ยวเรือ (เน้นผัก)', dinner: 'สเต็กเต้าหู้ + สลัด' },
                { day: 'เสาร์', breakfast: 'ไข่ตุ๋น', lunch: 'สลัดโรล', dinner: 'ต้มจืดตำลึงหมูสับ' },
                { day: 'อาทิตย์', breakfast: 'ฝรั่ง 1 ผล', lunch: 'วุ้นเส้นต้มยำ', dinner: 'น้ำพริกผักต้ม + ปลาทูทอด (ไร้น้ำมัน)' }
            ]
        },
        obese1: { // Same as overweight for simplicity, can be adjusted
            name: 'แผนลดน้ำหนัก ลดไขมัน',
            meals: [
                { day: 'จันทร์', breakfast: 'โยเกิร์ตไขมันต่ำ + กราโนล่า', lunch: 'เกาเหลา ไม่ใส่กระเทียมเจียว', dinner: 'สลัดผัก 5 สี + ไข่ต้ม 1 ฟอง' },
                { day: 'อังคาร', breakfast: 'น้ำเต้าหู้ไม่หวาน', lunch: 'ข้าวกล้อง + ต้มยำเห็ด', dinner: 'อกไก่ย่าง + ผักนึ่ง' },
                { day: 'พุธ', breakfast: 'ขนมปังโฮลวีท 1 แผ่น + เนยถั่ว', lunch: 'สุกี้น้ำไก่', dinner: 'ปลาเผา + น้ำจิ้มซีฟู้ด' },
                { day: 'พฤหัสบดี', breakfast: 'แอปเปิ้ล 1 ผล', lunch: 'ข้าว + แกงส้มผักรวม', dinner: 'ยำทูน่าในน้ำแร่' },
                { day: 'ศุกร์', breakfast: 'นมไขมันต่ำ', lunch: 'ก๋วยเตี๋ยวเรือ (เน้นผัก)', dinner: 'สเต็กเต้าหู้ + สลัด' },
                { day: 'เสาร์', breakfast: 'ไข่ตุ๋น', lunch: 'สลัดโรล', dinner: 'ต้มจืดตำลึงหมูสับ' },
                { day: 'อาทิตย์', breakfast: 'ฝรั่ง 1 ผล', lunch: 'วุ้นเส้นต้มยำ', dinner: 'น้ำพริกผักต้ม + ปลาทูทอด (ไร้น้ำมัน)' }
            ]
        },
        obese2: { // Same as overweight for simplicity, can be adjusted
            name: 'แผนลดน้ำหนัก (ปรึกษาแพทย์)',
            meals: [
                { day: 'จันทร์', breakfast: 'โยเกิร์ตไขมันต่ำ + กราโนล่า', lunch: 'เกาเหลา ไม่ใส่กระเทียมเจียว', dinner: 'สลัดผัก 5 สี + ไข่ต้ม 1 ฟอง' },
                { day: 'อังคาร', breakfast: 'น้ำเต้าหู้ไม่หวาน', lunch: 'ข้าวกล้อง + ต้มยำเห็ด', dinner: 'อกไก่ย่าง + ผักนึ่ง' },
                { day: 'พุธ', breakfast: 'ขนมปังโฮลวีท 1 แผ่น + เนยถั่ว', lunch: 'สุกี้น้ำไก่', dinner: 'ปลาเผา + น้ำจิ้มซีฟู้ด' },
                { day: 'พฤหัสบดี', breakfast: 'แอปเปิ้ล 1 ผล', lunch: 'ข้าว + แกงส้มผักรวม', dinner: 'ยำทูน่าในน้ำแร่' },
                { day: 'ศุกร์', breakfast: 'นมไขมันต่ำ', lunch: 'ก๋วยเตี๋ยวเรือ (เน้นผัก)', dinner: 'สเต็กเต้าหู้ + สลัด' },
                { day: 'เสาร์', breakfast: 'ไข่ตุ๋น', lunch: 'สลัดโรล', dinner: 'ต้มจืดตำลึงหมูสับ' },
                { day: 'อาทิตย์', breakfast: 'ฝรั่ง 1 ผล', lunch: 'วุ้นเส้นต้มยำ', dinner: 'น้ำพริกผักต้ม + ปลาทูทอด (ไร้น้ำมัน)' }
            ]
        }
    };

    // --- Exercise Data & Page ---
    const exerciseData = [
        { id: 'ex01', name: 'เดินเร็ว', type: 'cardio', description: 'การเดินเร็วเป็นประจำช่วยเสริมสร้างความแข็งแรงของหัวใจและหลอดเลือด', details: 'เดินเร็ว 30-45 นาที 3-5 วันต่อสัปดาห์' },
        { id: 'ex02', name: 'โยคะ', type: 'flexibility', description: 'โยคะช่วยเพิ่มความยืดหยุ่นของร่างกาย ลดความเครียด และสร้างสมาธิ', details: 'ฝึกโยคะ 20-30 นาที 2-3 วันต่อสัปดาห์' },
        { id: 'ex03', name: 'ยกน้ำหนัก', type: 'strength', description: 'การยกน้ำหนักช่วยสร้างกล้ามเนื้อและเพิ่มการเผาผลาญของร่างกาย', details: 'เริ่มต้นด้วยน้ำหนักเบาๆ และปรึกษาผู้เชี่ยวชาญเพื่อท่าที่ถูกต้อง' },
        { id: 'ex04', name: 'ว่ายน้ำ', type: 'cardio', description: 'การว่ายน้ำเป็นการออกกำลังกายที่ดีเยี่ยม ได้บริหารทุกส่วนของร่างกายและมีแรงกระแทกต่ำ', details: 'ว่ายน้ำ 30 นาที 2-3 ครั้งต่อสัปดาห์' }
    ];

    function renderExercisePage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-dumbbell"></i> แนะนำการออกกำลังกาย</h2>
            </div>
            <div id="exercise-content-container"></div>
        `;
    }

    async function addExercisePageEventListeners() {
        const container = document.getElementById('exercise-content-container');
        const bmiRecord = await DBGet('bmiRecords', user.username);

        if (!bmiRecord) {
            container.innerHTML = `
                <div class="bmi-prompt card">
                    <h3><i class="fas fa-calculator"></i> กรุณาคำนวณ BMI ก่อน</h3>
                    <p>เราต้องการค่า BMI ของคุณเพื่อแนะนำโปรแกรมการออกกำลังกายที่เหมาะสม</p>
                    <button id="go-to-bmi-btn" class="button-primary">ไปที่หน้าคำนวณ BMI</button>
                </div>
            `;
            document.getElementById('go-to-bmi-btn').addEventListener('click', () => loadPage('bmi-calculator'));
            return;
        }

        const bmiDetails = getBMIDetails(bmiRecord.bmi);
        const recommendedIds = exerciseRecommendationsByBMI[bmiDetails.key] || [];
        const recommendedExercises = recommendedIds.map(id => exerciseData.find(ex => ex.id === id));
        
        container.innerHTML = `
            <div class="recommendation-header">
                <h3>โปรแกรมที่แนะนำสำหรับคุณ (BMI: ${bmiRecord.bmi.toFixed(2)} - ${bmiDetails.category})</h3>
            </div>
            <div class="exercise-list">
                ${recommendedExercises.map(ex => `
                    <div class="exercise-card">
                        <h4>${ex.name}</h4>
                        <p>${ex.description}</p>
                        <p><strong>คำแนะนำ:</strong> ${ex.details}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // --- Food Data & Page ---
    const foodData = [
        { id: 'f01', name: 'ข้าวกล้อง', group: 'carbs', benefit: 'มีใยอาหารสูง ช่วยควบคุมระดับน้ำตาลในเลือดได้ดีกว่าข้าวขาว' },
        { id: 'f02', name: 'ปลาแซลมอน', group: 'protein', benefit: 'เป็นแหล่งของโปรตีนและกรดไขมันโอเมก้า 3 ที่ดีต่อสุขภาพหัวใจ' },
        { id: 'f03', name: 'บรอกโคลี', group: 'vegetable', benefit: 'อุดมไปด้วยวิตามินและแร่ธาตุ ช่วยต้านอนุมูลอิสระ' },
        { id: 'f04', name: 'อะโวคาโด', group: 'fat', benefit: 'เป็นแหล่งไขมันดี (HDL) ช่วยลดไขมันเลว (LDL) ในร่างกาย' },
        { id: 'f05', name: 'อกไก่', group: 'protein', benefit: 'โปรตีนสูง ไขมันต่ำ เหมาะสำหรับสร้างกล้ามเนื้อและควบคุมน้ำหนัก' }
    ];

    function renderFoodPage() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-utensils"></i> แนะนำตารางอาหาร</h2>
            </div>
            <div id="food-plan-container"></div>
        `;
    }

    async function addFoodPageEventListeners() {
        const container = document.getElementById('food-plan-container');
        const bmiRecord = await DBGet('bmiRecords', user.username);

        if (!bmiRecord) {
            container.innerHTML = `
                <div class="bmi-prompt card">
                    <h3><i class="fas fa-calculator"></i> กรุณาคำนวณ BMI ก่อน</h3>
                    <p>เราต้องการค่า BMI ของคุณเพื่อแนะนำตารางอาหารที่เหมาะสม</p>
                    <button id="go-to-bmi-btn" class="button-primary">ไปที่หน้าคำนวณ BMI</button>
                </div>
            `;
            document.getElementById('go-to-bmi-btn').addEventListener('click', () => loadPage('bmi-calculator'));
            return;
        }

        const bmiDetails = getBMIDetails(bmiRecord.bmi);
        const plan = foodPlansByBMI[bmiDetails.key];

        if (!plan) {
            container.innerHTML = '<p>ขออภัย ไม่พบแผนอาหารที่เหมาะสม</p>';
            return;
        }
        
        const tableRows = plan.meals.map(day => `
            <tr>
                <td>${day.day}</td>
                <td>${day.breakfast}</td>
                <td>${day.lunch}</td>
                <td>${day.dinner}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="recommendation-header">
                <h3>${plan.name} (สำหรับ BMI: ${bmiRecord.bmi.toFixed(2)})</h3>
            </div>
            <div class="food-plan-table-container">
                <table class="food-plan-table">
                    <thead>
                        <tr>
                            <th>วัน</th>
                            <th>เช้า</th>
                            <th>กลางวัน</th>
                            <th>เย็น</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- Tracking Record Page ---
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

        const rssUrl = 'https://www.who.int/rss-feeds/news-english.xml';
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.status !== 'ok') {
                throw new Error('RSS feed could not be loaded.');
            }
            
            const items = data.items;
            let html = ``;

            items.forEach((el, index) => {
                if (index >= 5) return; // Limit to 5 news items
                const title = el.title || 'No title';
                const link = el.link || '#';
                const pubDate = new Date(el.pubDate).toLocaleDateString('th-TH');
                
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
            console.error("Error fetching or parsing news feed:", error);
            if (newsContainer) {
                newsContainer.innerHTML = `<p>ขออภัย, ไม่สามารถโหลดข่าวสารได้ในขณะนี้ กรุณาลองใหม่ในภายหลัง</p>`;
            }
        }
    }

    // --- Database Functions (IndexedDB) ---
    const DB_NAME = 'NCDsHealthTechDB';
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 2); 
            request.onerror = (event) => reject('Database error: ' + event.target.errorCode);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('userProfile')) {
                    db.createObjectStore('userProfile', { keyPath: 'username' });
                }
                if (!db.objectStoreNames.contains('healthProfile')) {
                    db.createObjectStore('healthProfile', { keyPath: 'username' });
                }
                if (!db.objectStoreNames.contains('trackingRecords')) {
                    db.createObjectStore('trackingRecords', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('bmiRecords')) { 
                    db.createObjectStore('bmiRecords', { keyPath: 'username' });
                }
            };
            request.onsuccess = (event) => {
                console.log("Database opened successfully.");
                resolve(event.target.result);
            };
        });
    }

    async function DBGet(storeName, key) {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        return new Promise((resolve, reject) => {
            request.onerror = () => reject('Error getting data from ' + storeName);
            request.onsuccess = () => {
                resolve(request.result || null);
            };
        });
    }

    async function DBPut(storeName, data) {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        return new Promise((resolve, reject) => {
            request.onerror = () => reject('Error saving data');
            request.onsuccess = () => resolve('Data saved successfully');
        });
    }

    async function DBGetAll(storeName) {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            const result = [];
            request.onerror = () => reject('Error getting data');
            request.onsuccess = () => {
                request.result.forEach(item => result.push(item));
                resolve(result);
            };
        });
    }

    // --- Init ---
    initializeApp();
});