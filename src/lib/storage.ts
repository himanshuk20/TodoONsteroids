import { StudyPlan } from './types';

const STORAGE_KEY = 'exam_planner_data';

export const storageUtils = {
  savePlan: (plan: StudyPlan): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
  },

  getPlan: (): StudyPlan | null => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  },

  updateTaskStatus: (taskId: string, completed: boolean): void => {
    const plan = storageUtils.getPlan();
    if (!plan) return;

    // Update in daily tasks
    plan.dailyTasks = plan.dailyTasks.map(task =>
      task.id === taskId ? { ...task, completed } : task
    );

    // Update in weekly goals
    plan.weeklyGoals = plan.weeklyGoals.map(week => ({
      ...week,
      tasks: week.tasks.map(task =>
        task.id === taskId ? { ...task, completed } : task
      )
    }));

    storageUtils.savePlan(plan);
  },

  updateWeeklyGoalStatus: (goalId: string, completed: boolean): void => {
    const plan = storageUtils.getPlan();
    if (!plan) return;

    plan.weeklyGoals = plan.weeklyGoals.map(goal =>
      goal.id === goalId ? { ...goal, completed } : goal
    );

    storageUtils.savePlan(plan);
  },

  updateMonthlyGoalStatus: (goalId: string, completed: boolean): void => {
    const plan = storageUtils.getPlan();
    if (!plan) return;

    plan.monthlyGoals = plan.monthlyGoals.map(goal =>
      goal.id === goalId ? { ...goal, completed } : goal
    );

    storageUtils.savePlan(plan);
  },

  clearPlan: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  hasPlan: (): boolean => {
    return storageUtils.getPlan() !== null;
  }
};
