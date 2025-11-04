"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parsePlanJSON, validatePlanJSON } from '@/lib/planParser';
import { storageUtils } from '@/lib/storage';
import { Copy, Upload, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { authClient, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

const chatGPTPrompt = `Generate a study plan for my [EXAM NAME] exam in JSON format. Use this exact structure:

{
  "examName": "Your Exam Name",
  "month": "Month Year",
  "monthlyGoals": [
    "Goal 1",
    "Goal 2"
  ],
  "weeklyGoals": [
    {
      "weekNumber": 1,
      "goal": "Week 1 focus area",
      "tasks": [
        { "name": "Task description", "date": "YYYY-MM-DD" }
      ]
    }
  ]
}

Create a realistic study schedule with daily tasks spread across multiple weeks.`;

export default function UploadPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check for pending upload on mount
  useEffect(() => {
    if (!isPending && session?.user) {
      const pendingPlan = localStorage.getItem('pendingPlanUpload');
      if (pendingPlan) {
        setJsonInput(pendingPlan);
        localStorage.removeItem('pendingPlanUpload');
        // Auto-upload the pending plan
        setTimeout(() => {
          handleUploadWithData(pendingPlan);
        }, 500);
      }
    }
  }, [session, isPending]);

  const exampleJSON = {
    examName: "Final Semester Exams",
    month: "January 2025",
    monthlyGoals: [
      "Complete all subjects revision",
      "Solve 100+ practice questions",
      "Master weak topics"
    ],
    weeklyGoals: [
      {
        weekNumber: 1,
        goal: "Mathematics - Calculus & Algebra",
        tasks: [
          { name: "Study Differential Calculus", date: "2025-01-06" },
          { name: "Practice 20 Calculus problems", date: "2025-01-07" },
          { name: "Review Linear Algebra concepts", date: "2025-01-08" },
          { name: "Solve Algebra worksheets", date: "2025-01-09" },
          { name: "Complete Math mock test", date: "2025-01-10" }
        ]
      },
      {
        weekNumber: 2,
        goal: "Physics - Mechanics & Thermodynamics",
        tasks: [
          { name: "Study Newton's Laws", date: "2025-01-13" },
          { name: "Practice mechanics problems", date: "2025-01-14" },
          { name: "Review Thermodynamics", date: "2025-01-15" },
          { name: "Solve previous year questions", date: "2025-01-16" },
          { name: "Physics lab revision", date: "2025-01-17" }
        ]
      }
    ]
  };

  const handleUploadWithData = async (planData: string) => {
    setError('');
    setSuccess(false);

    if (!planData.trim()) {
      setError('Please enter a study plan JSON');
      return;
    }

    const validation = validatePlanJSON(planData);
    if (!validation.valid) {
      setError(validation.error || 'Invalid JSON format');
      return;
    }

    try {
      setUploading(true);
      const plan = parsePlanJSON(planData);
      
      // Create study plan in database
      const token = localStorage.getItem("bearer_token");
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examName: plan.examName,
          month: plan.month
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create study plan');
      }

      const studyPlan = await response.json();
      const studyPlanId = studyPlan.id;

      // Create monthly goals
      await Promise.all(
        plan.monthlyGoals.map(goal =>
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

      // Create weekly goals and their tasks
      for (const weeklyGoal of plan.weeklyGoals) {
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

        // Create tasks for this weekly goal
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

      // Also save to localStorage for backward compatibility during migration
      storageUtils.savePlan(plan);
      
      setSuccess(true);
      toast.success('Study plan uploaded successfully!');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload study plan. Please try again.');
      toast.error('Failed to upload study plan');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    // If user is not logged in, save plan and redirect to login
    if (!session?.user) {
      if (!jsonInput.trim()) {
        setError('Please enter a study plan JSON');
        return;
      }

      const validation = validatePlanJSON(jsonInput);
      if (!validation.valid) {
        setError(validation.error || 'Invalid JSON format');
        return;
      }

      // Save to localStorage and redirect to login
      localStorage.setItem('pendingPlanUpload', jsonInput);
      toast.info('Please sign in to save your study plan');
      router.push('/login?redirect=' + encodeURIComponent('/upload'));
      return;
    }

    // If logged in, proceed with upload
    await handleUploadWithData(jsonInput);
  };

  const copyExample = () => {
    const exampleString = JSON.stringify(exampleJSON, null, 2);
    setJsonInput(exampleString);
    navigator.clipboard.writeText(exampleString);
    toast.success('Example copied to clipboard!');
    // Reset scroll position after setting content
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = 0;
      }
    }, 0);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(chatGPTPrompt);
      toast.success('Prompt copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy prompt. Please try again.');
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    // Keep scroll position at top when pasting
    if (e.target.scrollTop === 0) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = 0;
        }
      }, 0);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-4xl font-bold mb-2">Upload Study Plan</h1>
          <p className="text-muted-foreground">Paste your ChatGPT-generated study plan below</p>
        </div>

        {!session?.user && (
          <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <LogIn className="h-4 w-4" />
            <AlertDescription>
              Sign in to save your study plan and access it from any device. You'll be redirected to sign in after clicking "Upload Plan".
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Paste Your Plan
              </CardTitle>
              <CardDescription>
                Copy the JSON output from ChatGPT and paste it here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={jsonInput}
                onChange={handleTextareaChange}
                placeholder="Paste your JSON study plan here..."
                className="h-[400px] max-h-[400px] font-mono text-sm resize-none overflow-y-auto"
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Plan uploaded successfully! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleUpload} 
                className="w-full" 
                size="lg"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ChatGPT Prompt Template</CardTitle>
                <CardDescription>
                  Use this prompt to generate your study plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap mb-4 max-h-[200px] overflow-y-auto">
                  {chatGPTPrompt}
                </div>
                <Button 
                  variant="outline" 
                  onClick={copyPrompt}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Prompt
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Format</CardTitle>
                <CardDescription>
                  Click to use this example in the editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-auto max-h-[200px] mb-4">
                  {JSON.stringify(exampleJSON, null, 2)}
                </div>
                <Button 
                  variant="secondary" 
                  onClick={copyExample}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use Example
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}