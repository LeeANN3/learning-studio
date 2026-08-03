// Google Sheet API / CSV 配置
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjE_fJvP2A87Xj5S4-7NlD9bQpA-4y21nC_r9R/pub?output=csv"; 

let studentsData = {};

// 初始化：检查登录状态与拉取学生数据
document.addEventListener("DOMContentLoaded", () => {
  checkLoginState();
  fetchStudentList();
});

// 从 Google Sheets 异步拉取学生与密码数据
async function fetchStudentList() {
  const select = document.getElementById("student-select");
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csvText = await res.text();
    
    // 解析 CSV 行
    const rows = csvText.split("\n").map(row => row.split(","));
    studentsData = {};
    
    // 清空下拉框
    select.innerHTML = '<option value="">-- 请选择你的名字 --</option>';

    // 从第 2 行开始解析（第 1 行为表头）
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i] || rows[i].length < 2) continue;
      const name = rows[i][0].trim();
      const pass = rows[i][1].trim();

      if (name) {
        studentsData[name] = pass;
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      }
    }
  } catch (err) {
    console.error("无法加载学生名单:", err);
    select.innerHTML = '<option value="">加载失败，请刷新页面</option>';
  }
}

// 登录验证逻辑
function handleLogin() {
  const selectName = document.getElementById("student-select").value;
  const inputPass = document.getElementById("student-pass").value.trim();
  const errorMsg = document.getElementById("login-error");

  if (!selectName) {
    errorMsg.innerText = "请先选择你的名字！";
    return;
  }

  const correctPass = studentsData[selectName];

  if (inputPass === correctPass) {
    // 保存登录状态
    sessionStorage.setItem("currentUser", selectName);
    errorMsg.innerText = "";
    
    // 更新页面展示
    document.getElementById("user-display-name").innerText = selectName;
    
    // 隐藏登录弹窗
    const modal = document.getElementById("login-modal");
    if (modal) modal.style.display = "none";
  } else {
    errorMsg.innerText = "密码不对哦，再试一次吧！";
  }
}

// 检查 sessionStorage 中的登录状态
function checkLoginState() {
  const currentUser = sessionStorage.getItem("currentUser");
  const modal = document.getElementById("login-modal");
  
  if (currentUser) {
    if (modal) modal.style.display = "none";
    document.getElementById("user-display-name").innerText = currentUser;
  } else {
    if (modal) modal.style.display = "flex";
  }
}

// 退出登录
function handleLogout() {
  sessionStorage.removeItem("currentUser");
  location.reload();
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
