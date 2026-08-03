// ==========================================
// 🔥 Firebase 项目初始化配置
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAqp_1JyuAtpQgJtnFRLhuVEmUIrx1YetI",
    authDomain: "my-teacher-studio.firebaseapp.com",
    projectId: "my-teacher-studio",
    storageBucket: "my-teacher-studio.firebasestorage.app",
    messagingSenderId: "82774284780",
    appId: "1:82774284780:web:e29680ea7a0e5c435ec8c9"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// ⚙️ 老师的数据配置中心 (课程/游戏列表)
// ==========================================
const studioData = {
    "1": [
        {
            id: "g1-l1",
            title: "第一单元：我爱我的学校",
            quiz: [{ name: "📝 词汇识别测验", url: "quiz/index.html" }],
            review: [{ name: "🎴 单元生字 Flashcards", url: "#" }],
            game: [{ name: "🎮 校园生字连连看", url: "#" }]
        },
        {
            id: "g1-l2",
            title: "第二单元：可爱的小动物",
            quiz: [{ name: "📝 动物拼音测验", url: "quiz/index.html" }],
            review: [],
            game: []
        }
    ],
    "2": [
        {
            id: "g2-l1",
            title: "第一单元：美丽的春天",
            quiz: [{ name: "📝 词意选字测验", url: "#" }],
            review: [],
            game: []
        }
    ],
    "3": [], "4": [], "5": [], "6": []
};

let currentGrade = "1";
let currentLessonIndex = 0;

let gradeBtns;
let lessonMenu;
let lessonTitle;
let quizList;
let reviewList;
let gameList;
let searchInput;

// DOM 元素加载绑定
function bindDOMElements() {
    gradeBtns = document.querySelectorAll(".grade-btn");
    lessonMenu = document.getElementById("lesson-menu");
    lessonTitle = document.getElementById("current-lesson-title");
    quizList = document.getElementById("quiz-list");
    reviewList = document.getElementById("review-list");
    gameList = document.getElementById("game-list");
    searchInput = document.getElementById("search-input");
}

// ==========================================
// 🔑 1. 主页身份验证与登录
// ==========================================

function checkLoginState() {
    const studentInfo = sessionStorage.getItem("current_student");

    if (!studentInfo) {
        const modal = document.getElementById("login-modal");
        if (modal) modal.style.display = "flex";
    } else {
        const modal = document.getElementById("login-modal");
        if (modal) modal.style.display = "none";
        
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) logoutBtn.style.display = "block";

        const student = JSON.parse(studentInfo);
        showWelcomeBar(student);
        
        currentGrade = String(student.grade);
        updateActiveGradeBtn(currentGrade);
        initPage();
    }
}

async function handleLogin() {
    const pwdInput = document.getElementById("login-password");
    const errorMsg = document.getElementById("login-error-msg");
    if (errorMsg) errorMsg.innerText = "";

    if (!pwdInput) return;

    // 强行转大写并去空格
    const cleanInput = pwdInput.value.trim().toUpperCase();
    console.log("👉【登录调试】用户当前输入内容为:", cleanInput);

    if (!cleanInput) {
        if (errorMsg) errorMsg.innerText = "⚠️ 请输入通行码！";
        return;
    }

    try {
        if (errorMsg) errorMsg.innerText = "🔄 连接 Firebase 数据库验证中...";

        // 1. 读取密码库 setting/password
        const passDoc = await db.collection("setting").doc("password").get();
        if (!passDoc.exists) {
            console.error("❌【调试错误】未找到 setting/password 文档！");
            if (errorMsg) errorMsg.innerText = "⚠️ 数据库错误：缺失 setting/password 配置文件";
            return;
        }
        const passData = passDoc.data() || {};
        console.log("📦【调试数据】从 setting/password 读到的数据为:", passData);

        // 2. 读取学生名册 student/registry
        const registryDoc = await db.collection("student").doc("registry").get();
        if (!registryDoc.exists) {
            console.error("❌【调试错误】未找到 student/registry 文档！");
            if (errorMsg) errorMsg.innerText = "⚠️ 数据库错误：缺失 student/registry 名册文件";
            return;
        }
        const registryData = registryDoc.data() || {};
        console.log("📦【调试数据】从 student/registry 读到的名册为:", registryData);

        // 3. 智能匹配学生 ID（自动识别前缀）
        let matchedStudentId = null;
        let matchedStudentData = null;

        // 遍历名册中所有的学生 key (如 ZSY)
        for (const studentKey of Object.keys(registryData)) {
            const upperKey = studentKey.trim().toUpperCase();
            if (cleanInput.startsWith(upperKey)) {
                matchedStudentId = upperKey;
                matchedStudentData = registryData[studentKey];
                break;
            }
        }

        if (!matchedStudentData) {
            console.warn(`⚠️【调试提示】输入的 "${cleanInput}" 未能匹配到任何学生代号。`);
            if (errorMsg) errorMsg.innerText = `❌ 代号无效！找不到对应的学生注册信息。`;
            return;
        }

        // 提取用户输入的“密码”部分
        const userEnteredPassword = cleanInput.replace(matchedStudentId, "").trim();
        console.log(`👤【调试结果】匹配到学生ID: [${matchedStudentId}], 姓名: [${matchedStudentData.name}], 输入的密码部分: [${userEnteredPassword}]`);

        // 4. 获取数据库里的主页密码和年级密码（强制转成字符串）
        const masterPass = String(passData.master || "").trim();
        const studentGrade = String(matchedStudentData.grade || "").trim();
        const gradePassKey = "grade" + studentGrade;
        const gradePass = String(passData[gradePassKey] || "").trim();

        console.log(`🔑【对比密码】主页密码(master): "${masterPass}", 年级密码(${gradePassKey}): "${gradePass}"`);

        // 5. 比对密码
        if (userEnteredPassword === masterPass || userEnteredPassword === gradePass) {
            console.log("✅【登录成功】密码正确！");

            const studentObj = {
                id: matchedStudentId,
                name: matchedStudentData.name,
                grade: studentGrade
            };

            sessionStorage.setItem("current_student", JSON.stringify(studentObj));

            const modal = document.getElementById("login-modal");
            if (modal) modal.style.display = "none";

            const logoutBtn = document.getElementById("logout-btn");
            if (logoutBtn) logoutBtn.style.display = "block";

            showWelcomeBar(studentObj);
            currentGrade = studentObj.grade;
            updateActiveGradeBtn(currentGrade);
            initPage();
        } else {
            console.warn("❌【登录失败】密码不匹配！");
            if (errorMsg) errorMsg.innerText = `❌ 密码错误！请输入正确的密码。`;
        }

    } catch (error) {
        console.error("🔥【致命异常】Firebase 请求报错详情:", error);
        if (errorMsg) errorMsg.innerText = `❌ 数据库连接失败: ${error.message}`;
    }
}

