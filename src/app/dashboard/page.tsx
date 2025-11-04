"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storageUtils } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Calendar, Target, TrendingUp, BookOpen, Plus } from 'lucide-react';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface PlanSummary {
  id: number;
  examName: string;
  month: string;
  createdAt: string;
  totalTasks?: number;
  completedTasks?: number;
  weeklyGoals?: number;
  completedWeeklyGoals?: number;
}

export default function DashboardPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Migrate localStorage data to database on first login
  const migrateLocalStorageData = async () => {
    const localPlan = storageUtils.getPlan();
    if (!localPlan || !session?.user) return;

    setMigrating(true);
    toast.info('Migrating your existing study plan to the cloud...');

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Create study plan in database
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examName: localPlan.examName,
          month: localPlan.month
        })
      });

      if (!response.ok) throw new Error('Failed to create study plan');

      const studyPlan = await response.json();
      const studyPlanId = studyPlan.id;

      // Create monthly goals
      await Promise.all(
        localPlan.monthlyGoals.map(goal =>
          fetch(`/api/plans/${studyPlanId}/monthly-goals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ goal: goal.goal })
          })
        )
      );

      // Create weekly goals and tasks
      for (const weeklyGoal of localPlan.weeklyGoals) {
        const weeklyResponse = await fetch(`/api/plans/${studyPlanId}/weekly-goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            weekNumber: weeklyGoal.weekNumber,
            goal: weeklyGoal.goal
          })
        });

        const createdWeeklyGoal = await weeklyResponse.json();

        await Promise.all(
          weeklyGoal.tasks.map(task =>
            fetch(`/api/plans/${studyPlanId}/tasks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: task.name,
                date: task.date,
                weeklyGoalId: createdWeeklyGoal.id
              })
            })
          )
        );
      }

      // Update completion statuses
      const allTasks = await fetch(`/api/plans/${studyPlanId}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      for (const localTask of localPlan.dailyTasks) {
        if (localTask.completed) {
          const dbTask = allTasks.find((t: any) => 
            t.name === localTask.name && t.date === localTask.date
          );
          if (dbTask) {
            await fetch(`/api/tasks/${dbTask.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ completed: true })
            });
          }
        }
      }

      toast.success('Study plan migrated successfully!');
      storageUtils.clearPlan();
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Failed to migrate study plan');
    } finally {
      setMigrating(false);
    }
  };

  const fetchAllPlans = async () => {
    if (!session?.user) return;

    try {
      const token = localStorage.getItem("bearer_token");
      
      const response = await fetch('/api/plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch plans');

      const plansData = await response.json();
      
      if (plansData.length === 0) {
        // Check if there's localStorage data to migrate
        const localPlan = storageUtils.getPlan();
        if (localPlan) {
          await migrateLocalStorageData();
          // Refetch after migration
          const newResponse = await fetch('/api/plans', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const newPlans = await newResponse.json();
          setPlans(newPlans);
        }
        setLoading(false);
        return;
      }

      // Fetch progress for each plan
      const plansWithProgress = await Promise.all(
        plansData.map(async (plan: any) => {
          try {
            const [weeklyRes, tasksRes] = await Promise.all([
              fetch(`/api/plans/${plan.id}/weekly-goals`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }),
              fetch(`/api/plans/${plan.id}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
            ]);

            const weeklyGoals = await weeklyRes.json();
            const tasks = await tasksRes.json();

            return {
              ...plan,
              totalTasks: tasks.length,
              completedTasks: tasks.filter((t: any) => t.completed).length,
              weeklyGoals: weeklyGoals.length,
              completedWeeklyGoals: weeklyGoals.filter((w: any) => w.completed).length
            };
          } catch (error) {
            console.error(`Error fetching progress for plan ${plan.id}:`, error);
            return plan;
          }
        })
      );

      setPlans(plansWithProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching study plans:', error);
      toast.error('Failed to load study plans');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push('/upload');
      } else {
        fetchAllPlans();
      }
    }
  }, [session, isPending]);

  if (isPending || loading || migrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {migrating ? 'Migrating your study plan...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Study Plans</h1>
            <p className="text-muted-foreground">
              Manage all your exam preparation goals in one place
            </p>
          </div>
          <Button
            onClick={() => router.push('/upload')}
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Plan
          </Button>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Study Plans Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first study plan to get started with your exam preparation
              </p>
              <Button onClick={() => router.push('/upload')} size="lg">
                <Upload className="mr-2 h-5 w-5" />
                Upload Study Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const progressPercentage = plan.totalTasks && plan.totalTasks > 0
                ? Math.round((plan.completedTasks! / plan.totalTasks) * 100)
                : 0;

              return (
                <Card
                  key={plan.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/${plan.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {plan.examName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {plan.month}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {progressPercentage}%
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {plan.completedTasks || 0}/{plan.totalTasks || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {plan.completedWeeklyGoals || 0}/{plan.weeklyGoals || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Weeks</p>
                        </div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/${plan.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}