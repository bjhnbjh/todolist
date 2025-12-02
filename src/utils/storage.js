const STORAGE_KEY = 'task-manager-data';

export const loadTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return [];
  }
};

export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks:', error);
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const exportData = (tasks) => {
  const dataStr = JSON.stringify(tasks, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `업무관리_백업_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          resolve(data);
        } else {
          reject(new Error('올바른 형식의 백업 파일이 아닙니다.'));
        }
      } catch (error) {
        reject(new Error('파일을 읽을 수 없습니다: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
};

// 공유 링크 생성
export const createShareLink = (tasks) => {
  try {
    // 필요한 필드만 추출해서 크기 줄이기
    const shareTasks = tasks.map(t => ({
      t: t.title,
      d: t.description || '',
      s: t.status,
      p: t.priority || 'medium',
      due: t.dueDate || '',
      c: t.category || '',
    }));

    const jsonStr = JSON.stringify(shareTasks);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const url = `${window.location.origin}${window.location.pathname}?share=${base64}`;
    return url;
  } catch (error) {
    console.error('공유 링크 생성 실패:', error);
    return null;
  }
};

// 공유 링크에서 데이터 파싱
export const parseShareLink = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');

    if (!shareData) return null;

    const jsonStr = decodeURIComponent(escape(atob(shareData)));
    const shareTasks = JSON.parse(jsonStr);

    // 원래 형식으로 복원
    return shareTasks.map((t, index) => ({
      id: `shared-${index}`,
      title: t.t,
      description: t.d,
      status: t.s,
      priority: t.p,
      dueDate: t.due,
      category: t.c,
      tags: [],
      taskType: 'general',
      progressHistory: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    }));
  } catch (error) {
    console.error('공유 링크 파싱 실패:', error);
    return null;
  }
};

// 공유 모드 확인
export const isShareMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.has('share');
};
