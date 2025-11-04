export const notificationUtils = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  },

  sendNotification: (title: string, options?: NotificationOptions): void => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon.png',
        badge: '/badge.png',
        ...options
      });
    }
  },

  sendDailyReminder: (taskCount: number): void => {
    notificationUtils.sendNotification('Daily Study Reminder', {
      body: `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} to complete today!`,
      tag: 'daily-reminder',
      requireInteraction: false
    });
  },

  scheduleDailyReminder: (hour: number = 9): void => {
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilReminder = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const planData = localStorage.getItem('exam_planner_data');
      
      if (planData) {
        const plan = JSON.parse(planData);
        const todaysTasks = plan.dailyTasks.filter((task: any) => task.date === today);
        notificationUtils.sendDailyReminder(todaysTasks.length);
      }

      // Schedule for next day
      notificationUtils.scheduleDailyReminder(hour);
    }, timeUntilReminder);
  }
};
