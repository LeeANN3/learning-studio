// ==========================================
// ⚙️ 老师设定区 (控制本次测验模式与元数据)
// ==========================================

const QUIZ_INFO = {
    quizId: "testing_quiz_01",       // 测验唯一 ID
    quizTitle: "testing quiz",       // 测验名字/标题
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

const questionText = document.getElementById("question");
const optionsDiv = document.getElementById("options");

const questionNumber = document.getElementById("question-number");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");

const finalScore = document.getElementById("final-score");
const finalTime = document.getElementById("final-time");

const totalQuestionText = document.getElementById("total-question-text");


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
// 初始更新首页
// ==========================================

if (totalQuestionText) {
    totalQuestionText.textContent = `${TOTAL_QUESTIONS} Questions`;
}


// ==========================================
// Fisher-Yates Shuffle 随机洗牌算法
// ==========================================

function shuffle(array) {
    if (!array || !Array.isArray(array)) return [];
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


// ==========================================
// 建立题目 (带容错校验)
// ==========================================

function generateQuestions() {
    // 检查 words 变量是否存在
    const sourceWords = (typeof words !== 'undefined') ? words : [];
    if (sourceWords.length === 0) {
        alert("⚠️ 错误：未找到题目数据！请检查 lesson1.js 是否成功加载且包含了 words 数组。");
        return;
    }
    questionList = shuffle(sourceWords);
    if (questionList.length > TOTAL_QUESTIONS) {
        questionList = questionList.slice(0, TOTAL_QUESTIONS);
    }
}


// ==========================================
// 开始游戏 (核心启动函数)
// ==========================================

function startGame() {
    score = 0;
    seconds = 0;
    wrongCount = 0;
    currentQuestionIndex = 0;

    scoreText.textContent = "Score : 0";

    generateQuestions();

    if (questionList.length === 0) return; // 无题目时不跳转

    if (startScreen) startScreen.classList.add("hidden");
    if (resultScreen) resultScreen.classList.add("hidden");
    if (quizScreen) quizScreen.classList.remove("hidden");

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

    const promptText = currentWord[questionType] || currentWord.english || "题目";
    questionText.textContent = promptText;

    const choices = createChoices(currentWord);

    choices.forEach(choice => {
        const button = document.createElement("button");
        button.className = "option-btn";

        button.textContent = choice[answerType] || choice.chinese || "选项";
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
    const sourceWords = (typeof words !== 'undefined') ? words : [];
    const wrongWords = sourceWords.filter(word => word.id !== correctWord.id);
    const shuffledWrong = shuffle(wrongWords);
    const choices = [
        correctWord,
        ...shuffledWrong.slice(0, 3)
    ];

    return shuffle(choices);
}


// ==========================================
// 答题检查
// ==========================================

function checkAnswer(selectedButton, selectedChoice, currentWord) {
    const buttons = optionsDiv.querySelectorAll(".option-btn");
    buttons.forEach(btn => btn.disabled = true);

    if (selectedChoice.id === currentWord.id) {
        score += 10;
        scoreText.textContent = `Score : ${score}`;
        selectedButton.classList.add("correct");
    } else {
        wrongCount++;
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

    if (quizScreen) quizScreen.classList.add("hidden");
    if (resultScreen) resultScreen.classList.remove("hidden");

    finalScore.textContent = `Final Score: ${score}`;
    finalTime.textContent = `Total Time: ${seconds} seconds`;
}


// ==========================================
// 事件绑定 (确保 DOM 加载后正确绑定)
// ==========================================

if (startBtn) {
    startBtn.addEventListener("click", startGame);
}

if (restartBtn) {
    restartBtn.addEventListener("click", startGame);
}
