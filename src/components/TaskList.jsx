import { memo } from 'react';
import TaskItem from './TaskItem';

const TaskList = memo(({ tasks, onUpdate, onDelete, onComplete, onUpdateProgress, title, readOnly }) => {
  if (tasks.length === 0) {
    return (
      <div className="task-list empty">
        <h2>{title}</h2>
        <p className="empty-message">등록된 업무가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <h2>{title} ({tasks.length})</h2>
      <div className="tasks">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onComplete={onComplete}
            onUpdateProgress={onUpdateProgress}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
});

TaskList.displayName = 'TaskList';

export default TaskList;
