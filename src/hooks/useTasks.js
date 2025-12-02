import { useState, useEffect } from 'react';
import { loadTasks, saveTasks, generateId } from '../utils/storage';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드
  useEffect(() => {
    const loadedTasks = loadTasks();
    setTasks(loadedTasks);
    setIsLoaded(true);
  }, []);

  // 로드 완료 후에만 저장
  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  // 입력값 sanitize (XSS 방어)
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const addTask = (taskData) => {
    const newTask = {
      id: generateId(),
      title: sanitizeInput(taskData.title),
      description: sanitizeInput(taskData.description || ''),
      status: 'in_progress', // pending, in_progress, completed
      taskType: taskData.taskType || 'general', // general, ai
      priority: taskData.priority || 'medium', // high, medium, low
      category: sanitizeInput(taskData.category || ''),
      tags: (taskData.tags || []).map(sanitizeInput),
      dueDate: taskData.dueDate || null,
      progressHistory: [], // 진행 상황 히스토리 배열
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const completeTask = (id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, status: 'completed', completedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const updateProgress = (id, progress) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const newEntry = {
            id: generateId(),
            text: sanitizeInput(progress),
            createdAt: new Date().toISOString(),
          };
          const progressHistory = task.progressHistory || [];
          return {
            ...task,
            progressHistory: [...progressHistory, newEntry],
            status: 'in_progress',
          };
        }
        return task;
      })
    );
  };

  const importTasks = (importedTasks) => {
    setTasks(importedTasks);
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return {
    tasks,
    activeTasks,
    completedTasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateProgress,
    importTasks,
  };
};
