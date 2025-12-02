export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/vite.svg',
    });
  }
};

export const checkDueTasks = (tasks) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000); // 30분 후

  tasks.forEach(task => {
    if (task.status === 'completed' || !task.dueDate) return;

    const dueDate = new Date(task.dueDate);

    if (dueDate <= now) {
      sendNotification(
        '마감 시간 초과!',
        `"${task.title}" 업무가 마감 시간을 지났습니다.`
      );
    } else if (dueDate <= soon) {
      sendNotification(
        '마감 임박!',
        `"${task.title}" 업무가 30분 내에 마감됩니다.`
      );
    }
  });
};
