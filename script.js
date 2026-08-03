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

// 如果 Firebase 尚未初始化，进行初始化
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// ⚙️ 老师的数据配置中心 (课程/游戏列表)
// ==========================================
const studioData = {
    // 1：一年级
    "1": [
        {
            id: "g1-l1",
            title: "第一单元：我爱我的学校",
            quiz: [
                { name: "📝 词汇识别测验", url: "quiz/index.html" }
            ],
            review: [
                { name: "🎴 单元生字 Flashcards", url: "#" }
            ],
            game: [
                { name: "🎮 校园生字连连看", url: "#" }
            ]
        },
        {
            id: "g1-l2",
            title: "第二单元：可爱的小动物",
            quiz: [
                { name: "📝 动物拼音测验", url: "quiz/index.html" }
            ],
            review: [],
            game: []
        }
    ],

    // 2：二年级
    "2": [
        {
            id: "g2-l1",
            title: "第一单元：美丽的春天",
            quiz: [{ name: "📝 词意选字测验", url: "#" }],
            review: [],
            game: []
        }
    ],

    // 3 ~ 6 年级
    "3": [], "4": [], "5": [], "6": []
};

// 全局当前状态
let currentGrade = "1";
let currentLessonIndex = 0;

// 获取 DOM 元素引用
const gradeBtns = document.querySelectorAll(".grade-btn");
const lessonMenu = document.getElementById("lesson-menu");
const lessonTitle = document.getElementById("current-lesson-title");
const quizList = document.getElementById("quiz-list");
const reviewList = document.getElementById("review-list");
const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search-input");


// ==========================================
// 🔑 1. 主页身份验证与登录
// ==========================================

// 检查本地登录状态
function checkLoginState() {
    const studentInfo = sessionStorage.getItem("current_student");

    if (!studentInfo) {
        // 未登录，展示登录弹窗
        const modal = document.getElementById("login-modal");
        if (modal) modal.style.display = "flex";
    } else {
        // 已登录，隐藏弹窗并初始化页面内容
        const modal = document.getElementById("login-modal");
        if (modal) modal.style.display = "none";
        
        const student = JSON.parse(studentInfo);
        showWelcomeBar(student);
        
        // 自动切换到学生所属年级并渲染
        currentGrade = String(student.grade);
        updateActiveGradeBtn(currentGrade);
        initPage();
    }
}

// 登录按钮触发函数
async function handleLogin() {
    const pwdInput = document.getElementById("login-password");
    const errorMsg = document.getElementById("login-error-msg");
    if (errorMsg) errorMsg.innerText = "";

    if (!pwdInput) return;

    // 清洗输入，将所有英文字母强制转换为纯大写字符串
    const cleanInput = pwdInput.value.trim().toUpperCase();

    if (!cleanInput) {
        if (errorMsg) errorMsg.innerText = "⚠️ 请输入通行码！";
        return;
    }

    if (cleanInput.length < 4) {
        if (errorMsg) errorMsg.innerText = "❌ 通行码格式不正确！(例: ZSY8888 或 ZSY1111)";
        return;
    }

    // 前3位为学生代号 ID，剩余部分为密码
    const idPrefix = cleanInput.substring(0, 3);
    const inputPassword = cleanInput.substring(3);

    try {
        if (errorMsg) errorMsg.innerText = "🔄 验证中，请稍候...";

        // 1. 读取 Firestore 密码配置文件 setting/password
        const passDoc = await db.collection("setting").doc("password").get();
        if (!passDoc.exists) {
            if (errorMsg) errorMsg.innerText = "⚠️ 系统错误：数据库中未找到 setting/password！";
            return;
        }
        const passData = passDoc.data();

        // 2. 读取 Firestore 学生名册 student/registry
        const registryDoc = await db.collection("student").doc("registry").get();
        if (!registryDoc.exists) {
            if (errorMsg) errorMsg.innerText = "⚠️ 系统错误：数据库中未找到 student/registry！";
            return;
        }

        const registryData = registryDoc.data();
        const studentData = registryData[idPrefix];

        // 3. 校验学生 ID 是否在名册中
        if (!studentData) {
            if (errorMsg) errorMsg.innerText = `❌ 代号错误！名册中没有找到代号为 "${idPrefix}" 的学生。`;
            return;
        }

        // 4. 获取主页通用密码与学生所属年级密码
        const masterPass = String(passData.master || "").trim();
        const gradePassKey = "grade" + studentData.grade;
        const gradePass = String(passData[gradePassKey] || "").trim();
        const userPass = String(inputPassword).trim();

        // 5. 密码校验：支持【主页密码】或【该年级密码】任意一种
        if (userPass !== masterPass && userPass !== gradePass) {
            if (errorMsg) errorMsg.innerText = `❌ 密码错误！请输入正确的通行密码。`;
            return;
        }

        // 6. 验证成功，组装学生对象存入 sessionStorage
        const studentObj = {
            id: idPrefix,
            name: studentData.name,
            grade: String(studentData.grade)
        };
        sessionStorage.setItem("current_student", JSON.stringify(studentObj));

        // 隐藏登录弹窗
        const modal = document.getElementById("login-modal");
        if (modal) modal.style.display = "none";

        // 显示退出按钮（若存在）
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) logoutBtn.style.display = "block";

        // 更新界面信息并渲染对应的年级内容
        showWelcomeBar(studentObj);
        currentGrade = String(studentObj.grade);
        updateActiveGradeBtn(currentGrade);
        initPage();

    } catch (error) {
        console.error("登录验证失败，详细错误信息:", error);
        if (errorMsg) errorMsg.innerText = `❌ 连接数据库失败: ${error.message}`;
    }
}

