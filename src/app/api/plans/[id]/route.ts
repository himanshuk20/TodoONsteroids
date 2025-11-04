import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { studyPlans, monthlyGoals, weeklyGoals, dailyTasks, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, userId: null };
  }

  const token = authHeader.substring(7);

  try {
    const sessions = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return { valid: false, userId: null };
    }

    const userSession = sessions[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return { valid: false, userId: null };
    }

    return { valid: true, userId: userSession.userId };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, userId: null };
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { valid, userId } = await validateSession(request);
    if (!valid || !userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const studyPlanId = parseInt(id);

    const studyPlan = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, studyPlanId))
      .limit(1);

    if (studyPlan.length === 0) {
      return NextResponse.json(
        { error: 'Study plan not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (studyPlan[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this resource', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch all related data
    const monthlyGoalsData = await db
      .select()
      .from(monthlyGoals)
      .where(eq(monthlyGoals.studyPlanId, studyPlanId));

    const weeklyGoalsData = await db
      .select()
      .from(weeklyGoals)
      .where(eq(weeklyGoals.studyPlanId, studyPlanId));

    const dailyTasksData = await db
      .select()
      .from(dailyTasks)
      .where(eq(dailyTasks.studyPlanId, studyPlanId));

    // Organize tasks by weekly goal
    const weeklyGoalsWithTasks = weeklyGoalsData.map(weeklyGoal => ({
      ...weeklyGoal,
      tasks: dailyTasksData.filter(task => task.weeklyGoalId === weeklyGoal.id)
    }));

    // Get tasks not associated with any weekly goal
    const unassignedTasks = dailyTasksData.filter(task => !task.weeklyGoalId);

    const result = {
      ...studyPlan[0],
      monthlyGoals: monthlyGoalsData,
      weeklyGoals: weeklyGoalsWithTasks,
      dailyTasks: unassignedTasks
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { valid, userId } = await validateSession(request);
    if (!valid || !userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const studyPlanId = parseInt(id);

    const existingPlan = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, studyPlanId))
      .limit(1);

    if (existingPlan.length === 0) {
      return NextResponse.json(
        { error: 'Study plan not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingPlan[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this resource', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { examName, month } = body;

    const updates: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    if (examName !== undefined) {
      if (typeof examName !== 'string' || examName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Exam name must be a non-empty string', code: 'INVALID_EXAM_NAME' },
          { status: 400 }
        );
      }
      updates.examName = examName.trim();
    }

    if (month !== undefined) {
      if (typeof month !== 'string' || month.trim().length === 0) {
        return NextResponse.json(
          { error: 'Month must be a non-empty string', code: 'INVALID_MONTH' },
          { status: 400 }
        );
      }
      updates.month = month.trim();
    }

    const updated = await db
      .update(studyPlans)
      .set(updates)
      .where(eq(studyPlans.id, studyPlanId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update study plan', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { valid, userId } = await validateSession(request);
    if (!valid || !userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const studyPlanId = parseInt(id);

    const existingPlan = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, studyPlanId))
      .limit(1);

    if (existingPlan.length === 0) {
      return NextResponse.json(
        { error: 'Study plan not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingPlan[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this resource', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(studyPlans)
      .where(eq(studyPlans.id, studyPlanId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete study plan', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Study plan deleted successfully',
        deletedPlan: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}