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
                { name: "📝 词汇识别测验", url: "./quiz/index.html" }
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
                { name: "📝 动物拼音测验", url: "./quiz/index.html" }
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
