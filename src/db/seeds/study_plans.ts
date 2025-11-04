import { db } from '@/db';
import { user, studyPlans, monthlyGoals, weeklyGoals, dailyTasks } from '@/db/schema';

async function main() {
    // Query existing user
    const users = await db.select().from(user).limit(1);
    if (users.length === 0) {
        throw new Error('No users found. Please create a user first.');
    }
    const testUserId = users[0].id;

    // Create study plans
    const sampleStudyPlans = [
        {
            userId: testUserId,
            examName: 'UPSC Civil Services Exam',
            month: 'June 2025',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: testUserId,
            examName: 'JEE Advanced',
            month: 'May 2025',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: testUserId,
            examName: 'NEET UG',
            month: 'July 2025',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    const createdStudyPlans = await db.insert(studyPlans).values(sampleStudyPlans).returning();

    // Create monthly goals for each study plan
    const sampleMonthlyGoals = [
        // UPSC Monthly Goals
        {
            studyPlanId: createdStudyPlans[0].id,
            goal: 'Complete Ancient and Medieval Indian History',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            goal: 'Finish Modern Indian History and Freedom Struggle',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            goal: 'Master Indian Polity and Governance',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        // JEE Monthly Goals
        {
            studyPlanId: createdStudyPlans[1].id,
            goal: 'Complete 60% of Physics syllabus',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            goal: 'Master Organic Chemistry fundamentals',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            goal: 'Solve 500 mathematics practice problems',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        // NEET Monthly Goals
        {
            studyPlanId: createdStudyPlans[2].id,
            goal: 'Complete Biology NCERT revision',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            goal: 'Master Human Physiology and Genetics',
            completed: true,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(monthlyGoals).values(sampleMonthlyGoals);

    // Create weekly goals for each study plan
    const sampleWeeklyGoals = [
        // UPSC Weekly Goals
        {
            studyPlanId: createdStudyPlans[0].id,
            weekNumber: 1,
            goal: 'Week 1: Ancient India - Indus Valley to Mauryan Empire',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weekNumber: 2,
            goal: 'Week 2: Medieval India - Delhi Sultanate and Mughal Period',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weekNumber: 3,
            goal: 'Week 3: Modern History - British Raj and Reform Movements',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weekNumber: 4,
            goal: 'Week 4: Indian Constitution and Political System',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        // JEE Weekly Goals
        {
            studyPlanId: createdStudyPlans[1].id,
            weekNumber: 1,
            goal: 'Week 1: Mechanics and Thermodynamics',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weekNumber: 2,
            goal: 'Week 2: Organic Chemistry - Hydrocarbons and Reactions',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weekNumber: 3,
            goal: 'Week 3: Calculus and Coordinate Geometry',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        // NEET Weekly Goals
        {
            studyPlanId: createdStudyPlans[2].id,
            weekNumber: 1,
            goal: 'Week 1: Cell Biology and Biomolecules',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weekNumber: 2,
            goal: 'Week 2: Human Anatomy and Physiology',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weekNumber: 3,
            goal: 'Week 3: Genetics and Evolution',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weekNumber: 4,
            goal: 'Week 4: Plant Physiology and Ecology',
            completed: false,
            createdAt: new Date().toISOString(),
        },
    ];

    const createdWeeklyGoals = await db.insert(weeklyGoals).values(sampleWeeklyGoals).returning();

    // Create daily tasks for each study plan
    const sampleDailyTasks = [
        // UPSC Daily Tasks
        {
            studyPlanId: createdStudyPlans[0].id,
            weeklyGoalId: createdWeeklyGoals[0].id,
            name: 'Read NCERT Chapter 1: Indus Valley Civilization',
            date: '2025-01-15',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weeklyGoalId: createdWeeklyGoals[0].id,
            name: 'Make notes on Mauryan Administration',
            date: '2025-01-16',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weeklyGoalId: createdWeeklyGoals[1].id,
            name: 'Study Delhi Sultanate dynasties',
            date: '2025-01-17',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weeklyGoalId: null,
            name: 'Solve 50 previous year questions',
            date: '2025-01-18',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[0].id,
            weeklyGoalId: createdWeeklyGoals[2].id,
            name: 'Watch video lecture on British East India Company',
            date: '2025-01-19',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        // JEE Daily Tasks
        {
            studyPlanId: createdStudyPlans[1].id,
            weeklyGoalId: createdWeeklyGoals[4].id,
            name: 'Practice 20 mechanics problems',
            date: '2025-01-15',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weeklyGoalId: createdWeeklyGoals[4].id,
            name: 'Complete thermodynamics chapter exercises',
            date: '2025-01-16',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weeklyGoalId: createdWeeklyGoals[5].id,
            name: 'Memorize organic reaction mechanisms',
            date: '2025-01-17',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weeklyGoalId: null,
            name: 'Take mock test for Physics section',
            date: '2025-01-18',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weeklyGoalId: createdWeeklyGoals[6].id,
            name: 'Solve integration problems',
            date: '2025-01-19',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[1].id,
            weeklyGoalId: null,
            name: 'Review all formulas and concepts',
            date: '2025-01-20',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        // NEET Daily Tasks
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: createdWeeklyGoals[7].id,
            name: 'Study cell structure and organelles',
            date: '2025-01-15',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: createdWeeklyGoals[7].id,
            name: 'Make diagrams of biomolecules',
            date: '2025-01-16',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: createdWeeklyGoals[8].id,
            name: 'Learn digestive system anatomy',
            date: '2025-01-17',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: createdWeeklyGoals[8].id,
            name: 'Practice questions on circulatory system',
            date: '2025-01-18',
            completed: true,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: null,
            name: 'Revise previous topics with flashcards',
            date: '2025-01-19',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: createdWeeklyGoals[9].id,
            name: 'Study Mendelian genetics principles',
            date: '2025-01-20',
            completed: false,
            createdAt: new Date().toISOString(),
        },
        {
            studyPlanId: createdStudyPlans[2].id,
            weeklyGoalId: null,
            name: 'Complete Biology mock test',
            date: '2025-01-21',
            completed: false,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(dailyTasks).values(sampleDailyTasks);

    console.log('✅ Study plans seeder completed successfully');
    console.log(`Created ${createdStudyPlans.length} study plans with monthly goals, weekly goals, and daily tasks`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});