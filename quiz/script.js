// ==========================================
// ⚙️ 老师设定区 (在这里控制本次测试的模式)
// ==========================================

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


// ==========================================
// 初始更新首页
// ==========================================

totalQuestionText.textContent = `${TOTAL_QUESTIONS} Questions`;
renderLeaderboard();


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
// 显示题目 (根据老师设定的 questionType / answerType 显示)
// ==========================================

function showQuestion() {
    optionsDiv.innerHTML = "";

    const currentWord = questionList[currentQuestionIndex];

    questionNumber.textContent = `Question ${currentQuestionIndex + 1} / ${questionList.length}`;

    // 1. 读取老师设定的出题类型 (若设置不规范则默认用 english)
    const promptText = currentWord[questionType] || currentWord.english;
    questionText.textContent = promptText;

    // 2. 生成选项
    const choices = createChoices(currentWord);

    choices.forEach(choice => {
        const button = document.createElement("button");
        button.className = "option-btn";

        // 读取老师设定的答案类型 (若设置不规范则默认用 chinese)
        button.textContent = choice[answerType] || choice.chinese;
        button.dataset.id = choice.id;

        button.addEventListener("click", () => {
            checkAnswer(button, choice, currentWord);
        });

        optionsDiv.appendChild(button);
    });
}


// ==========================================
// 建立选项 (1个正确答案 + 3个随机干扰项)
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
// 答题检查 (自动提供红绿视觉反馈)
// ==========================================

function checkAnswer(selectedButton, selectedChoice, currentWord) {
    const buttons = optionsDiv.querySelectorAll(".option-btn");
    buttons.forEach(btn => btn.disabled = true);

    if (selectedChoice.id === currentWord.id) {
        score += 10;
        scoreText.textContent = `Score : ${score}`;
        selectedButton.classList.add("correct");
    } else {
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
// 排行榜逻辑 (使用本地 LocalStorage 存储)
// ==========================================

function saveScore() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert("请输入学生名字！");
        return;
    }

    const leaderboard = JSON.parse(localStorage.getItem("quiz_leaderboard") || "[]");

    const newRecord = {
        name: name,
        score: score,
        time: seconds,
        date: new Date().toLocaleDateString()
    };

    leaderboard.push(newRecord);

    // 排序逻辑：高分优先，同分者用时短优先
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.time - b.time;
    });

    const top10 = leaderboard.slice(0, 10);
    localStorage.setItem("quiz_leaderboard", JSON.stringify(top10));

    alert("成绩已保存！");
    playerNameInput.value = "";
    if (saveScoreBtn) saveScoreBtn.disabled = true;
    renderLeaderboard();
}

function renderLeaderboard() {
    if (!leaderboardList) return;

    const leaderboard = JSON.parse(localStorage.getItem("quiz_leaderboard") || "[]");
    leaderboardList.innerHTML = "";

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = "<li>暂无排名数据</li>";
        return;
    }

    leaderboard.forEach((record, index) => {
        const li = document.createElement("li");
        li.textContent = `#${index + 1} ${record.name} - ${record.score}分 (${record.time}秒)`;
        leaderboardList.appendChild(li);
    });
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