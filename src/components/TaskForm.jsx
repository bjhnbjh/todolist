import { useState, memo } from 'react';

const TaskForm = memo(({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    taskType: initialData?.taskType || 'general',
    priority: initialData?.priority || 'medium',
    category: initialData?.category || '',
    tags: initialData?.tags?.join(', ') || '',
    dueDate: initialData?.dueDate || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    if (!initialData) {
      setFormData({
        title: '',
        description: '',
        taskType: 'general',
        priority: 'medium',
        category: '',
        tags: '',
        dueDate: '',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">업무 제목 *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="업무 제목을 입력하세요"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="업무 설명을 입력하세요"
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="taskType">업무 유형</label>
          <select
            id="taskType"
            name="taskType"
            value={formData.taskType}
            onChange={handleChange}
          >
            <option value="general">일반 업무</option>
            <option value="ai">AI 업무</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">우선순위</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="high">🔴 높음</option>
            <option value="medium">🟡 보통</option>
            <option value="low">🟢 낮음</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">카테고리</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="예: 개발, 디자인"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">마감일</label>
          <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tags">태그 (쉼표로 구분)</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="예: 긴급, 중요"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initialData ? '수정' : '등록'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
});

TaskForm.displayName = 'TaskForm';

export default TaskForm;
