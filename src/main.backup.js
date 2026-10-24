
import './style.css'

const STORAGE_KEY = 'ascend-daily-tasks'

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

    if (!Array.isArray(saved)) return []

    return saved.filter(
      (task) =>
        task &&
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        typeof task.completed === 'boolean',
    )
  } catch {
    return []
  }
}

let tasks = loadTasks()

document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#dashboard" aria-label="ASCEND الرئيسية">
        <span class="brand-mark">A</span>
        <span class="brand-name">ASCEND</span>
      </a>

      <div class="profile">
        <div class="profile-avatar">A</div>
        <div>
          <strong>رحلة الصعود</strong>
          <span>نسختك الأفضل تبدأ هنا</span>
        </div>
      </div>

      <nav class="navigation" aria-label="القائمة الرئيسية">
        <p class="nav-label">مساحة العمل</p>
        <a class="nav-link active" href="#dashboard">
          <span>◈</span> لوحة التحكم
        </a>
        <a class="nav-link" href="#stages">
          <span>▤</span> المراحل والأهداف
        </a>
        <a class="nav-link" href="#tasks">
          <span>✓</span> المهام
        </a>
        <a class="nav-link" href="#rewards">
          <span>◇</span> المكافآت
        </a>
        <a class="nav-link" href="#statistics">
          <span>↗</span> الإحصائيات
        </a>
      </nav>

      <div class="sidebar-bottom">
        <span class="status-dot"></span>
        <span>كل رحلة عظيمة تبدأ بخطوة</span>
      </div>
    </aside>

    <main class="main-content" id="dashboard">
      <header class="topbar">
        <div>
          <p class="eyebrow">نظام التطور الشخصي</p>
          <h1>لوحة التحكم</h1>
        </div>
        <div class="topbar-date" id="today-date"></div>
      </header>

      <section class="welcome">
        <div class="welcome-copy">
          <span class="welcome-tag">رحلتك تبدأ الآن</span>
          <h2>لا تنتظر الفرصة.<br />ابنِ <span>الشخص الذي يصنعها.</span></h2>
          <p>كل مهمة تنجزها اليوم تقرّبك من الحياة التي تريدها غدًا.</p>
          <a class="primary-button" href="#tasks">ابدأ العمل <span>←</span></a>
        </div>
        <div class="welcome-emblem" aria-hidden="true">
          <div class="emblem-ring ring-outer"></div>
          <div class="emblem-ring ring-inner"></div>
          <div class="emblem-core">A</div>
          <span class="emblem-caption">DISCIPLINE · GROWTH · LEGACY</span>
        </div>
      </section>

      <section class="section-block" id="statistics">
        <div class="section-heading">
          <div>
            <p class="eyebrow">نظرة عامة</p>
            <h2>تقدّمك بالأرقام</h2>
          </div>
          <span class="muted-label">رحلتك الشخصية</span>
        </div>

        <div class="stats-grid">
          <article class="stat-card">
            <span class="stat-icon">◎</span>
            <p>إنجاز المهام</p>
            <strong id="completed-stat">0 <small>مهمة</small></strong>
            <span class="stat-note" id="tasks-stat-note">ابدأ بأول إنجاز لك</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">◈</span>
            <p>المراحل المكتملة</p>
            <strong>0 <small>مرحلة</small></strong>
            <span class="stat-note">كل مرحلة لها دليل إنجاز</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">◇</span>
            <p>المكافآت المستحقة</p>
            <strong>0 <small>مكافأة</small></strong>
            <span class="stat-note">اكسبها بإنجازاتك</span>
          </article>
          <article class="stat-card">
            <span class="stat-icon">↗</span>
            <p>الالتزام اليومي</p>
            <strong>0 <small>يوم</small></strong>
            <span class="stat-note">الاستمرارية تصنع الفرق</span>
          </article>
        </div>
      </section>

      <section class="content-grid">
        <article class="panel current-stage" id="stages">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">المحطة الحالية</p>
              <h2>مرحلتك الأولى</h2>
            </div>
            <span class="stage-number">01</span>
          </div>
          <div class="stage-progress">
            <div class="progress-label">
              <span>نسبة إنجاز المهام</span>
              <strong id="progress-percent">0%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
          </div>
          <p class="stage-description">
            سنحوّل أهدافك الكبرى إلى مراحل واضحة، ثم إلى مهام صغيرة قابلة للقياس.
          </p>
          <div class="stage-footer">
            <span>🔒 فتح المراحل المتقدمة سيُضاف لاحقًا</span>
          </div>
        </article>

        <article class="panel daily-tasks" id="tasks">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">التركيز اليوم</p>
              <h2>المهام اليومية</h2>
            </div>
            <span class="task-count" id="task-count">0 / 0</span>
          </div>

          <form class="task-form" id="task-form">
            <label class="sr-only" for="task-input">اسم المهمة الجديدة</label>
            <input
              id="task-input"
              name="task"
              type="text"
              maxlength="120"
              placeholder="ما المهمة التي تريد إنجازها؟"
              autocomplete="off"
              required
            />
            <button class="primary-button task-add-button" type="submit">
              + إضافة
            </button>
          </form>

          <p class="task-feedback" id="task-feedback" role="status" aria-live="polite"></p>

          <div class="task-list" id="task-list"></div>
        </article>
      </section>

      <section class="panel rewards-panel" id="rewards">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">اعمل بذكاء، وكافئ نفسك</p>
            <h2>المكافآت القادمة</h2>
          </div>
          <span class="reward-symbol">✧</span>
        </div>
        <div class="reward-placeholder">
          <div class="reward-mini-icon">◇</div>
          <div>
            <strong>كل إنجاز يستحق التقدير</strong>
            <p>ستتمكن من تحديد مكافآتك وشروط استحقاقها وميزانيتها.</p>
          </div>
        </div>
      </section>

      <footer class="footer">
        <span>ASCEND © 2026</span>
        <span>ابنِ مستقبلك، خطوة بخطوة.</span>
      </footer>
    </main>
  </div>
