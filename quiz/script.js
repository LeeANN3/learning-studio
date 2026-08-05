// ==========================================
// ⚙️ 老师设定区 (控制本次测验模式与元数据)
// ==========================================

// 📌 测验元数据配置 (用于控制台分类、搜索与筛选)
const QUIZ_INFO = {
    quizId: "testing_quiz_01",       // 测验唯一 ID
    quizTitle: "testing quiz",       // 测验名字/标题 (后台搜索时使用的名字)
    subject: "chinese",              // 科目: "chinese" | "malay" | "english" | "math" | "science"
    grade: 1,                        // 年级: 1 ~ 6
    unit: 1                          // 单元: 1 ~ 10
};

// 出题类型：可选 "english" | "chinese" | "pinyin"
let questionType = "english"; 

// 选项答案类型：可选 "english" | "chinese" | "pinyin"
let answerType = "chinese";   

// 每次游戏最多出几题
const TOTAL_QUESTIONS = 20; 


// ==========================================
// HTML 元件
// ==========================================

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const saveScoreBtn = document.getElementById("save-score-btn");

const questionText = document.getElementById("question");
const optionsDiv = document.getElementById("options");

const questionNumber = document.getElementById("question-number");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");

const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");

const totalQuestionText = document.getElementById("total-question-text");
const playerNameInput = document.getElementById("player-name");
const leaderboardList = document.getElementById("leaderboard-list");


// ==========================================
// 游戏变量
// ==========================================

let questionList = [];
let currentQuestionIndex = 0;
let score = 0;
let seconds = 0;
let timer = null;
let wrongCount = 0; // 错题计数器


// ==========================================
// 初始更新首页与加载 Firebase 排行榜
// ==========================================

if (totalQuestionText) {
    totalQuestionText.textContent = `${TOTAL_QUESTIONS} Questions`;
}

// 页面加载完成后拉取云端榜单
if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            renderLeaderboard();
        }
    });
}


// ==========================================
// Fisher-Yates Shuffle 随机洗牌算法
// ==========================================

function shuffle(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


// ==========================================
// 建立题目
// ==========================================

function generateQuestions() {
    questionList = shuffle(words);
    if (questionList.length > TOTAL_QUESTIONS) {
        questionList = questionList.slice(0, TOTAL_QUESTIONS);
    }
}


// ==========================================
// 开始游戏
// ==========================================

function startGame() {
    score = 0;
    seconds = 0;
    wrongCount = 0;
    currentQuestionIndex = 0;

    scoreText.textContent = "Score : 0";

    generateQuestions();

    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    startTimer();
    showQuestion();
}


// ==========================================
// 显示题目
// ==========================================

function showQuestion() {
    optionsDiv.innerHTML = "";

    const currentWord = questionList[currentQuestionIndex];

    questionNumber.textContent = `Question ${currentQuestionIndex + 1} / ${questionList.length}`;

    const promptText = currentWord[questionType] || currentWord.english;
    questionText.textContent = promptText;

    const choices = createChoices(currentWord);

    choices.forEach(choice => {
        const button = document.createElement("button");
        button.className = "option-btn";

        button.textContent = choice[answerType] || choice.chinese;
        button.dataset.id = choice.id;

        button.addEventListener("click", () => {
            checkAnswer(button, choice, currentWord);
        });

        optionsDiv.appendChild(button);
    });
}


// ==========================================
// 建立选项
// ==========================================

function createChoices(correctWord) {
    const wrongWords = words.filter(word => word.id !== correctWord.id);
    const shuffledWrong = shuffle(wrongWords);
    const choices = [
        correctWord,
        ...shuffledWrong.slice(0, 3)
    ];

    return shuffle(choices);
}


// ==========================================
// 答题检查 (自动记录错题数)
// ==========================================

function checkAnswer(selectedButton, selectedChoice, currentWord) {
    const buttons = optionsDiv.querySelectorAll(".option-btn");
    buttons.forEach(btn => btn.disabled = true);

    if (selectedChoice.id === currentWord.id) {
        score += 10;
        scoreText.textContent = `Score : ${score}`;
        selectedButton.classList.add("correct");
    } else {
        wrongCount++; // 答错时累加错题数
        selectedButton.classList.add("wrong");
        buttons.forEach(btn => {
            if (parseInt(btn.dataset.id) === currentWord.id) {
                btn.classList.add("correct");
            }
        });
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questionList.length) {
            showQuestion();
        } else {
            endGame();
        }
    }, 600);
}


