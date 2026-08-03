// 1. Firebase 官方密钥配置
const firebaseConfig = {
  apiKey: "AIzaSyAqp_1JyuAtpQgJtnFRLhuVEmUIrx1YetI",
  authDomain: "my-teacher-studio.firebaseapp.com",
  projectId: "my-teacher-studio",
  storageBucket: "my-teacher-studio.firebasestorage.app",
  messagingSenderId: "82774284780",
  appId: "1:82774284780:web:e29680ea7a0e5c435ec8c9"
};

// 初始化 Firebase 及 Firestore
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 2. 页面加载完成检查登录状态
document.addEventListener("DOMContentLoaded", function() {
    const savedUser = localStorage.getItem("studentName");
    if (savedUser) {
        showLoggedInState(savedUser);
    } else {
        document.getElementById("login-modal").style.display = "flex";
    }
    
    // 初始化模拟单元数据
    initLessons();
});

// 3. 核心：使用密码去 Firestore 查询 matching 记录
function handleLogin() {
    const pwdInput = document.getElementById("login-password").value.trim().toUpperCase();
    const errorMsg = document.getElementById("login-error-msg");
    errorMsg.innerText = "";

    if (!pwdInput) {
        errorMsg.innerText = "⚠️ 请输入通行密码！";
        return;
    }

    // 查询 Firestore 集合 'users' 中 password 等于输入值的文档
    db.collection("users")
      .where("password", "==", pwdInput)
      .get()
      .then((querySnapshot) => {
          if (!querySnapshot.empty) {
              // 匹配到了用户
              let userData = null;
              querySnapshot.forEach((doc) => {
                  userData = doc.data();
              });

              const studentName = userData.name || userData.username || pwdInput;
              
              // 存入本地缓存
              localStorage.setItem("studentName", studentName);
              showLoggedInState(studentName);
          } else {
              errorMsg.innerText = "❌ 密码无效，请重新输入！";
          }
      })
      .catch((error) => {
          console.error("Firestore 查询报错:", error);
          errorMsg.innerText = "⚠️ 网络连接异常，请重试。";
      });
}

// 4. 显示登录状态
function showLoggedInState(name) {
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("logout-btn").style.display = "block";
    document.getElementById("welcome-bar").innerText = `👋 嗨，${name}！今天也要加油哦！✨`;
}

// 5. 退出登录
function handleLogout() {
    localStorage.removeItem("studentName");
    document.getElementById("login-password").value = "";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("login-modal").style.display = "flex";
}

// 6. 辅助：菜单渲染逻辑示例
function initLessons() {
    const lessonMenu = document.getElementById("lesson-menu");
    const lessons = ["单元一：认识数词", "单元二：词语积累", "单元三：古诗朗诵", "单元四：阅读理解"];
    
    lessonMenu.innerHTML = "";
    lessons.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerText = item;
        if (index === 0) li.classList.add("active");
        li.onclick = function() {
            document.querySelectorAll("#lesson-menu li").forEach(el => el.classList.remove("active"));
            li.classList.add("active");
            document.getElementById("current-lesson-title").innerText = item;
        };
        lessonMenu.appendChild(li);
    });
    
    document.getElementById("current-lesson-title").innerText = lessons[0];
}