`

const dateElement = document.querySelector('#today-date')

dateElement.textContent = new Intl.DateTimeFormat('ar-DZ', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

const taskForm = document.querySelector('#task-form')
const taskInput = document.querySelector('#task-input')
const taskList = document.querySelector('#task-list')
const taskCount = document.querySelector('#task-count')
const taskFeedback = document.querySelector('#task-feedback')
const completedStat = document.querySelector('#completed-stat')
const tasksStatNote = document.querySelector('#tasks-stat-note')
const progressPercent = document.querySelector('#progress-percent')
const progressFill = document.querySelector('#progress-fill')

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    return true
  } catch {
    taskFeedback.textContent = 'تعذّر حفظ التغييرات في المتصفح.'
    return false
  }
}

function renderTasks() {
  taskList.replaceChildren()

  const completed = tasks.filter((task) => task.completed).length
  const total = tasks.length
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

  taskCount.textContent = `${completed} / ${total}`
  completedStat.innerHTML = `${completed} <small>مهمة</small>`
  tasksStatNote.textContent =
    total === 0 ? 'ابدأ بأول إنجاز لك' : `أنجزت ${completed} من ${total} مهام`

  .textContent = `${percentage}%`
  progressFill.style.width = `${percentage}%`

  if (total === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty-progressPercenttasks'

    const icon = document.createElement('span')
    icon.className = 'empty-icon'
    icon.textContent = '✓'

    const title = document.createElement('strong')
    title.textContent = 'مساحة إنجازاتك جاهزة'

    const description = document.createElement('p')
    description.textContent = 'أضف أول مهمة وابدأ التقدم.'

    empty.append(icon, title, description)
    taskList.append(empty)
    return
  }

  tasks.forEach((task) => {
    const row = document.createElement('div')
    row.className = 'task-row'
    if (task.completed) row.classList.add('is-completed')

    const label = document.createElement('label')
    label.className = 'task-label'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = task.completed
    checkbox.setAttribute('aria-label', `إنجاز المهمة: ${task.title}`)

    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked
      saveTasks()
      renderTasks()
    })

    const title = document.createElement('span')
    title.className = 'task-title'
    title.textContent = task.title

    label.append(checkbox, title)

    const deleteButton = document.createElement('button')
    deleteButton.type = 'button'
    deleteButton.className = 'task-delete'
    deleteButton.textContent = 'حذف'
    deleteButton.setAttribute('aria-label', `حذف المهمة: ${task.title}`)

    deleteButton.addEventListener('click', () => {
      tasks = tasks.filter((item) => item.id !== task.id)
      saveTasks()
      taskFeedback.textContent = 'تم حذف المهمة.'
      renderTasks()
    })

    row.append(label, deleteButton)
    taskList.append(row)
  })
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const title = taskInput.value.trim()

  if (!title) {
    taskFeedback.textContent = 'اكتب اسم المهمة أولًا.'
    taskInput.focus()
    return
  }

  tasks.push({
    id: crypto.randomUUID(),
    title,
    completed: false,
  })

  if (!saveTasks()) {
    tasks.pop()
    return
  }

  taskForm.reset()
  taskFeedback.textContent = 'تمت إضافة المهمة وحفظها.'
  renderTasks()
  taskInput.focus()
})

renderTasks()

