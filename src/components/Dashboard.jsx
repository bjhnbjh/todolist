import { memo } from 'react';

const Dashboard = memo(({ tasks }) => {
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const overdueTasks = activeTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date()
  );

  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high');
  const mediumPriorityTasks = activeTasks.filter(t => t.priority === 'medium');
  const lowPriorityTasks = activeTasks.filter(t => t.priority === 'low');

  const completionRate = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  // 카테고리별 통계
  const categoryStats = {};
  tasks.forEach(task => {
    if (task.category) {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = { total: 0, completed: 0 };
      }
      categoryStats[task.category].total++;
      if (task.status === 'completed') {
        categoryStats[task.category].completed++;
      }
    }
  });

  // 최근 7일간 완료된 업무
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCompletions = completedTasks.filter(t =>
    t.completedAt && new Date(t.completedAt) >= sevenDaysAgo
  );

  return (
    <div className="dashboard">
      <h2>📊 업무 통계</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">전체 업무</div>
            <div className="stat-value">{tasks.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">완료</div>
            <div className="stat-value">{completedTasks.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-label">진행중</div>
            <div className="stat-value">{inProgressTasks.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏸️</div>
          <div className="stat-content">
            <div className="stat-label">대기중</div>
            <div className="stat-value">{pendingTasks.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">마감 초과</div>
            <div className="stat-value danger">{overdueTasks.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">완료율</div>
            <div className="stat-value">{completionRate}%</div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>우선순위별 분포</h3>
        <div className="priority-stats">
          <div className="priority-stat high">
            <span>🔴 높음</span>
            <span className="count">{highPriorityTasks.length}</span>
          </div>
          <div className="priority-stat medium">
            <span>🟡 보통</span>
            <span className="count">{mediumPriorityTasks.length}</span>
          </div>
          <div className="priority-stat low">
            <span>🟢 낮음</span>
            <span className="count">{lowPriorityTasks.length}</span>
          </div>
        </div>
      </div>

      {Object.keys(categoryStats).length > 0 && (
        <div className="stats-section">
          <h3>카테고리별 통계</h3>
          <div className="category-stats">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="category-stat">
                <div className="category-name">{category}</div>
                <div className="category-progress">
                  <div
                    className="category-progress-bar"
                    style={{
                      width: `${(stats.completed / stats.total) * 100}%`
                    }}
                  />
                </div>
                <div className="category-counts">
                  {stats.completed}/{stats.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-section">
        <h3>최근 7일 완료</h3>
        <div className="recent-completions">
          <div className="completion-count">{recentCompletions.length}개</div>
          <div className="completion-label">업무 완료</div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
