"use client"

import { useState } from 'react';
import { StudyPlan, DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DailyTasksViewProps {
  plan: StudyPlan;
  onUpdate: () => void;
}

export default function DailyTasksView({ plan, onUpdate }: DailyTasksViewProps) {
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const todaysTasks = plan.dailyTasks.filter(task => task.date === today);
  const upcomingTasks = plan.dailyTasks
    .filter(task => task.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);
  const pastTasks = plan.dailyTasks
    .filter(task => task.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    
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
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTasks(prev => new Set(prev).add(taskId));
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/plans/${plan.id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete task');

      toast.success('Task deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setAddingTask(true);
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/plans/${plan.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTaskName,
          date: newTaskDate,
          weeklyGoalId: null
        })
      });

      if (!response.ok) throw new Error('Failed to add task');

      toast.success('Task added successfully');
      setAddDialogOpen(false);
      setNewTaskName('');
      setNewTaskDate('');
      onUpdate();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const TaskItem = ({ task }: { task: DailyTask }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group">
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
        disabled={updatingTasks.has(task.id)}
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
      <div className="flex items-center gap-2">
        {task.completed && (
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleDeleteTask(task.id)}
          disabled={deletingTasks.has(task.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Today's Tasks</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {todaysTasks.filter(t => t.completed).length}/{todaysTasks.length}
              </Badge>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Create a new task for your study plan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-name">Task Name</Label>
                      <Input
                        id="task-name"
                        placeholder="e.g., Complete Chapter 5 exercises"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-date">Date</Label>
                      <Input
                        id="task-date"
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                      disabled={addingTask}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddTask} disabled={addingTask}>
                      {addingTask ? 'Adding...' : 'Add Task'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {todaysTasks.length > 0 ? (
            <div className="space-y-2">
              {todaysTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks scheduled for today</p>
              <p className="text-sm mt-2">Check your upcoming tasks below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Next 10 scheduled tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Tasks */}
      {pastTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Past Tasks</CardTitle>
            <CardDescription>Last 5 tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}