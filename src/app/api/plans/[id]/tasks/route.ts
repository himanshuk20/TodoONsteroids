import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyTasks, studyPlans, session } from '@/db/schema';
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

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const studyPlanId = context.params.id;

    if (!studyPlanId || isNaN(parseInt(studyPlanId))) {
      return NextResponse.json(
        {
          error: 'Valid study plan ID is required',
          code: 'INVALID_STUDY_PLAN_ID',
        },
        { status: 400 }
      );
    }

    const studyPlan = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, parseInt(studyPlanId)))
      .limit(1);

    if (studyPlan.length === 0) {
      return NextResponse.json(
        { error: 'Study plan not found', code: 'STUDY_PLAN_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (studyPlan[0].userId !== userId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to access this study plan',
          code: 'UNAUTHORIZED_ACCESS',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const weeklyGoalId = searchParams.get('weeklyGoalId');

    const conditions = [eq(dailyTasks.studyPlanId, parseInt(studyPlanId))];

    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          {
            error: 'Invalid date format. Expected YYYY-MM-DD',
            code: 'INVALID_DATE_FORMAT',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(dailyTasks.date, date));
    }

    if (weeklyGoalId) {
      if (isNaN(parseInt(weeklyGoalId))) {
        return NextResponse.json(
          {
            error: 'Valid weekly goal ID is required',
            code: 'INVALID_WEEKLY_GOAL_ID',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(dailyTasks.weeklyGoalId, parseInt(weeklyGoalId)));
    }

    const tasks = await db
      .select()
      .from(dailyTasks)
      .where(and(...conditions));

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = await validateSession(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const studyPlanId = context.params.id;

    if (!studyPlanId || isNaN(parseInt(studyPlanId))) {
      return NextResponse.json(
        {
          error: 'Valid study plan ID is required',
          code: 'INVALID_STUDY_PLAN_ID',
        },
        { status: 400 }
      );
    }

    const studyPlan = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, parseInt(studyPlanId)))
      .limit(1);

    if (studyPlan.length === 0) {
      return NextResponse.json(
        { error: 'Study plan not found', code: 'STUDY_PLAN_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (studyPlan[0].userId !== userId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to access this study plan',
          code: 'UNAUTHORIZED_ACCESS',
        },
        { status: 403 }
      );
    }

    const requestBody = await request.json();
    const { name, date, weeklyGoalId } = requestBody;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          error: 'Task name is required and must be a non-empty string',
          code: 'MISSING_TASK_NAME',
        },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        {
          error: 'Date is required',
          code: 'MISSING_DATE',
        },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        {
          error: 'Invalid date format. Expected YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT',
        },
        { status: 400 }
      );
    }

    const insertData: {
      studyPlanId: number;
      name: string;
      date: string;
      completed: boolean;
      createdAt: string;
      weeklyGoalId?: number;
    } = {
      studyPlanId: parseInt(studyPlanId),
      name: name.trim(),
      date,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (weeklyGoalId !== undefined && weeklyGoalId !== null) {
      if (isNaN(parseInt(weeklyGoalId))) {
        return NextResponse.json(
          {
            error: 'Valid weekly goal ID is required',
            code: 'INVALID_WEEKLY_GOAL_ID',
          },
          { status: 400 }
        );
      }
      insertData.weeklyGoalId = parseInt(weeklyGoalId);
    }

    const newTask = await db.insert(dailyTasks).values(insertData).returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}