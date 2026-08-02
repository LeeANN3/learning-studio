// ==========================================
// 🔑 1. 主页身份验证与云端登录
// ==========================================
async function loginStudio() {
    let studentInfo = sessionStorage.getItem("current_student");

    if (!studentInfo) {
        const input = prompt("🔒 欢迎来到老师的学习小屋！请输入你的通行码 (例: ZLL8888)：");
        if (!input || input.length < 4) {
            alert("❌ 格式不正确！");
            location.reload();
            return;
        }

        // 拆分：前3位是字母代号，后面是主页密码
        const idPrefix = input.substring(0, 3).toUpperCase();
        const inputPassword = input.substring(3);

        try {
            // 1. 从 Firebase 读取主页大门密码
            const passDoc = await db.collection("settings").doc("passwords").get();
            const masterPass = passDoc.data().master;

            // 2. 从 Firebase 读取学生名单匹配身份
            const registryDoc = await db.collection("students").doc("registry").get();
            const studentData = registryDoc.data()[idPrefix];

            if (inputPassword === masterPass && studentData) {
                // 验证成功，保存学生身份到 sessionStorage
                const studentObj = {
                    id: idPrefix,
                    name: studentData.name,
                    grade: studentData.grade
                };
                sessionStorage.setItem("current_student", JSON.stringify(studentObj));
                alert(`🎉 登录成功！欢迎你，${studentData.name}同学！`);
                showWelcomeBar(studentObj);
            } else {
                alert("❌ 身份代号或密码错误！");
                document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px;'>🔒 身份验证失败，无法访问。</h2>";
            }
        } catch (error) {
            console.error("登录失败:", error);
            alert("❌ 网络连接失败，请刷新重试！");
        }
    } else {
        // 如果已经登录过，直接渲染欢迎语
        showWelcomeBar(JSON.parse(studentInfo));
    }
}

// 2. 顶栏显示“欢迎，张丽丽同学！”
function showWelcomeBar(student) {
    const welcomeDiv = document.getElementById("welcome-bar") || document.createElement("div");
    welcomeDiv.id = "welcome-bar";
    welcomeDiv.style.cssText = "position: fixed; top: 15px; right: 20px; background: #fffae6; border: 2px solid #2b2b2b; padding: 6px 16px; border-radius: 20px; font-weight: bold; box-shadow: 3px 3px 0 #2b2b2b; z-index: 1000;";
    welcomeDiv.innerHTML = `👋 欢迎，${student.name}同学 (${student.grade}年级)`;
    document.body.appendChild(welcomeDiv);
}

// 页面一加载就执行大门身份验证
document.addEventListener("DOMContentLoaded", loginStudio);


// ==========================================
// 🔒 3. 卡片点击时的“智能年级拦截” (无需重复输密码)
// ==========================================
function renderCardGroup(container, items) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:14px;'>暂未添加内容</p>";
        return;
    }

    items.forEach(item => {
        const a = document.createElement("a");
        a.className = "activity-card";
        a.href = "#"; // 阻止默认直接跳转
        a.textContent = item.name;

        // 点击卡片时的智能判断
        a.addEventListener("click", (e) => {
            e.preventDefault();
            
            // 获取当前登录的学生信息
            const studentInfo = sessionStorage.getItem("current_student");
            if (!studentInfo) {
                alert("🔒 请先进行身份验证！");
                location.reload();
                return;
            }

            const student = JSON.parse(studentInfo);

            // 🚫 防越级判断：检查当前点击的年级标签 (currentGrade) 是否匹配学生登记的年级
            if (String(student.grade) !== String(currentGrade)) {
                alert(`❌ 无法进入！本栏目属于【${currentGrade}年级】，而你是【${student.grade}年级】的学生。`);
                return;
            }

            // 年级匹配成功，直接放行跳转到游戏！
            window.location.href = item.url;
        });

        container.appendChild(a);
    });
}
// ===================================================
// ⚙️ 老师的数据配置中心 (未来增加新游戏只需在这里添加)
// ===================================================

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

    // 3 ~ 6 年级以此类推...
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

// 初始化页面
function init() {
    renderLessons();
    setupEvents();
}

// 渲染左侧单元菜单
function renderLessons() {
    const lessons = studioData[currentGrade] || [];
    lessonMenu.innerHTML = "";

    if (lessons.length === 0) {
        lessonMenu.innerHTML = "<li>暂无课程</li>";
        lessonTitle.textContent = "该年级暂无内容";
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

// 渲染右侧三块卡片内容
function renderContent(lessonData) {
    if (!lessonData) return;

    lessonTitle.textContent = lessonData.title;

    renderCardGroup(quizList, lessonData.quiz);
    renderCardGroup(reviewList, lessonData.review);
    renderCardGroup(gameList, lessonData.game);
}

// 渲染卡片组辅助函数
function renderCardGroup(container, items) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:14px;'>暂未添加内容</p>";
        return;
    }

    items.forEach(item => {
        const a = document.createElement("a");
        a.className = "activity-card";
        a.href = item.url;
        a.textContent = item.name;
        container.appendChild(a);
    });
}

function clearCards() {
    quizList.innerHTML = "";
    reviewList.innerHTML = "";
    gameList.innerHTML = "";
}

// 事件绑定
function setupEvents() {
    // 切换年级
    gradeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            gradeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentGrade = btn.dataset.grade;
            currentLessonIndex = 0;
            renderLessons();
        });
    });

    // 搜索过滤 (针对当前年级的单元)
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

init();
