import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { studyPlans, session } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const sessionRecord = await db.select().from(session).where(eq(session.token, token)).limit(1);
  
  if (sessionRecord.length === 0) {
    return null;
  }
  
  return sessionRecord[0].userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(studyPlans).where(eq(studyPlans.userId, userId));

    if (search) {
      const searchCondition = or(
        like(studyPlans.examName, `%${search}%`),
        like(studyPlans.month, `%${search}%`)
      );
      
      query = db.select()
        .from(studyPlans)
        .where(and(eq(studyPlans.userId, userId), searchCondition));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const { examName, month } = body;

    if (!examName) {
      return NextResponse.json({ 
        error: 'examName is required',
        code: 'MISSING_EXAM_NAME' 
      }, { status: 400 });
    }

    if (!month) {
      return NextResponse.json({ 
        error: 'month is required',
        code: 'MISSING_MONTH' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newStudyPlan = await db.insert(studyPlans)
      .values({
        userId,
        examName: examName.trim(),
        month: month.trim(),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newStudyPlan[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}