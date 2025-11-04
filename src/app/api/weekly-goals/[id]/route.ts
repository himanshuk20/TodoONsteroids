import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { weeklyGoals, studyPlans, session } from '@/db/schema';
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

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed field is required and must be a boolean', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    const goalRecord = await db.select({
      id: weeklyGoals.id,
      studyPlanId: weeklyGoals.studyPlanId,
      weekNumber: weeklyGoals.weekNumber,
      goal: weeklyGoals.goal,
      completed: weeklyGoals.completed,
      createdAt: weeklyGoals.createdAt,
      userId: studyPlans.userId,
    })
    .from(weeklyGoals)
    .leftJoin(studyPlans, eq(weeklyGoals.studyPlanId, studyPlans.id))
    .where(eq(weeklyGoals.id, parseInt(id)))
    .limit(1);

    if (goalRecord.length === 0) {
      return NextResponse.json(
        { error: 'Weekly goal not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (goalRecord[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this resource', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const updated = await db.update(weeklyGoals)
      .set({
        completed: completed
      })
      .where(eq(weeklyGoals.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update weekly goal', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}