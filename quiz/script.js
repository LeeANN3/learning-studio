// ==========================================
// 1. 初始化 Firebase 云数据库
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAqp_1JyuAtpQgJtnFRLhuVEmUIrx1YetI",
  authDomain: "my-teacher-studio.firebaseapp.com",
  projectId: "my-teacher-studio",
  storageBucket: "my-teacher-studio.firebasestorage.app",
  messagingSenderId: "82774284780",
  appId: "1:82774284780:web:e29680ea7a0e5c435ec8c9",
  measurementId: "G-1ME126HTVP"
};

// 初始化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


// ==========================================
// 2. 云端排行榜功能函数 (Firebase)
// ==========================================

// 保存成绩到云端数据库
function saveScoreToCloud() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert("请输入学生名字！");
        return;
    }

    if (saveScoreBtn) saveScoreBtn.disabled = true;

    db.collection("leaderboard").add({
        name: name,
        score: Number(score),
        time: Number(seconds),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("成绩已成功同步至云端！");
        playerNameInput.value = "";
        loadCloudLeaderboard(); // 提交成功后立刻刷新排行榜
    })
    .catch((error) => {
        console.error("成绩保存失败: ", error);
        alert("保存失败，请检查网络后再试！");
        if (saveScoreBtn) saveScoreBtn.disabled = false;
    });
}

// 从云端加载排行榜 (按分数从高到低，用时从短到长)
function loadCloudLeaderboard() {
    if (!leaderboardList) return;

    leaderboardList.innerHTML = "<li>加载中...</li>";

    db.collection("leaderboard")
      .orderBy("score", "desc")
      .orderBy("time", "asc")
      .limit(10)
      .get()
      .then((querySnapshot) => {
          leaderboardList.innerHTML = "";
          if (querySnapshot.empty) {
              leaderboardList.innerHTML = "<li>暂无排名，快来抢占第一名吧！</li>";
              return;
          }

          let rank = 1;
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              const li = document.createElement("li");
              
              // 加上前三名的奖牌小图标
              let medal = "";
              if (rank === 1) medal = "🥇 ";
              else if (rank === 2) medal = "🥈 ";
              else if (rank === 3) medal = "🥉 ";

              li.textContent = `${medal}第${rank}名: ${data.name} - ${data.score}分 (${data.time}秒)`;
              leaderboardList.appendChild(li);
              rank++;
          });
      })
      .catch((error) => {
          console.error("读取排行榜失败: ", error);
          leaderboardList.innerHTML = "<li>排行榜加载失败</li>";
      });
}


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
// 初始更新首页 (加载云端排行榜)
// ==========================================

totalQuestionText.textContent = `${TOTAL_QUESTIONS} Questions`;

// 页面加载完成后自动获取云端排行榜
document.addEventListener("DOMContentLoaded", () => {
    loadCloudLeaderboard();
});


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

// 绑定云端保存逻辑
if (saveScoreBtn) {
    saveScoreBtn.addEventListener("click", saveScoreToCloud);
}
