document.addEventListener('DOMContentLoaded', () => {
    // Ensure this runs only on login/register pages
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!firstName || !lastName || !username || !password) {
                alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
                return;
            }

            try {
                const existingUser = await DBGet('users', username);
                if (existingUser) {
                    alert('ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น');
                    return;
                }

                const newUser = {
                    username,
                    password, // In a real app, HASH THIS PASSWORD!
                    firstName,
                    lastName,
                };

                await DBPut('users', newUser);
                alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Registration error:', error);
                alert('เกิดข้อผิดพลาดในการลงทะเบียน');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
                return;
            }

            try {
                const user = await DBGet('users', username);

                if (user && user.password === password) {
                    // In a real app, compare hashed passwords
                    alert('เข้าสู่ระบบสำเร็จ!');
                    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                    window.location.href = 'index.html';
                } else {
                    alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        });
    }
}); 