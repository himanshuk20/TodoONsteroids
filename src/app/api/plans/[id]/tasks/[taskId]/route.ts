import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyTasks, studyPlans, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function PUT(
  request: NextRequest,
  context: { params: { id: string; taskId: string } }
) {
  try {
    const userId = await validateSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id, taskId } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid study plan ID is required', code: 'INVALID_STUDY_PLAN_ID' },
        { status: 400 }
      );
    }

    if (!taskId || isNaN(parseInt(taskId))) {
      return NextResponse.json(
        { error: 'Valid task ID is required', code: 'INVALID_TASK_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { completed } = body;

    if (completed === undefined || completed === null) {
      return NextResponse.json(
        { error: 'Completed field is required', code: 'MISSING_COMPLETED_FIELD' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed field must be a boolean', code: 'INVALID_COMPLETED_TYPE' },
        { status: 400 }
      );
    }

    const taskRecord = await db
      .select({
        id: dailyTasks.id,
        studyPlanId: dailyTasks.studyPlanId,
        weeklyGoalId: dailyTasks.weeklyGoalId,
        name: dailyTasks.name,
        date: dailyTasks.date,
        completed: dailyTasks.completed,
        createdAt: dailyTasks.createdAt,
        userId: studyPlans.userId,
      })
      .from(dailyTasks)
      .leftJoin(studyPlans, eq(dailyTasks.studyPlanId, studyPlans.id))
      .where(eq(dailyTasks.id, parseInt(taskId)))
      .limit(1);

    if (taskRecord.length === 0) {
      return NextResponse.json(
        { error: 'Daily task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (taskRecord[0].userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this task', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (taskRecord[0].studyPlanId !== parseInt(id)) {
      return NextResponse.json(
        { error: 'Task does not belong to the specified study plan', code: 'PLAN_MISMATCH' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(dailyTasks)
      .set({
        completed: completed,
      })
      .where(eq(dailyTasks.id, parseInt(taskId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update daily task', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}