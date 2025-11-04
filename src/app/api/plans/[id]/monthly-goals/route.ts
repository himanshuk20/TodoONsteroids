import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyGoals, studyPlans, session } from '@/db/schema';
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

async function verifyStudyPlanOwnership(studyPlanId: number, userId: string) {
  try {
    const plan = await db.select()
      .from(studyPlans)
      .where(eq(studyPlans.id, studyPlanId))
      .limit(1);

    if (plan.length === 0) {
      return { exists: false, isOwner: false };
    }

    return { exists: true, isOwner: plan[0].userId === userId };
  } catch (error) {
    console.error('Study plan verification error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = await validateSession(request);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const studyPlanId = context.params.id;

    if (!studyPlanId || isNaN(parseInt(studyPlanId))) {
      return NextResponse.json({ 
        error: 'Valid study plan ID is required',
        code: 'INVALID_STUDY_PLAN_ID' 
      }, { status: 400 });
    }

    const planIdInt = parseInt(studyPlanId);
    const { exists, isOwner } = await verifyStudyPlanOwnership(planIdInt, userId);

    if (!exists) {
      return NextResponse.json({ 
        error: 'Study plan not found',
        code: 'STUDY_PLAN_NOT_FOUND' 
      }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json({ 
        error: 'Unauthorized access to study plan',
        code: 'UNAUTHORIZED_ACCESS' 
      }, { status: 403 });
    }

    const goals = await db.select()
      .from(monthlyGoals)
      .where(eq(monthlyGoals.studyPlanId, planIdInt));

    return NextResponse.json(goals, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = await validateSession(request);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const studyPlanId = context.params.id;

    if (!studyPlanId || isNaN(parseInt(studyPlanId))) {
      return NextResponse.json({ 
        error: 'Valid study plan ID is required',
        code: 'INVALID_STUDY_PLAN_ID' 
      }, { status: 400 });
    }

    const planIdInt = parseInt(studyPlanId);
    const { exists, isOwner } = await verifyStudyPlanOwnership(planIdInt, userId);

    if (!exists) {
      return NextResponse.json({ 
        error: 'Study plan not found',
        code: 'STUDY_PLAN_NOT_FOUND' 
      }, { status: 404 });
    }

    if (!isOwner) {
      return NextResponse.json({ 
        error: 'Unauthorized access to study plan',
        code: 'UNAUTHORIZED_ACCESS' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { goal } = body;

    if (!goal || typeof goal !== 'string' || goal.trim() === '') {
      return NextResponse.json({ 
        error: 'Goal is required and must be a non-empty string',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    const newGoal = await db.insert(monthlyGoals)
      .values({
        studyPlanId: planIdInt,
        goal: goal.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newGoal[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}