import { useState, memo } from 'react';

const TaskItem = memo(({ task, onUpdate, onDelete, onComplete, onUpdateProgress, readOnly }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority || 'medium',
    category: task.category,
    tags: task.tags.join(', '),
    dueDate: task.dueDate || '',
  });
  const [progressInput, setProgressInput] = useState('');

  const handleSaveEdit = () => {
    onUpdate(task.id, {
      ...editData,
      tags: editData.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleProgressUpdate = () => {
    if (!progressInput.trim()) return;
    onUpdateProgress(task.id, progressInput);
    setProgressInput('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  if (isEditing) {
    return (
      <div className="task-item editing">
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="제목"
        />
        <textarea
          value={editData.description}
          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="설명"
        />
        <select
          value={editData.priority}
          onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
        >
          <option value="high">🔴 높음</option>
          <option value="medium">🟡 보통</option>
          <option value="low">🟢 낮음</option>
        </select>
        <input
          type="text"
          value={editData.category}
          onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="카테고리"
        />
        <input
          type="text"
          value={editData.tags}
          onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="태그"
        />
        <input
          type="datetime-local"
          value={editData.dueDate}
          onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
        />
        <div className="edit-actions">
          <button className="btn btn-primary" onClick={handleSaveEdit}>저장</button>
          <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>취소</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-item ${task.status} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-header">
        <div className="task-title-row">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-badges">
            <span className={`priority-badge ${task.priority || 'medium'}`}>
              {task.priority === 'high' && '🔴 높음'}
              {task.priority === 'medium' && '🟡 보통'}
              {task.priority === 'low' && '🟢 낮음'}
              {!task.priority && '🟡 보통'}
            </span>
            <span className={`type-badge ${task.taskType || 'general'}`}>
              {task.taskType === 'ai' ? 'AI' : '일반'}
            </span>
          </div>
        </div>
        <span className={`status-badge ${task.status}`}>
          {task.status === 'pending' && '대기중'}
          {task.status === 'in_progress' && '진행중'}
          {task.status === 'completed' && '완료'}
        </span>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {task.category && (
          <span className="category">{task.category}</span>
        )}
        {task.tags.length > 0 && (
          <div className="tags">
            {task.tags.map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>
        )}
        {task.dueDate && (
          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            마감: {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {task.progressHistory && task.progressHistory.length > 0 && (
        <div className="progress-history">
          <strong>진행 상황:</strong>
          <ul className="progress-list">
            {task.progressHistory.map((entry) => (
              <li key={entry.id} className="progress-entry">
                <span className="progress-text">{entry.text}</span>
                <span className="progress-date">{formatDate(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && task.status !== 'completed' && (
        <div className="progress-update">
          <input
            type="text"
            value={progressInput}
            onChange={(e) => setProgressInput(e.target.value)}
            placeholder="현재 진행 상황 입력..."
          />
          <button className="btn btn-small" onClick={handleProgressUpdate}>
            상황 업데이트
          </button>
        </div>
      )}

      {!readOnly && (
        <div className="task-actions">
          {task.status !== 'completed' && (
            <>
              <button className="btn btn-success" onClick={() => onComplete(task.id)}>
                완료
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                수정
              </button>
            </>
          )}
          <button className="btn btn-danger" onClick={() => onDelete(task.id)}>
            삭제
          </button>
        </div>
      )}

      {task.completedAt && (
        <div className="completed-at">
          완료일: {formatDate(task.completedAt)}
        </div>
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
