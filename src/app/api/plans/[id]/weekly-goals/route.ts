import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { weeklyGoals, studyPlans, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const sess = sessionRecord[0];
    
    if (sess.expiresAt < new Date()) {
      return null;
    }

    return sess.userId;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const studyPlanId = context.params.id;

    if (!studyPlanId || isNaN(parseInt(studyPlanId))) {
      return NextResponse.json({ 
        error: "Valid study plan ID is required",
        code: "INVALID_STUDY_PLAN_ID" 
      }, { status: 400 });
    }

    const studyPlanIdInt = parseInt(studyPlanId);

    const studyPlan = await db.select()
      .from(studyPlans)
      .where(eq(studyPlans.id, studyPlanIdInt))
      .limit(1);

    if (studyPlan.length === 0) {
      return NextResponse.json({ 
        error: 'Study plan not found',
        code: 'STUDY_PLAN_NOT_FOUND'
      }, { status: 404 });
    }

    if (studyPlan[0].userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized access to this study plan',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('week');

    let query = db.select()
      .from(weeklyGoals)
      .where(eq(weeklyGoals.studyPlanId, studyPlanIdInt));

    if (weekNumber) {
      const weekNum = parseInt(weekNumber);
      if (isNaN(weekNum)) {
        return NextResponse.json({ 
          error: "Valid week number is required",
          code: "INVALID_WEEK_NUMBER" 
        }, { status: 400 });
      }
      
      const results = await db.select()
        .from(weeklyGoals)
        .where(and(
          eq(weeklyGoals.studyPlanId, studyPlanIdInt),
          eq(weeklyGoals.weekNumber, weekNum)
        ));
      
      return NextResponse.json(results, { status: 200 });
    }

    const results = await query;
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const studyPlanId = context.params.id;

    if (!studyPlanId || isNaN(parseInt(studyPlanId))) {
      return NextResponse.json({ 
        error: "Valid study plan ID is required",
        code: "INVALID_STUDY_PLAN_ID" 
      }, { status: 400 });
    }

    const studyPlanIdInt = parseInt(studyPlanId);

    const studyPlan = await db.select()
      .from(studyPlans)
      .where(eq(studyPlans.id, studyPlanIdInt))
      .limit(1);

    if (studyPlan.length === 0) {
      return NextResponse.json({ 
        error: 'Study plan not found',
        code: 'STUDY_PLAN_NOT_FOUND'
      }, { status: 404 });
    }

    if (studyPlan[0].userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized access to this study plan',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    const body = await request.json();
    const { weekNumber, goal } = body;

    if (!weekNumber) {
      return NextResponse.json({ 
        error: "Week number is required",
        code: "MISSING_WEEK_NUMBER" 
      }, { status: 400 });
    }

    if (!goal) {
      return NextResponse.json({ 
        error: "Goal is required",
        code: "MISSING_GOAL" 
      }, { status: 400 });
    }

    const weekNum = parseInt(weekNumber);
    if (isNaN(weekNum) || weekNum <= 0) {
      return NextResponse.json({ 
        error: "Week number must be a positive integer",
        code: "INVALID_WEEK_NUMBER" 
      }, { status: 400 });
    }

    const newWeeklyGoal = await db.insert(weeklyGoals)
      .values({
        studyPlanId: studyPlanIdInt,
        weekNumber: weekNum,
        goal: goal.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newWeeklyGoal[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}