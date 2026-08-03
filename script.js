// 设置固定秘密密码
const SECRET_CODE = "ZSY8888";

// 初始化页面状态
document.addEventListener("DOMContentLoaded", () => {
  updateUIState();
});

// 点击顶部登录/解锁按钮
function handleAuthClick() {
  const isUnlocked = sessionStorage.getItem("isUnlocked");

  if (isUnlocked === "true") {
    // 如果已经解锁，点击则是“锁定/退出”
    if (confirm("确定要锁定页面并退出吗？")) {
      sessionStorage.removeItem("isUnlocked");
      updateUIState();
    }
  } else {
    // 未解锁，弹出 prompt 提示框要求输入密码
    promptForPassword();
  }
}

// 弹出输入框验证密码
function promptForPassword() {
  const userInput = prompt("请输入解锁秘密 (ZSY8888)：");

  if (userInput === null) {
    return; // 用户点击取消
  }

  // 忽略大小写转换比较
  if (userInput.trim().toUpperCase() === SECRET_CODE.toUpperCase()) {
    sessionStorage.setItem("isUnlocked", "true");
    alert("✨ 验证成功！欢迎解锁学习空间。");
    updateUIState();
    return true;
  } else {
    alert("❌ 密码错误！请重试。");
    return false;
  }
}

// 保护某些操作：如果没解锁，就先弹窗要求填密码
function checkAuthAndRun(callback) {
  const isUnlocked = sessionStorage.getItem("isUnlocked") === "true";
  if (isUnlocked) {
    if (callback) callback();
  } else {
    const success = promptForPassword();
    if (success && callback) {
      callback();
    }
  }
}

// 更新顶部的按钮和文字状态
function updateUIState() {
  const isUnlocked = sessionStorage.getItem("isUnlocked") === "true";
  const authBtn = document.getElementById("auth-btn");
  const userDisplay = document.getElementById("user-display-name");

  if (isUnlocked) {
    if (authBtn) {
      authBtn.innerText = "🔒 退出解锁";
      authBtn.style.background = "#FFE5EC";
      authBtn.style.color = "#D90429";
    }
    if (userDisplay) userDisplay.innerText = "VIP 同学";
  } else {
    if (authBtn) {
      authBtn.innerText = "🔑 输入密码解锁";
      authBtn.style.background = "#E8F0FE";
      authBtn.style.color = "#4A4E69";
    }
    if (userDisplay) userDisplay.innerText = "同学";
  }
}

/* ================= UI 交互逻辑 ================= */

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
  // 隐藏所有视图
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active-view');
  });

  // 移除底部导航栏的高亮激活状态
  if (el) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
  }

  // 显示对应视图
  const targetView = document.getElementById('view-' + tabName);
  if (targetView) {
    targetView.classList.add('active-view');
  }

  // 如果点击消息，清除作业未读红点
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
    <div class="light-card sub-card card-homework" style="height: auto; margin-bottom:12px;">
      <div class="card-title">🔍 搜索结果：“${query}”</div>
      <div class="slogan" style="margin-top:6px;">为你找到与 “${query}” 相关的 3 个课程与练习</div>
    </div>
  `;
}