// 退出登录
function handleLogout() {
    sessionStorage.removeItem("current_student");
    location.reload();
}

// 展示欢迎卡片
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

// 初始化渲染页面
function initPage() {
    renderLessons();
    setupEvents();
}

// 更新顶栏年级按钮的高亮状态
function updateActiveGradeBtn(grade) {
    gradeBtns.forEach(btn => {
        if (String(btn.dataset.grade) === String(grade)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// 渲染侧边栏单元菜单
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

// 渲染右侧三大分类卡片区
function renderContent(lessonData) {
    if (!lessonData) return;

    if (lessonTitle) lessonTitle.textContent = lessonData.title;

    renderCardGroup(quizList, lessonData.quiz);
    renderCardGroup(reviewList, lessonData.review);
    renderCardGroup(gameList, lessonData.game);
}

// 渲染卡片组 + 🔒 智能年级防越级拦截
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

        // 点击卡片时的逻辑与年级拦截
        a.addEventListener("click", (e) => {
            e.preventDefault();
            
            const studentInfo = sessionStorage.getItem("current_student");
            if (!studentInfo) {
                alert("🔒 请先进行身份验证！");
                location.reload();
                return;
            }

            const student = JSON.parse(studentInfo);

            // 越级拦截判断
            if (String(student.grade) !== String(currentGrade)) {
                alert(`❌ 无法进入！本栏目属于【${currentGrade}年级】，而你是【${student.grade}年级】的学生。`);
                return;
            }

            // 放行跳转
            if (item.url && item.url !== "#") {
                window.location.href = item.url;
            } else {
                alert("🚧 该模块老师正在准备中，敬请期待！");
            }
        });

        container.appendChild(a);
    });
}

// 清空卡片展示区
function clearCards() {
    if (quizList) quizList.innerHTML = "";
    if (reviewList) reviewList.innerHTML = "";
    if (gameList) gameList.innerHTML = "";
}

// 事件绑定 (年级切换 & 搜索 & 键盘回车登录)
function setupEvents() {
    // 1. 年级切换按钮
    gradeBtns.forEach(btn => {
        btn.onclick = () => {
            gradeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentGrade = btn.dataset.grade;
            currentLessonIndex = 0;
            renderLessons();
        };
    });

    // 2. 侧边栏搜索过滤
    if (searchInput) {
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase().trim();
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

    // 3. 密码输入框 Enter 回车快捷登录
    const pwdInput = document.getElementById("login-password");
    if (pwdInput) {
        pwdInput.onkeyup = function(event) {
            if (event.key === "Enter") {
                handleLogin();
            }
        };
    }
}

// 页面 DOM 加载完成后启动登录状态检查
window.addEventListener("DOMContentLoaded", () => {
    checkLoginState();
});
