import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTasks } from './hooks/useTasks';
import { useDebounce } from './hooks/useDebounce';
import { requestNotificationPermission, checkDueTasks } from './utils/notifications';
import { exportData, importData, createShareLink, parseShareLink, isShareMode } from './utils/storage';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  const {
    tasks,
    activeTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateProgress,
    importTasks,
  } = useTasks();

  // n8n 웹훅 URL (.env 파일에서 읽기)
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortOrder, setSortOrder] = useState(null); // null, 'asc', 'desc'
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [shareMode, setShareMode] = useState(false);
  const [sharedTasks, setSharedTasks] = useState([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // 공유 링크 확인
  useEffect(() => {
    if (isShareMode()) {
      const parsed = parseShareLink();
      if (parsed) {
        setSharedTasks(parsed);
        setShareMode(true);
      }
    }
  }, []);

  // 공유 링크 생성
  const handleShare = useCallback(() => {
    const url = createShareLink(tasks);
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        alert('공유 링크가 클립보드에 복사되었습니다!\n\n이 링크를 공유하면 다른 사람이 업무 목록을 볼 수 있습니다.');
      }).catch(() => {
        prompt('아래 링크를 복사하세요:', url);
      });
    }
  }, [tasks]);

  // 공유 모드 종료
  const exitShareMode = useCallback(() => {
    window.history.replaceState({}, '', window.location.pathname);
    setShareMode(false);
    setSharedTasks([]);
  }, []);

  // 공유 모드일 때 사용할 태스크
  const displayTasks = shareMode ? sharedTasks : tasks;
  const displayActiveTasks = shareMode
    ? sharedTasks.filter(t => t.status !== 'completed')
    : activeTasks;
  const displayCompletedTasks = shareMode
    ? sharedTasks.filter(t => t.status === 'completed')
    : completedTasks;

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkDueTasks(activeTasks);
    }, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, [activeTasks]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      // input이나 textarea에 포커스 있을 때는 단축키 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // ESC는 예외
        if (e.key === 'Escape') {
          e.target.blur();
          setShowForm(false);
        }
        return;
      }

      // N: 새 업무
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowForm(prev => !prev);
      }

      // /: 검색 포커스
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // D: 다크모드 토글
      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleDarkMode();
      }

      // 1, 2, 3: 탭 전환
      if (e.key === '1') {
        e.preventDefault();
        setActiveTab('dashboard');
      }
      if (e.key === '2') {
        e.preventDefault();
        setActiveTab('active');
      }
      if (e.key === '3') {
        e.preventDefault();
        setActiveTab('completed');
      }

      // ESC: 폼 닫기
      if (e.key === 'Escape') {
        setShowForm(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDarkMode]);

  const handleAddTask = (taskData) => {
    addTask(taskData);
    setShowForm(false);
    // 새 업무 추가 후 자동으로 진행중 탭으로 전환
    setActiveTab('active');
  };

  const handleCompleteTask = (id) => {
    completeTask(id);
    // 완료 후 자동으로 완료 탭으로 전환하고 필터 초기화
    setActiveTab('completed');
    setFilterPriority('');
    setSearchQuery('');
  };

  const handleExport = () => {
    exportData(tasks);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedTasks = await importData(file);
      if (confirm(`${importedTasks.length}개의 업무를 가져오시겠습니까? 현재 데이터는 덮어씌워집니다.`)) {
        importTasks(importedTasks);
        alert('데이터를 성공적으로 가져왔습니다!');
      }
    } catch (error) {
      alert(error.message);
    }
    // 파일 입력 초기화
    e.target.value = '';
  };


  const handleSortToggle = () => {
    if (sortOrder === null) {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder(null);
    }
  };

  const filterAndSortTasks = useCallback((taskList) => {
    let filtered = taskList;

    // 검색 필터링 (디바운스된 검색어 사용)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 우선순위 필터링
    if (filterPriority) {
      filtered = filtered.filter(t => (t.priority || 'medium') === filterPriority);
    }

    // 마감기한 정렬
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        // 마감일이 없는 항목은 뒤로
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);

        return sortOrder === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      });
    }

    return filtered;
  }, [debouncedSearchQuery, filterPriority, sortOrder]);

  const filteredActiveTasks = useMemo(() =>
    filterAndSortTasks(displayActiveTasks),
    [displayActiveTasks, filterAndSortTasks]
  );

  const filteredCompletedTasks = useMemo(() =>
    filterAndSortTasks(displayCompletedTasks),
    [displayCompletedTasks, filterAndSortTasks]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>업무 관리</h1>
        <div className="header-buttons">
          <button
            className="btn btn-icon"
            onClick={toggleDarkMode}
            title={darkMode ? '라이트 모드' : '다크 모드'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {!shareMode && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleShare}
                title="공유 링크 생성"
              >
                🔗 공유
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleExport}
                title="데이터 백업"
              >
                💾 백업
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleImportClick}
                title="데이터 복원"
              >
                📂 복원
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-primary add-btn"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? '취소' : '+ 새 업무'}
              </button>
            </>
          )}
          {shareMode && (
            <button
              className="btn btn-primary"
              onClick={exitShareMode}
            >
              내 업무로 돌아가기
            </button>
          )}
        </div>
      </header>

      {shareMode && (
        <div className="share-mode-banner">
          👀 공유된 업무 목록을 보고 있습니다 (읽기 전용)
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <TaskForm onSubmit={handleAddTask} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="controls">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 통계
          </button>
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            진행중 ({displayActiveTasks.length})
          </button>
          <button
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            완료됨 ({displayCompletedTasks.length})
          </button>
        </div>

        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="🔍 검색 (제목, 설명, 카테고리, 태그)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filters">
          <button
            className={`sort-btn ${sortOrder ? 'active' : ''}`}
            onClick={handleSortToggle}
          >
            마감기한
            {sortOrder === 'asc' && ' ↑'}
            {sortOrder === 'desc' && ' ↓'}
            {!sortOrder && ' -'}
          </button>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="priority-filter"
          >
            <option value="">모든 우선순위</option>
            <option value="high">🔴 높음</option>
            <option value="medium">🟡 보통</option>
            <option value="low">🟢 낮음</option>
          </select>
        </div>
      </div>

      <main className="main-content">
        {activeTab === 'dashboard' ? (
          <Dashboard tasks={displayTasks} />
        ) : activeTab === 'active' ? (
          <TaskList
            tasks={filteredActiveTasks}
            title={shareMode ? "공유된 진행중 업무" : "진행중인 업무"}
            onUpdate={shareMode ? null : updateTask}
            onDelete={shareMode ? null : deleteTask}
            onComplete={shareMode ? null : handleCompleteTask}
            onUpdateProgress={shareMode ? null : updateProgress}
            readOnly={shareMode}
          />
        ) : (
          <TaskList
            tasks={filteredCompletedTasks}
            title={shareMode ? "공유된 완료 업무" : "완료된 업무"}
            onUpdate={shareMode ? null : updateTask}
            onDelete={shareMode ? null : deleteTask}
            onComplete={shareMode ? null : handleCompleteTask}
            onUpdateProgress={shareMode ? null : updateProgress}
            readOnly={shareMode}
          />
        )}
      </main>

      <ChatBot
        tasks={tasks}
        onAddTask={addTask}
        onCompleteTask={completeTask}
        webhookUrl={webhookUrl}
      />
    </div>
  );
}

export default App;
