import { StudyPlan, PlanProgress } from './types';

export function calculateProgress(plan: StudyPlan): PlanProgress {
  const totalTasks = plan.dailyTasks.length;
  const completedTasks = plan.dailyTasks.filter(task => task.completed).length;
  
  const monthlyTotal = plan.monthlyGoals.length;
  const monthlyCompleted = plan.monthlyGoals.filter(goal => goal.completed).length;
  
  const weeklyTotal = plan.weeklyGoals.length;
  const weeklyCompleted = plan.weeklyGoals.filter(goal => goal.completed).length;

  // Get today's tasks
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = plan.dailyTasks.filter(task => task.date === today);
  const dailyTotal = todaysTasks.length;
  const dailyCompleted = todaysTasks.filter(task => task.completed).length;

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    percentage,
    dailyTotal,
    dailyCompleted,
    weeklyTotal,
    weeklyCompleted,
    monthlyTotal,
    monthlyCompleted
  };
}
