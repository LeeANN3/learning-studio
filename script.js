// 页面加载完成时强行检查登录
document.addEventListener("DOMContentLoaded", () => {
  checkLoginState();
  showSection('courses'); // 默认载入“单元课程”列表
});

/* ================= 1. 强登录限制逻辑 ================= */

function handleLogin() {
  const prefixInput = document.getElementById("student-prefix").value.trim().toUpperCase();
  const passInput = document.getElementById("student-pass").value.trim().toUpperCase();
  const errorMsg = document.getElementById("login-error");

  if (!prefixInput) {
    errorMsg.innerText = "请输入名字首字母 (如 ZSY)！";
    return;
  }

  // 计算正确的目标密码：名字前缀 + 8888 (例如 ZSY -> ZSY8888)
  const expectedPassword = prefixInput + "8888";

  if (passInput === expectedPassword) {
    // 验证成功，保存 session 状态
    sessionStorage.setItem("currentUser", prefixInput + " 同学");
    sessionStorage.setItem("isLoggedIn", "true");
    
    errorMsg.innerText = "";
    document.getElementById("user-display-name").innerText = prefixInput + " 同学";
    
    // 解除登录遮罩
    document.getElementById("login-modal").style.display = "none";
  } else {
    errorMsg.innerText = `密码错误！密码格式应为: ${prefixInput}8888`;
  }
}

// 检查 sessionStorage 中的登录状态
function checkLoginState() {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  const modal = document.getElementById("login-modal");
  
  if (isLoggedIn === "true") {
    modal.style.display = "none";
    const user = sessionStorage.getItem("currentUser") || "同学";
    document.getElementById("user-display-name").innerText = user;
  } else {
    // 没登录则展现全屏遮罩，无法操作主界面
    modal.style.display = "flex";
  }
}

// 退出登录
function handleLogout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("currentUser");
  location.reload();
}

/* ================= 2. 测验/游戏/课程数据与跳转逻辑 ================= */

// 各大分类对应的数据与外链
const sectionData = {
  courses: {
    title: "📖 单元课程列表",
    items: [
      { name: "第一单元: 认识分数与小数", desc: "基础知识讲解 + 动画演示", actionText: "开始学习", url: "https://quizizz.com" },
      { name: "第二单元: 三位数加减法", desc: "进位与退位计算技巧", actionText: "开始学习", url: "https://quizizz.com" },
      { name: "第三单元: 图形与几何初探", desc: "认识周长与面积公式", actionText: "开始学习", url: "https://quizizz.com" }
    ]
  },
  tests: {
    title: "✏️ 单元测验 (Quiz)",
    items: [
      { name: "📝 分数入门在线测验", desc: "共 10 题 | 限时 15 分钟", actionText: "进入测验", url: "https://quizizz.com" },
      { name: "📝 加减速算小挑战", desc: "共 15 题 | 限时 10 分钟", actionText: "进入测验", url: "https://wordwall.net" },
      { name: "📝 期中综合摸底测验", desc: "共 20 题 | 全面检验", actionText: "进入测验", url: "https://quizizz.com" }
    ]
  },
  reviews: {
    title: "🔄 错题集中复习",
    items: [
      { name: "⚠️ 分数分母混淆题 (错 2 次)", desc: "强化练习：同分母比较大小", actionText: "错题重做", url: "https://quizizz.com" },
      { name: "⚠️ 两位数乘法退位计算", desc: "强化练习：笔算步骤复查", actionText: "错题重做", url: "https://quizizz.com" }
    ]
  },
  games: {
    title: "🎮 互动数学小游戏",
    items: [
      { name: "🏴‍☠️ 算术寻宝大冒险", desc: "通过快速口算解锁宝箱", actionText: "开始游戏", url: "https://wordwall.net" },
      { name: "🏎️ 乘法表赛车竞速", desc: "答对题目为赛车加速！", actionText: "开始游戏", url: "https://wordwall.net" }
    ]
  }
};

// 点击四大功能卡片时，在下方渲染对应列表
function showSection(type) {
  const container = document.getElementById("dynamic-list");
  const titleText = document.getElementById("list-title-text");
  const data = sectionData[type];

  if (!data) return;

  titleText.innerText = data.title;
  container.innerHTML = "";

  data.items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-row-card";
    card.innerHTML = `
      <div>
        <div class="item-info-title">${item.name}</div>
        <div class="item-info-sub">${item.desc}</div>
      </div>
      <div class="action-tag-btn" onclick="openQuiz('${item.url}')">${item.actionText}</div>
    `;
    container.appendChild(card);
  });
}

// 打开外部 Quiz 或游戏链接
function openQuiz(url) {
  if (!url) {
    alert("暂未配置测验链接！");
    return;
  }
  // 直接在新窗口打开你的 Quiz / Wordwall 游戏
  window.open(url, "_blank");
}

/* ================= 3. UI 交互逻辑 ================= */

// 打开侧边抽屉
function openDrawer() {
  document.getElementById('drawer-overlay').classList.add('open');
}

// 关闭侧边抽屉
function closeDrawer(e) {
  document.getElementById('drawer-overlay').classList.remove('open');
}

// 选择年级并切换视图
function selectGrade(gradeName) {
  closeDrawer();
  document.getElementById('current-grade-title').innerText = gradeName;
  document.getElementById('nav-grade-label').innerText = gradeName;
  switchTab('grade-detail');
}

// Tab 切换逻辑
function switchTab(tabName, el) {
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active-view');
  });

  if (el) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
  }

  const targetView = document.getElementById('view-' + tabName);
  if (targetView) {
    targetView.classList.add('active-view');
  }

  if (tabName === 'message') {
    const badge = document.getElementById('homework-badge');
    if (badge) badge.style.display = 'none';
  }
}

// 搜索栏逻辑
function handleSearch() {
  const query = document.getElementById('search-input').value.trim();
  const resultsContainer = document.getElementById('search-results');
  
  if (!query) {
    resultsContainer.innerHTML = `
      <div class="light-card welcome-bar">
        <div class="slogan">💡 尝试输入“分数”、“乘法”或“测验”搜索内容吧！</div>
      </div>`;
    return;
  }

  resultsContainer.innerHTML = `
    <div class="light-card sub-card card-homework" style="height: auto; margin-bottom:12px;" onclick="openQuiz('https://quizizz.com')">
      <div class="card-title">🔍 点击开启“${query}”相关测验</div>
      <div class="slogan" style="margin-top:6px;">为你匹配到了针对“${query}”的互动练习</div>
    </div>
  `;
}
