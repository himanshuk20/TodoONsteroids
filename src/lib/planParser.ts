import { StudyPlan, WeeklyGoal, DailyTask, MonthlyGoal } from './types';

export function parsePlanJSON(jsonString: string): StudyPlan {
  const data = JSON.parse(jsonString);
  
  // Generate unique IDs for all items
  const monthlyGoals: MonthlyGoal[] = (data.monthlyGoals || []).map((goal: any, index: number) => ({
    id: `monthly-${index}-${Date.now()}`,
    goal: typeof goal === 'string' ? goal : goal.goal || goal.name || '',
    completed: false
  }));

  const weeklyGoals: WeeklyGoal[] = (data.weeklyGoals || []).map((week: any, index: number) => {
    const tasks: DailyTask[] = (week.tasks || week.dailyTasks || []).map((task: any, taskIndex: number) => ({
      id: `task-week${index}-${taskIndex}-${Date.now()}`,
      name: typeof task === 'string' ? task : task.name || task.task || '',
      date: task.date || '',
      completed: false
    }));

    return {
      id: `week-${index}-${Date.now()}`,
      weekNumber: week.weekNumber || week.week || index + 1,
      goal: week.goal || week.name || `Week ${index + 1}`,
      tasks,
      completed: false
    };
  });

  // Collect all daily tasks from weekly goals
  const allDailyTasks: DailyTask[] = weeklyGoals.flatMap(week => week.tasks);

  // Also add standalone daily tasks if provided
  if (data.dailyTasks && Array.isArray(data.dailyTasks)) {
    data.dailyTasks.forEach((task: any, index: number) => {
      allDailyTasks.push({
        id: `daily-${index}-${Date.now()}`,
        name: typeof task === 'string' ? task : task.name || task.task || '',
        date: task.date || '',
        completed: false
      });
    });
  }

  const plan: StudyPlan = {
    id: `plan-${Date.now()}`,
    examName: data.examName || data.exam || 'Exam',
    month: data.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    monthlyGoals,
    weeklyGoals,
    dailyTasks: allDailyTasks,
    createdAt: new Date().toISOString()
  };

  return plan;
}

export function validatePlanJSON(jsonString: string): { valid: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.examName && !data.exam) {
      return { valid: false, error: 'Missing examName field' };
    }

    if (!data.weeklyGoals && !data.monthlyGoals && !data.dailyTasks) {
      return { valid: false, error: 'Must include at least one of: weeklyGoals, monthlyGoals, or dailyTasks' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}
