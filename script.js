// ==========================================
// 🔥 Firebase 项目初始化配置
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAqp_1JyuAtpQgJtnFRLhuVEmUIrx1YetI",
    authDomain: "my-teacher-studio.firebaseapp.com",
    projectId: "my-teacher-studio",
    storageBucket: "my-teacher-studio.firebasestorage.app",
    messagingSenderId: "82774284780",
    appId: "1:82774284780:web:e29680ea7a0e5c435ec8c9" // 修正了这里的多余引号
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

// 当前状态
let currentGrade = "1";
let currentLessonIndex = 0;

// 获取 DOM 元素
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
async function loginStudio() {
    let studentInfo = sessionStorage.getItem("current_student");

    if (!studentInfo) {
        const input = prompt("🔒 欢迎来到学习小屋！请输入你的通行码 (例: SLH****)：");
        if (!input) {
            alert("❌ 请输入通行码后进入！");
            location.reload();
            return;
        }

        const cleanInput = input.trim();
        if (cleanInput.length < 4) {
            alert("❌ 通行码格式不正确！请输入形如 SLH**** 的组合。");
            location.reload();
            return;
        }

        // 提取前 3 位代号与后半部分密码
        const idPrefix = cleanInput.substring(0, 3).toUpperCase();
        const inputPassword = cleanInput.substring(3);

        try {
            // 1. 读取主页通用大门密码
            const passDoc = await db.collection("setting").doc("password").get();
            if (!passDoc.exists) {
                alert("⚠️ 系统错误：Firestore 中找不到 setting/password 文档！");
                return;
            }
            const masterPass = passDoc.data().master;

            // 2. 读取学生注册表
            const registryDoc = await db.collection("student").doc("registry").get();
            if (!registryDoc.exists) {
                alert("⚠️ 系统错误：Firestore 中找不到 student/registry 文档！");
                return;
            }

            const registryData = registryDoc.data();
            const studentData = registryData[idPrefix];

            // 验证密码
            if (String(inputPassword) !== String(masterPass)) {
                alert(`❌ 密码错误！你输入的密码是 "${inputPassword}"，不匹配主页密码。`);
                location.reload();
                return;
            }

            // 验证学生代号
            if (!studentData) {
                alert(`❌ 身份代号错误！在名册中找不到代号 "${idPrefix}" 的学生。`);
                location.reload();
                return;
            }

            // 验证成功，保存身份
            const studentObj = {
                id: idPrefix,
                name: studentData.name,
                grade: String(studentData.grade)
            };
            sessionStorage.setItem("current_student", JSON.stringify(studentObj));
            alert(`🎉 登录成功！欢迎你，${studentData.name}同学！`);

            showWelcomeBar(studentObj);
            initPage(); // 初始化渲染游戏卡片

        } catch (error) {
            console.error("登录详细报错日志:", error);
            alert(`❌ 连接数据库失败！错误原因: ${error.message}`);
        }
    } else {
        showWelcomeBar(JSON.parse(studentInfo));
        initPage(); // 已登录则直接初始化渲染
    }
}
// 2. 顶栏显示“欢迎，张丽丽同学！”
function showWelcomeBar(student) {
const welcomeDiv = document.getElementById("welcome-bar");
    if (welcomeDiv) {
        welcomeDiv.innerHTML = `👋 欢迎，${student.name}同学 (${student.grade}年级)`;
       // 登录成功后显示气泡
    }
}

// ==========================================
// 🎨 2. 页面渲染与交互逻辑
// ==========================================

// 初始化主页内容
function initPage() {
    renderLessons();
    setupEvents();
}

// 渲染侧边栏单元菜单
function renderLessons() {
    const lessons = studioData[currentGrade] || [];
    if (!lessonMenu) return;
    
    lessonMenu.innerHTML = "";

    if (lessons.length === 0) {
        lessonMenu.innerHTML = "<li>暂无课程</li>";
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

// 渲染右侧内容卡片
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
        container.innerHTML = "<p style='color:#777; font-size:14px;'>暂未添加内容</p>";
        return;
    }

    items.forEach(item => {
        const a = document.createElement("a");
        a.className = "activity-card";
        a.href = "#"; // 阻止默认跳转，由 JS 控制判断
        a.textContent = item.name;

        // 点击卡片时的年级越级拦截判断
        a.addEventListener("click", (e) => {
            e.preventDefault();
            
            const studentInfo = sessionStorage.getItem("current_student");
            if (!studentInfo) {
                alert("🔒 请先进行身份验证！");
                location.reload();
                return;
            }

            const student = JSON.parse(studentInfo);

            // 防越级判断：如果点击的年级与学生年级不相符
            if (String(student.grade) !== String(currentGrade)) {
                alert(`❌ 无法进入！本栏目属于【${currentGrade}年级】，而你是【${student.grade}年级】的学生。`);
                return;
            }

            // 年级匹配无误，放行跳转
            window.location.href = item.url;
        });

        container.appendChild(a);
    });
}

function clearCards() {
    if (quizList) quizList.innerHTML = "";
    if (reviewList) reviewList.innerHTML = "";
    if (gameList) gameList.innerHTML = "";
}

// 事件绑定 (年级切换 & 搜索)
function setupEvents() {
    gradeBtns.forEach(btn => {
        btn.onclick = () => {
            gradeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentGrade = btn.dataset.grade;
            currentLessonIndex = 0;
            renderLessons();
        };
    });

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
}

// 页面加载完成后启动登录流程
window.addEventListener("DOMContentLoaded", () => {
    loginStudio();
});