function handleLogout() {
    sessionStorage.removeItem("current_student");
    location.reload();
}

function showWelcomeBar(student) {
    const welcomeDiv = document.getElementById("welcome-bar");
    if (welcomeDiv) {
        welcomeDiv.innerHTML = `👋 欢迎，${student.name}同学 (${student.grade}年级)`;
        welcomeDiv.style.display = "inline-block";
    }
}

// ==========================================
// 🎨 2. 页面渲染与交互逻辑
// ==========================================

function initPage() {
    bindDOMElements();
    renderLessons();
    setupEvents();
}

function updateActiveGradeBtn(grade) {
    if (!gradeBtns) return;
    gradeBtns.forEach(btn => {
        if (String(btn.dataset.grade) === String(grade)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function renderLessons() {
    const lessons = studioData[currentGrade] || [];
    if (!lessonMenu) return;
    
    lessonMenu.innerHTML = "";

    if (lessons.length === 0) {
        lessonMenu.innerHTML = "<li style='color:#888; cursor:default;'>暂无课程</li>";
        if (lessonTitle) lessonTitle.textContent = "该年级暂无内容";
        clearCards();
        return;
    }

    lessons.forEach((lesson, index) => {
        const li = document.createElement("li");
        li.textContent = lesson.title;
        if (index === currentLessonIndex) li.classList.add("active");

        li.addEventListener("click", () => {
            currentLessonIndex = index;
            renderLessons();
        });

        lessonMenu.appendChild(li);
    });

    renderContent(lessons[currentLessonIndex]);
}

function renderContent(lessonData) {
    if (!lessonData) return;
    if (lessonTitle) lessonTitle.textContent = lessonData.title;

    renderCardGroup(quizList, lessonData.quiz);
    renderCardGroup(reviewList, lessonData.review);
    renderCardGroup(gameList, lessonData.game);
}

function renderCardGroup(container, items) {
    if (!container) return;
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:14px; padding: 8px;'>暂未添加内容</p>";
        return;
    }

    items.forEach(item => {
        const a = document.createElement("a");
        a.className = "activity-card";
        a.href = "#";
        a.textContent = item.name;

        a.addEventListener("click", (e) => {
            e.preventDefault();
            
            const studentInfo = sessionStorage.getItem("current_student");
            if (!studentInfo) {
                alert("🔒 请先进行身份验证！");
                location.reload();
                return;
            }

            const student = JSON.parse(studentInfo);

            if (String(student.grade) !== String(currentGrade)) {
                alert(`❌ 无法进入！本栏目属于【${currentGrade}年级】，而你是【${student.grade}年级】的学生。`);
                return;
            }

            if (item.url && item.url !== "#") {
                window.location.href = item.url;
            } else {
                alert("🚧 该模块老师正在准备中，敬请期待！");
            }
        });

        container.appendChild(a);
    });
}

function clearCards() {
    if (quizList) quizList.innerHTML = "";
    if (reviewList) reviewList.innerHTML = "";
    if (gameList) gameList.innerHTML = "";
}

function setupEvents() {
    if (gradeBtns) {
        gradeBtns.forEach(btn => {
            btn.onclick = () => {
                gradeBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                currentGrade = btn.dataset.grade;
                currentLessonIndex = 0;
                renderLessons();
            };
        });
    }

    if (searchInput) {
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!lessonMenu) return;
            const items = lessonMenu.querySelectorAll("li");

            items.forEach(item => {
                if (item.textContent.toLowerCase().includes(query)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
        };
    }

    const pwdInput = document.getElementById("login-password");
    if (pwdInput) {
        pwdInput.onkeyup = function(event) {
            if (event.key === "Enter") {
                handleLogin();
            }
        };
    }
}

// 初始化启动
window.addEventListener("DOMContentLoaded", () => {
    bindDOMElements();
    checkLoginState();
});
