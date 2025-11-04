import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { monthlyGoals, studyPlans, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Authentication validation
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const sessionRecord = await db.select().from(session).where(eq(session.token, token)).limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userId = sessionRecord[0].userId;

    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
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

    const goalRecord = await db
      .select({
        id: monthlyGoals.id,
        studyPlanId: monthlyGoals.studyPlanId,
        goal: monthlyGoals.goal,
        completed: monthlyGoals.completed,
        createdAt: monthlyGoals.createdAt,
        userId: studyPlans.userId,
      })
      .from(monthlyGoals)
      .leftJoin(studyPlans, eq(monthlyGoals.studyPlanId, studyPlans.id))
      .where(eq(monthlyGoals.id, parseInt(id)))
      .limit(1);

    if (goalRecord.length === 0) {
      return NextResponse.json(
        { error: 'Monthly goal not found', code: 'GOAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (goalRecord[0].userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this monthly goal', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const updated = await db
      .update(monthlyGoals)
      .set({
        completed: completed,
      })
      .where(eq(monthlyGoals.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update monthly goal', code: 'UPDATE_FAILED' },
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