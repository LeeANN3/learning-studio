// ==========================================
// 🔒 1. 测验云端门禁 (防越级 + 防绕过 + 周动态密码)
// ==========================================
const THIS_QUIZ_GRADE = "1"; // 本测验所属年级 (如果是二年级游戏就改为 "2")

async function checkQuizAccess() {
    // 1. 检查主页是否已经登录
    const studentInfoStr = sessionStorage.getItem("current_student");
    if (!studentInfoStr) {
        alert("🔒 请先从主页登录你的学生通行码！");
        window.location.href = "../index.html"; // 退回主页
        return;
    }

    const student = JSON.parse(studentInfoStr);

    // 2. 拦截越级学生
    if (String(student.grade) !== String(THIS_QUIZ_GRADE)) {
        alert(`❌ 本测验属于【${THIS_QUIZ_GRADE}年级】，而你登记的年级是【${student.grade}年级】！`);
        window.location.href = "../index.html";
        return;
    }

    // 3. 校验本周游戏动态密码 (同一个浏览器 session 内只弹窗验证一次)
    const isGradeAuth = sessionStorage.getItem(`auth_quiz_g${THIS_QUIZ_GRADE}`);
    if (!isGradeAuth) {
        const input = prompt(`🔒 请输入【${THIS_QUIZ_GRADE}年级】本周游戏密码 (例: ${student.id}????)：`);
        if (!input || input.length < 4) {
            alert("❌ 格式不正确！");
            window.location.href = "../index.html";
            return;
        }

        const idPrefix = input.substring(0, 3).toUpperCase();
        const quizPass = input.substring(3);

        try {
            // 从 Firebase 获取本周最新的年级密码
            const passDoc = await db.collection("setting").doc("password").get();
            const correctQuizPass = passDoc.data()[`grade${THIS_QUIZ_GRADE}`];

            if (idPrefix === student.id && quizPass === correctQuizPass) {
                sessionStorage.setItem(`auth_quiz_g${THIS_QUIZ_GRADE}`, "true");
            } else {
                alert("❌ 游戏密码或身份代号错误！");
                document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px;'>🔒 密码错误，无权访问此测验！</h2>";
            }
        } catch (error) {
            console.error("验证失败:", error);
            alert("❌ 网络错误，无法验证密码！");
            window.location.href = "../index.html";
        }
    }
}


// ==========================================
// 2. 初始化 Firebase 云数据库
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


// ==========================================
// 3. 云端排行榜功能函数 (自动使用真实姓名)
// ==========================================

// 自动保存成绩到云端数据库 (无需手动输入名字)
function saveScoreToCloud() {
    const studentInfoStr = sessionStorage.getItem("current_student");
    if (!studentInfoStr) {
        alert("未读取到你的身份信息，请返回主页重新登录！");
        return;
    }

    const student = JSON.parse(studentInfoStr);

    if (saveScoreBtn) saveScoreBtn.disabled = true;

    db.collection("leaderboard").add({
        grade: THIS_QUIZ_GRADE,
        name: student.name, // 自动读取真实姓名 (例如: 张丽丽)
        score: Number(score),
        time: Number(seconds),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert(`🎉 成绩已成功同步至云端！表现很棒，${student.name}同学！`);
        loadCloudLeaderboard(); // 提交成功后立刻刷新排行榜
    })
    .catch((error) => {
        console.error("成绩保存失败: ", error);
        alert("保存失败，请检查网络后再试！");
        if (saveScoreBtn) saveScoreBtn.disabled = false;
    });
}

// 从云端加载排行榜
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

let questionType = "english"; 
let answerType = "chinese";   
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
// 初始更新首页 (加载门禁 + 排行榜)
// ==========================================

if (totalQuestionText) {
    totalQuestionText.textContent = `${TOTAL_QUESTIONS} Questions`;
}

// 页面加载完成后自动执行门禁校验与排行榜读取
document.addEventListener("DOMContentLoaded", () => {
    checkQuizAccess();
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

if (startBtn) {
    startBtn.addEventListener("click", () => {
        if (saveScoreBtn) saveScoreBtn.disabled = false;
        startGame();
    });
}

if (restartBtn) {
    restartBtn.addEventListener("click", () => {
        if (saveScoreBtn) saveScoreBtn.disabled = false;
        startGame();
    });
}

if (saveScoreBtn) {
    saveScoreBtn.addEventListener("click", saveScoreToCloud);
}
