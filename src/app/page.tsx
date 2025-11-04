"use client"

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Calendar, Target, Bell, Upload, CheckCircle2, TrendingUp, Zap, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();
  const [hasPlan, setHasPlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const checkForPlan = async () => {
      if (session?.user) {
        try {
          const token = localStorage.getItem("bearer_token");
          const response = await fetch('/api/plans', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const plans = await response.json();
            setHasPlan(plans.length > 0);
          }
        } catch (error) {
          console.error('Error checking for plans:', error);
        }
      }
      setCheckingPlan(false);
    };

    if (!isPending) {
      checkForPlan();
    }
  }, [session, isPending]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AI Exam Planner</span>
          </div>
          
          <div className="flex items-center gap-3">
            {!isPending && !session?.user && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => router.push('/register')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </>
            )}
            {!isPending && session?.user && (
              <Button 
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">AI-Powered Study Planning</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Master Your Exams with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Planning
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Transform ChatGPT-generated study plans into organized daily tasks, weekly goals, and progress tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            {!checkingPlan && hasPlan && session?.user ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="text-lg h-14 px-8"
                >
                  <Target className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push('/upload')}
                  className="text-lg h-14 px-8"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload New Plan
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/upload')}
                  className="text-lg h-14 px-8"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-lg h-14 px-8"
                >
                  Learn More
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground">
              Powerful features to keep your study plan on track
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>AI Integration</CardTitle>
                <CardDescription>
                  Paste structured study plans from ChatGPT and watch them transform into actionable tasks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Smart Organization</CardTitle>
                <CardDescription>
                  Automatically organize your study plan into daily, weekly, and monthly views
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Track completion rates with visual progress bars and percentage indicators
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle>Smart Notifications</CardTitle>
                <CardDescription>
                  Get daily reminders about your tasks and never miss a study session
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-pink-500" />
                </div>
                <CardTitle>Goal Management</CardTitle>
                <CardDescription>
                  Set and track monthly and weekly goals with easy checkbox completion
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-cyan-500" />
                </div>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  See your progress update instantly as you complete tasks and achieve goals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Generate with ChatGPT</h3>
                <p className="text-muted-foreground text-lg">
                  Ask ChatGPT to create a structured study plan in JSON format using our provided template
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Upload Your Plan</h3>
                <p className="text-muted-foreground text-lg">
                  Paste the JSON into our upload page and let the system automatically parse it
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Track Your Progress</h3>
                <p className="text-muted-foreground text-lg">
                  View your daily tasks, weekly goals, and monthly objectives all in one organized dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={() => router.push('/upload')}
              className="text-lg h-14 px-8"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Planning Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="text-center text-muted-foreground">
          <p>© 2025 AI Exam Planner. Built with Next.js and AI.</p>
        </div>
      </footer>
    </div>
  );
}