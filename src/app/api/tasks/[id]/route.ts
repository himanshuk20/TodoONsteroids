import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyTasks, studyPlans, session } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authentication validation
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'MISSING_AUTH_TOKEN' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session and get userId
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid authentication token',
          code: 'INVALID_AUTH_TOKEN' 
        },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return NextResponse.json(
        { 
          error: 'Session expired',
          code: 'SESSION_EXPIRED' 
        },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Extract and validate id from params
    const { id } = await context.params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { completed } = body;

    // Validate completed field is present
    if (completed === undefined || completed === null) {
      return NextResponse.json(
        { 
          error: 'Completed field is required',
          code: 'MISSING_COMPLETED_FIELD' 
        },
        { status: 400 }
      );
    }

    // Validate completed is boolean
    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Completed field must be a boolean',
          code: 'INVALID_COMPLETED_TYPE' 
        },
        { status: 400 }
      );
    }

    // Query dailyTasks with JOIN to studyPlans for ownership validation
    const taskRecord = await db.select({
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
    .where(eq(dailyTasks.id, parseInt(id)))
    .limit(1);

    // Check if task exists
    if (taskRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Daily task not found',
          code: 'TASK_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const task = taskRecord[0];

    // Verify ownership
    if (task.userId !== userId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access to this resource',
          code: 'UNAUTHORIZED_ACCESS' 
        },
        { status: 403 }
      );
    }

    // Update daily task completion status
    const updatedTask = await db.update(dailyTasks)
      .set({
        completed: completed
      })
      .where(eq(dailyTasks.id, parseInt(id)))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update daily task',
          code: 'UPDATE_FAILED' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTask[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}