// ==========================================
// 计时器
// ==========================================

function startTimer() {
    clearInterval(timer);
    timerText.textContent = "Time: 0s";
    timer = setInterval(() => {
        seconds++;
        timerText.textContent = `Time: ${seconds}s`;
    }, 1000);
}


// ==========================================
// 游戏结算
// ==========================================

function endGame() {
    clearInterval(timer);

    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    finalScore.textContent = `Final Score: ${score}`;
    finalTime.textContent = `Total Time: ${seconds} seconds`;
}


// ==========================================
// 🔥 Firebase 实时榜单与保存逻辑 (替换原 LocalStorage)
// ==========================================

async function saveScore() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("⚠️ 未登录账号，请先登录后再提交成绩！");
        return;
    }

    if (saveScoreBtn) {
        saveScoreBtn.disabled = true;
        saveScoreBtn.textContent = "保存中...";
    }

    try {
        const db = firebase.firestore();

        // 1. 获取学生的账号详细数据 (班级、姓名等)
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.data() || {};

        const studentName = playerNameInput && playerNameInput.value.trim() 
            ? playerNameInput.value.trim() 
            : (userData.name || user.displayName || "未命名学生");

        const studentClassCode = (userData.enrolledClasses && userData.enrolledClasses.length > 0)
            ? userData.enrolledClasses[0]
            : "未划分班级";

        // 2. 查询该学生之前提交过多少次本测验 (自动计算尝试次数)
        const existingRecords = await db.collection("leaderboard")
            .where("studentUid", "==", user.uid)
            .where("quizId", "==", QUIZ_INFO.quizId)
            .get();

        const attemptsCount = existingRecords.size + 1; // 本次为第 N 次尝试

        // 3. 格式化用时文本 (如 80 秒 -> "01:20")
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        const timeTextStr = `${mins}:${secs}`;

        // 4. 写入 Firebase leaderboard 集合
        await db.collection("leaderboard").add({
            studentUid: user.uid,
            playerName: studentName,
            classCode: studentClassCode,

            quizId: QUIZ_INFO.quizId,
            quizTitle: QUIZ_INFO.quizTitle,
            subject: QUIZ_INFO.subject,
            grade: QUIZ_INFO.grade,
            unit: QUIZ_INFO.unit,

            score: Number(score),
            timeSpent: Number(seconds),
            timeText: timeTextStr,
            attemptsCount: attemptsCount,
            wrongAnswersCount: wrongCount,

            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "active"
        });

        alert("🎉 成绩已成功同步到教师后台排行榜！");
        if (playerNameInput) playerNameInput.value = "";
        renderLeaderboard();

    } catch (err) {
        console.error("保存成绩到 Firebase 失败:", err);
        alert("⚠️ 成绩保存失败：" + err.message);
        if (saveScoreBtn) saveScoreBtn.disabled = false;
    } finally {
        if (saveScoreBtn) saveScoreBtn.textContent = "保存成绩";
    }
}

// 渲染本游戏云端前 10 名排行榜
async function renderLeaderboard() {
    if (!leaderboardList || typeof firebase === 'undefined') return;

    try {
        const db = firebase.firestore();
        const snapshot = await db.collection("leaderboard")
            .where("quizId", "==", QUIZ_INFO.quizId)
            .orderBy("score", "desc")
            .limit(10)
            .get();

        leaderboardList.innerHTML = "";

        if (snapshot.empty) {
            leaderboardList.innerHTML = "<li>暂无排名数据</li>";
            return;
        }

        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === "pending_delete") return;

            const li = document.createElement("li");
            li.textContent = `#${rank} ${data.playerName} (${data.classCode || '无班级'}) - ${data.score}分 (${data.timeText || data.timeSpent + '秒'})`;
            leaderboardList.appendChild(li);
            rank++;
        });

    } catch (err) {
        console.error("读取云端排行榜失败:", err);
    }
}


// ==========================================
// 事件绑定
// ==========================================

startBtn.addEventListener("click", () => {
    if (saveScoreBtn) saveScoreBtn.disabled = false;
    startGame();
});

restartBtn.addEventListener("click", () => {
    if (saveScoreBtn) saveScoreBtn.disabled = false;
    startGame();
});

if (saveScoreBtn) {
    saveScoreBtn.addEventListener("click", saveScore);
}
