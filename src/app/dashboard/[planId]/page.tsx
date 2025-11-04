"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { storageUtils } from '@/lib/storage';
import { StudyPlan, PlanProgress } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DailyTasksView from '@/components/DailyTasksView';
import WeeklyGoalsView from '@/components/WeeklyGoalsView';
import MonthlyOverview from '@/components/MonthlyOverview';
import { Bell, BellOff, Calendar, Target, TrendingUp, Upload, AlertCircle, ArrowLeft } from 'lucide-react';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { notificationUtils } from '@/lib/notifications';

export default function PlanDetailPage() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;
  const { data: session, isPending } = useSession();

  const loadPlanData = async (studyPlanId: string) => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      const [planRes, monthlyRes, weeklyRes, tasksRes] = await Promise.all([
        fetch(`/api/plans/${studyPlanId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/plans/${studyPlanId}/monthly-goals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/plans/${studyPlanId}/weekly-goals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/plans/${studyPlanId}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!planRes.ok) {
        if (planRes.status === 404) {
          toast.error('Plan not found');
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch plan');
      }

      const planData = await planRes.json();
      const monthlyGoals = await monthlyRes.json();
      const weeklyGoals = await weeklyRes.json();
      const dailyTasks = await tasksRes.json();

      // Group tasks by weekly goal
      const weeklyGoalsWithTasks = weeklyGoals.map((week: any) => ({
        id: String(week.id),
        weekNumber: week.weekNumber,
        goal: week.goal,
        completed: week.completed,
        tasks: dailyTasks
          .filter((task: any) => task.weeklyGoalId === week.id)
          .map((task: any) => ({
            id: String(task.id),
            name: task.name,
            date: task.date,
            completed: task.completed
          }))
      }));

      const fullPlan: StudyPlan = {
        id: String(planData.id),
        examName: planData.examName,
        month: planData.month,
        monthlyGoals: monthlyGoals.map((g: any) => ({
          id: String(g.id),
          goal: g.goal,
          completed: g.completed
        })),
        weeklyGoals: weeklyGoalsWithTasks,
        dailyTasks: dailyTasks.map((t: any) => ({
          id: String(t.id),
          name: t.name,
          date: t.date,
          completed: t.completed
        })),
        createdAt: planData.createdAt
      };

      setPlan(fullPlan);
      calculateProgressData(fullPlan);
      setLoading(false);
    } catch (error) {
      console.error('Error loading plan data:', error);
      toast.error('Failed to load plan details');
      setLoading(false);
      router.push('/dashboard');
    }
  };

  const calculateProgressData = (studyPlan: StudyPlan) => {
    const totalTasks = studyPlan.dailyTasks.length;
    const completedTasks = studyPlan.dailyTasks.filter(t => t.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const dailyTotal = studyPlan.dailyTasks.filter(t => t.date === today).length;
    const dailyCompleted = studyPlan.dailyTasks.filter(t => t.date === today && t.completed).length;

    const weeklyTotal = studyPlan.weeklyGoals.length;
    const weeklyCompleted = studyPlan.weeklyGoals.filter(w => w.completed).length;

    const monthlyTotal = studyPlan.monthlyGoals.length;
    const monthlyCompleted = studyPlan.monthlyGoals.filter(g => g.completed).length;

    setProgress({
      totalTasks,
      completedTasks,
      percentage,
      dailyCompleted,
      dailyTotal,
      weeklyCompleted,
      weeklyTotal,
      monthlyCompleted,
      monthlyTotal
    });
  };

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push('/login');
      } else if (planId) {
        loadPlanData(planId);
      }
    }
  }, [session, isPending, planId]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const refreshData = async () => {
    if (plan) {
      await loadPlanData(plan.id);
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const permission = await notificationUtils.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        notificationUtils.scheduleDailyReminder(9);
        notificationUtils.sendNotification('Notifications Enabled', {
          body: 'You will receive daily study reminders at 9:00 AM'
        });
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleClearPlan = async () => {
    if (!plan) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this study plan? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete plan');

      toast.success('Study plan deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete study plan');
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!plan || !progress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Plans
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{plan.examName}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {plan.month}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNotificationToggle}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications On
                </>
              ) : (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Enable Notifications
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              New Plan
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearPlan}
            >
              Delete Plan
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overall Progress</CardDescription>
              <CardTitle className="text-3xl">{progress.percentage}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress.percentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {progress.completedTasks} of {progress.totalTasks} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Today's Tasks
              </CardDescription>
              <CardTitle className="text-3xl">
                {progress.dailyCompleted}/{progress.dailyTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={progress.dailyTotal > 0 ? (progress.dailyCompleted / progress.dailyTotal) * 100 : 0} 
                className="h-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Weekly Goals
              </CardDescription>
              <CardTitle className="text-3xl">
                {progress.weeklyCompleted}/{progress.weeklyTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={progress.weeklyTotal > 0 ? (progress.weeklyCompleted / progress.weeklyTotal) * 100 : 0} 
                className="h-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Monthly Goals
              </CardDescription>
              <CardTitle className="text-3xl">
                {progress.monthlyCompleted}/{progress.monthlyTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={progress.monthlyTotal > 0 ? (progress.monthlyCompleted / progress.monthlyTotal) * 100 : 0} 
                className="h-2" 
              />
            </CardContent>
          </Card>
        </div>

        {/* No tasks for today alert */}
        {progress.dailyTotal === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tasks scheduled for today. Check your weekly and monthly goals below.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Tasks</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Goals</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <DailyTasksView plan={plan} onUpdate={refreshData} />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <WeeklyGoalsView plan={plan} onUpdate={refreshData} />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <MonthlyOverview plan={plan} onUpdate={refreshData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
