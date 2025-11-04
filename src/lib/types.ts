export interface DailyTask {
  id: string;
  name: string;
  date: string;
  completed: boolean;
}

export interface WeeklyGoal {
  id: string;
  weekNumber: number;
  goal: string;
  tasks: DailyTask[];
  completed: boolean;
}

export interface MonthlyGoal {
  id: string;
  goal: string;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  examName: string;
  month: string;
  monthlyGoals: MonthlyGoal[];
  weeklyGoals: WeeklyGoal[];
  dailyTasks: DailyTask[];
  createdAt: string;
}

export interface PlanProgress {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  dailyCompleted: number;
  dailyTotal: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  monthlyCompleted: number;
  monthlyTotal: number;
}
