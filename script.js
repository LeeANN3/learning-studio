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
// ⚙️ 课程与活动数据中心
// ==========================================
const studioData = {
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

// 全局当前状态
let currentGrade = "1";
let currentLessonIndex = 0;

// 获取 DOM 节点
const gradeBtns = document.querySelectorAll(".grade-btn");
const lessonMenu = document.getElementById("lesson-menu");
const lessonTitle = document.getElementById("current-lesson-title");
const quizList = document.getElementById("quiz-list");
const reviewList = document.getElementById("review-list");
const gameList = document.getElementById("game-list");
const searchInput = document.getElementById("search-input");

// ==========================================
// 🔑 1. 原版通行码登录与身份验证 (如 SLH888)
// ==========================================
async function loginStudio() {
    let studentInfo = sessionStorage.getItem("current_student");

    if (!studentInfo) {
        const input = prompt("🔒 欢迎来到学习小屋！请输入你的通行码 (例如: SLH888)：");
        if (!input) {
            alert("❌ 请输入通行码后进入！");
            location.reload();
            return;
        }

        const cleanInput = input.trim();
        if (cleanInput.length < 4) {
            alert("❌ 通行码格式不正确！请输入形如 SLH888 的组合。");
            location.reload();
            return;
        }

        // 拆解：前 3 位为学生代号 (SLH)，后半部分为密码 (888)
        const idPrefix = cleanInput.substring(0, 3).toUpperCase();
        const inputPassword = cleanInput.substring(3);

        try {
            // 1. 读取 Firestore 设置的 master 密码
            const passDoc = await db.collection("setting").doc("password").get();
            if (!passDoc.exists) {
                alert("⚠️ 系统错误：找不到 setting/password 文档！");
                return;
            }
            const masterPass = passDoc.data().master;

            // 2. 读取 Firestore 学生花名册
            const registryDoc = await db.collection("student").doc("registry").get();
            if (!registryDoc.exists) {
                alert("⚠️ 系统错误：找不到 student/registry 文档！");
                return;
            }

            const registryData = registryDoc.data();
            const studentData = registryData[idPrefix];

            // 密码校验
            if (String(inputPassword) !== String(masterPass)) {
                alert(`❌ 密码错误！你输入的密码是 "${inputPassword}"，不正确。`);
                location.reload();
                return;
            }

            // 学生代号校验
            if (!studentData) {
                alert(`❌ 代号错误！名册中没有找到代号 "${idPrefix}" 的学生。`);
                location.reload();
                return;
            }

            // 验证通过，写入 SessionStorage
            const studentObj = {
                id: idPrefix,
                name: studentData.name,
                grade: String(studentData.grade)
            };
            sessionStorage.setItem("current_student", JSON.stringify(studentObj));
            alert(`🎉 登录成功！欢迎你，${studentData.name}同学！`);

            applyStudentSession(studentObj);

        } catch (error) {
            console.error("登录报错:", error);
            alert(`❌ 数据库连接失败: ${error.message}`);
        }
    } else {
        applyStudentSession(JSON.parse(studentInfo));
    }
}

// 应用当前登录学生状态
function applyStudentSession(student) {
    // 1. 更新顶部欢迎标题中的学生名字
    const welcomeTitle = document.getElementById("welcome-title");
    if (welcomeTitle) {
        welcomeTitle.innerHTML = `👋 嗨，<span class="highlight-macaron">${student.name}同学</span> (${student.grade}年级)！`;
    }

    // 2. 自动选定该学生的年级
    if (student.grade && studioData[student.grade]) {
        currentGrade = student.grade;
        gradeBtns.forEach(btn => {
            if (btn.dataset.grade === String(currentGrade)) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    // 3. 渲染对应课程内容
    renderLessons();
}

// ==========================================
// 🎨 2. 课程与活动渲染
// ==========================================

function renderLessons() {
    const lessons = studioData[currentGrade] || [];
    if (!lessonMenu) return;

    lessonMenu.innerHTML = "";

    if (lessons.length === 0) {
        lessonMenu.innerHTML = "<li style='color:#999;'>暂无课程</li>";
        if (lessonTitle) lessonTitle.textContent = "该年级暂无内容";
        clearCards();
        return;
    }

    if (currentLessonIndex >= lessons.length) {
        currentLessonIndex = 0;
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
    if (!lessonData) {
        clearCards();
        return;
    }

    if (lessonTitle) lessonTitle.textContent = lessonData.title;

    renderCardGroup(quizList, lessonData.quiz);
    renderCardGroup(reviewList, lessonData.review);
    renderCardGroup(gameList, lessonData.game);
}

// 渲染卡片 + 年级越级拦截
function renderCardGroup(container, items) {
    if (!container) return;
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "<p style='color:#888; font-size:13px;'>暂无内容</p>";
        return;
    }

    items.forEach(item => {
        const a = document.createElement("a");
        a.className = "activity-card-item";
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

            // 跨年级防越级拦截
            if (String(student.grade) !== String(currentGrade)) {
                alert(`❌ 无法进入！本栏目属于【${currentGrade}年级】，而你是【${student.grade}年级】的学生。`);
                return;
            }

            if (item.url && item.url !== "#") {
                window.location.href = item.url;
            } else {
                alert("🚧 该内容正在准备中，敬请期待！");
            }
        });

        container.appendChild(a);
    });
}

function clearCards() {
    if (quizList) quizList.innerHTML = "<p style='color:#888; font-size:13px;'>暂无测验</p>";
    if (reviewList) reviewList.innerHTML = "<p style='color:#888; font-size:13px;'>暂无复习</p>";
    if (gameList) gameList.innerHTML = "<p style='color:#888; font-size:13px;'>暂无游戏</p>";
}

// ==========================================
// 🖱️ 3. 事件绑定与 Bottom Nav 交互实现
// ==========================================
function setupEvents() {
    // 年级按钮点击
    gradeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            gradeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentGrade = btn.dataset.grade;
            currentLessonIndex = 0;
            renderLessons();
        });
    });

    // 搜索实时过滤
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const items = lessonMenu.querySelectorAll("li");

            items.forEach(item => {
                if (item.textContent.toLowerCase().includes(query)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    // 底部 Bottom Navigation 交互绑定
    const navHome = document.getElementById("nav-home");
    const navGrade = document.getElementById("nav-grade");
    const navMsg = document.getElementById("nav-msg");
    const navSearch = document.getElementById("nav-search");

    const searchModal = document.getElementById("search-modal");
    const closeSearch = document.getElementById("close-search");

    const msgModal = document.getElementById("msg-modal");
    const closeMsg = document.getElementById("close-msg");

    // 辅助切换高亮
    function setNavActive(target) {
        document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
        if(target) target.classList.add("active");
    }

    if (navHome) {
        navHome.addEventListener("click", () => {
            setNavActive(navHome);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (navGrade) {
        navGrade.addEventListener("click", () => {
            setNavActive(navGrade);
            const anchor = document.getElementById("grade-section-anchor");
            if (anchor) anchor.scrollIntoView({ behavior: "smooth" });
        });
    }

    if (navMsg && msgModal) {
        navMsg.addEventListener("click", () => {
            setNavActive(navMsg);
            msgModal.classList.add("show");
        });
        if (closeMsg) closeMsg.addEventListener("click", () => msgModal.classList.remove("show"));
    }

    if (navSearch && searchModal) {
        navSearch.addEventListener("click", () => {
            setNavActive(navSearch);
            searchModal.classList.add("show");
            if (searchInput) searchInput.focus();
        });
        if (closeSearch) closeSearch.addEventListener("click", () => searchModal.classList.remove("show"));
    }
}

// 页面载入时启动
window.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    loginStudio();
});
