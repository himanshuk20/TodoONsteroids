"use client"

import { useState } from 'react';
import { StudyPlan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Calendar } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

interface WeeklyGoalsViewProps {
  plan: StudyPlan;
  onUpdate: () => void;
}

export default function WeeklyGoalsView({ plan, onUpdate }: WeeklyGoalsViewProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    setUpdatingItems(prev => new Set(prev).add(taskId));
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/plans/${plan.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });

      if (!response.ok) throw new Error('Failed to update task');

      toast.success(completed ? 'Task completed!' : 'Task marked incomplete');
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleWeeklyGoalToggle = async (goalId: string, completed: boolean) => {
    setUpdatingItems(prev => new Set(prev).add(goalId));
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/plans/${plan.id}/weekly-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });

      if (!response.ok) throw new Error('Failed to update weekly goal');

      toast.success(completed ? 'Weekly goal completed!' : 'Weekly goal marked incomplete');
      onUpdate();
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      toast.error('Failed to update weekly goal');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(goalId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-4">
      {plan.weeklyGoals.length > 0 ? (
        <Accordion type="multiple" className="space-y-4">
          {plan.weeklyGoals.map((week) => {
            const completedTasks = week.tasks.filter(t => t.completed).length;
            const totalTasks = week.tasks.length;
            const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <AccordionItem key={week.id} value={week.id} className="border-none">
                <Card>
                  <CardHeader className="pb-3">
                    <AccordionTrigger className="hover:no-underline py-0">
                      <div className="flex items-start justify-between w-full pr-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={week.completed}
                            onCheckedChange={(checked) => 
                              handleWeeklyGoalToggle(week.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingItems.has(week.id)}
                            className="mt-1"
                          />
                          <div className="text-left flex-1">
                            <CardTitle className={`text-xl ${week.completed ? 'line-through text-muted-foreground' : ''}`}>
                              Week {week.weekNumber}: {week.goal}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {completedTasks}/{totalTasks} tasks
                              </Badge>
                              {week.completed && (
                                <Badge variant="default" className="bg-green-500">
                                  Completed
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="mt-3">
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {week.tasks.length > 0 ? (
                          week.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={(checked) =>
                                  handleTaskToggle(task.id, checked as boolean)
                                }
                                disabled={updatingItems.has(task.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.name}
                                </p>
                                {task.date && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(task.date)}
                                  </p>
                                )}
                              </div>
                              {task.completed && (
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No tasks for this week
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Circle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No weekly goals defined</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}