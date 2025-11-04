"use client"

import { useState } from 'react';
import { StudyPlan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Target, TrendingUp, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface MonthlyOverviewProps {
  plan: StudyPlan;
  onUpdate: () => void;
}

export default function MonthlyOverview({ plan, onUpdate }: MonthlyOverviewProps) {
  const [updatingGoals, setUpdatingGoals] = useState<Set<string>>(new Set());

  const handleMonthlyGoalToggle = async (goalId: string, completed: boolean) => {
    setUpdatingGoals(prev => new Set(prev).add(goalId));
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/plans/${plan.id}/monthly-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });

      if (!response.ok) throw new Error('Failed to update monthly goal');

      toast.success(completed ? 'Monthly goal completed!' : 'Monthly goal marked incomplete');
      onUpdate();
    } catch (error) {
      console.error('Error updating monthly goal:', error);
      toast.error('Failed to update monthly goal');
    } finally {
      setUpdatingGoals(prev => {
        const newSet = new Set(prev);
        newSet.delete(goalId);
        return newSet;
      });
    }
  };

  const totalWeeks = plan.weeklyGoals.length;
  const completedWeeks = plan.weeklyGoals.filter(w => w.completed).length;
  const weekProgress = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

  const totalDailyTasks = plan.dailyTasks.length;
  const completedDailyTasks = plan.dailyTasks.filter(t => t.completed).length;
  const taskProgress = totalDailyTasks > 0 ? (completedDailyTasks / totalDailyTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {plan.month} Overview
          </CardTitle>
          <CardDescription>Your exam preparation summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Weekly Progress</p>
                <Badge variant="secondary">
                  {completedWeeks}/{totalWeeks} weeks
                </Badge>
              </div>
              <Progress value={weekProgress} className="h-3" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Task Completion</p>
                <Badge variant="secondary">
                  {completedDailyTasks}/{totalDailyTasks} tasks
                </Badge>
              </div>
              <Progress value={taskProgress} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Monthly Goals
          </CardTitle>
          <CardDescription>
            Complete these major objectives by the end of {plan.month}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan.monthlyGoals.length > 0 ? (
            <div className="space-y-3">
              {plan.monthlyGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={(checked) =>
                      handleMonthlyGoalToggle(goal.id, checked as boolean)
                    }
                    disabled={updatingGoals.has(goal.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={`text-lg ${goal.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                      {goal.goal}
                    </p>
                  </div>
                  {goal.completed && (
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No monthly goals defined</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Breakdown
          </CardTitle>
          <CardDescription>Quick view of all weekly goals</CardDescription>
        </CardHeader>
        <CardContent>
          {plan.weeklyGoals.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {plan.weeklyGoals.map((week) => {
                const weekCompleted = week.tasks.filter(t => t.completed).length;
                const weekTotal = week.tasks.length;
                const weekPercentage = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;

                return (
                  <div
                    key={week.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Week {week.weekNumber}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {week.goal}
                        </p>
                      </div>
                      {week.completed && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div>
                      <Progress value={weekPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {weekCompleted}/{weekTotal} tasks completed
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No weekly goals defined</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}