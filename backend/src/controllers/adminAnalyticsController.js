import { prisma } from "../config/database.js";
import { fetchRecentUserRemovalLogs } from "../utils/ensureUserRemovalLogSchema.js";
import { isListableUserRole } from "../utils/ensureUserRoleEnum.js";
import { LMS_STUDENT_ROLE } from "../constants/lmsRoles.js";

async function buildAuditLogs(fetchLimit = 200) {
  const take = Math.min(Math.max(fetchLimit, 50), 500);

  const [quizResponses, gradedSubmissions, submittedAssignments, recentUsers, sessions, removalLogs] =
    await Promise.all([
      prisma.quizResponse.findMany({
        take,
        orderBy: { attemptedAt: "desc" },
        include: {
          user: { select: { name: true } },
          quiz: { select: { title: true } },
        },
      }),
      prisma.assignmentSubmission.findMany({
        where: { status: "GRADED" },
        take,
        orderBy: { gradedAt: "desc" },
        include: {
          user: { select: { name: true } },
          assignment: { select: { title: true } },
        },
      }),
      prisma.assignmentSubmission.findMany({
        where: { status: { in: ["SUBMITTED", "PENDING"] } },
        take,
        orderBy: { submittedAt: "desc" },
        include: {
          user: { select: { name: true } },
          assignment: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        take,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.session.findMany({
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      fetchRecentUserRemovalLogs(take),
    ]);

  const events = [];

  for (const response of quizResponses) {
    events.push({
      id: `quiz-${response.id}`,
      userId: response.userId,
      userName: response.user?.name ?? "Unknown User",
      action: "QUIZ_SUBMITTED",
      details: `Scored ${response.score ?? 0}% on ${response.quiz?.title ?? "Quiz"}`,
      ipAddress: null,
      timestamp: response.attemptedAt.toISOString(),
    });
  }

  for (const submission of gradedSubmissions) {
    events.push({
      id: `grade-${submission.id}`,
      userId: submission.userId,
      userName: submission.user?.name ?? "Unknown User",
      action: "ASSIGNMENT_GRADED",
      details: `Graded ${submission.user?.name ?? "student"} (${submission.grade ?? 0}/100) on ${submission.assignment?.title ?? "Assignment"}`,
      ipAddress: null,
      timestamp: (submission.gradedAt ?? submission.updatedAt).toISOString(),
    });
  }

  for (const submission of submittedAssignments) {
    events.push({
      id: `submit-${submission.id}`,
      userId: submission.userId,
      userName: submission.user?.name ?? "Unknown User",
      action: "ASSIGNMENT_SUBMITTED",
      details: `Submitted ${submission.assignment?.title ?? "Assignment"}`,
      ipAddress: null,
      timestamp: (submission.submittedAt ?? submission.createdAt).toISOString(),
    });
  }

  for (const user of recentUsers) {
    events.push({
      id: `register-${user.id}`,
      userId: user.id,
      userName: user.name,
      action: "USER_REGISTERED",
      details: `New account: ${user.email}`,
      ipAddress: null,
      timestamp: user.createdAt.toISOString(),
    });
  }

  for (const session of sessions) {
    events.push({
      id: `session-${session.id}`,
      userId: session.userId,
      userName: session.user?.name ?? "Unknown User",
      action: "USER_LOGIN",
      details: "Signed in to the platform",
      ipAddress: session.ipAddress ?? "—",
      timestamp: session.createdAt.toISOString(),
    });
  }

  for (const log of removalLogs) {
    const removedBy = log.removedByEmail ? ` by ${log.removedByEmail}` : "";
    events.push({
      id: `removed-${log.id}`,
      userId: log.userId,
      userName: log.name,
      action: "USER_REMOVED",
      details: `Removed ${log.email}${removedBy}: ${log.reason}`,
      ipAddress: null,
      timestamp: new Date(log.createdAt).toISOString(),
    });
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}

export async function getAdminAnalytics(req, res) {
  try {
    const [
      totalUsers,
      studentCount,
      activeCourses,
      gradedSubmissions,
      enrollments,
      completedEnrollments,
      progressAggregate,
      featuredCourse,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.course.count({ where: { status: "ACTIVE" } }),
      prisma.assignmentSubmission.count({ where: { status: "GRADED" } }),
      prisma.enrollment.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
      prisma.enrollment.count({ where: { status: "COMPLETED" } }),
      prisma.courseProgress.aggregate({ _avg: { overallProgress: true } }),
      prisma.course.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { title: true, duration: true },
      }),
    ]);

    let completionRate = 0;
    if (enrollments > 0) {
      completionRate = Math.round((completedEnrollments / enrollments) * 100);
    } else if (progressAggregate._avg.overallProgress != null) {
      completionRate = Math.round(progressAggregate._avg.overallProgress);
    }

    const recentAuditLogs = (await buildAuditLogs(50)).slice(0, 5);

    const programLabel = featuredCourse
      ? `${featuredCourse.title}${featuredCourse.duration ? ` (${featuredCourse.duration})` : ""}`
      : "No active programs";

    return res.json({
      success: true,
      data: {
        totalRegistered: totalUsers,
        studentCount,
        activePrograms: activeCourses,
        programLabel,
        submissionsEvaluated: gradedSubmissions,
        completionRate,
        recentAuditLogs,
      },
    });
  } catch (error) {
    console.error("[adminAnalytics] getAdminAnalytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin analytics",
    });
  }
}

export async function listAdminUsers(req, res) {
  try {
    const { search, role } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 15, 5), 100);

    const studentWhere = { role: LMS_STUDENT_ROLE };
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where = {};

    if (role && role !== "ALL") {
      if (!isListableUserRole(role)) {
        const [totalStudents, newThisWeek, activeLast30Days, neverLoggedIn] = await Promise.all([
          prisma.user.count({ where: studentWhere }),
          prisma.user.count({
            where: { ...studentWhere, createdAt: { gte: weekAgo } },
          }),
          prisma.user.count({
            where: { ...studentWhere, lastLoginAt: { gte: thirtyDaysAgo } },
          }),
          prisma.user.count({ where: { ...studentWhere, lastLoginAt: null } }),
        ]);

        return res.json({
          success: true,
          data: [],
          meta: {
            total: 0,
            page: 1,
            pageSize,
            totalPages: 1,
            stats: { totalStudents, newThisWeek, activeLast30Days, neverLoggedIn },
          },
        });
      }
      where.role = role;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const [dbTotal, studentStats] = await Promise.all([
      prisma.user.count({ where }),
      Promise.all([
        prisma.user.count({ where: studentWhere }),
        prisma.user.count({ where: { ...studentWhere, createdAt: { gte: weekAgo } } }),
        prisma.user.count({
          where: { ...studentWhere, lastLoginAt: { gte: thirtyDaysAgo } },
        }),
        prisma.user.count({ where: { ...studentWhere, lastLoginAt: null } }),
      ]),
    ]);

    const adminUserLimit = req.admin?.userLimit ?? null;
    const effectiveTotal =
      adminUserLimit != null ? Math.min(dbTotal, adminUserLimit) : dbTotal;
    const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;

    let take = pageSize;
    if (adminUserLimit != null) {
      const remaining = adminUserLimit - skip;
      if (remaining <= 0) {
        take = 0;
      } else {
        take = Math.min(pageSize, remaining);
      }
    }

    const users =
      take > 0
        ? await prisma.user.findMany({
            where,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              authProvider: true,
              emailVerified: true,
              createdAt: true,
              lastLoginAt: true,
              deactivatedUntil: true,
              deactivationReason: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          })
        : [];

    const [totalStudents, newThisWeek, activeLast30Days, neverLoggedIn] = studentStats;
    const now = Date.now();

    return res.json({
      success: true,
      data: users.map((user) => {
        const until = user.deactivatedUntil;
        const isDeactivated = Boolean(until && until.getTime() > now);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          authProvider: user.authProvider,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          deactivatedUntil: until?.toISOString() ?? null,
          deactivationReason: user.deactivationReason ?? null,
          isDeactivated,
        };
      }),
      meta: {
        total: effectiveTotal,
        page: safePage,
        pageSize,
        totalPages,
        stats: {
          totalStudents,
          newThisWeek,
          activeLast30Days,
          neverLoggedIn,
        },
        ...(adminUserLimit != null
          ? { userLimit: adminUserLimit, capped: dbTotal > adminUserLimit }
          : {}),
      },
    });
  } catch (error) {
    console.error("[adminAnalytics] listAdminUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

export async function getAdminAuditLogs(req, res) {
  try {
    const action = req.query.action?.trim().toUpperCase();
    const search = req.query.search?.trim().toLowerCase();
    const days = Number(req.query.days) || 0;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 5), 50);

    let events = await buildAuditLogs(300);

    if (action && action !== "ALL") {
      events = events.filter((event) => event.action === action);
    }

    if (search) {
      events = events.filter(
        (event) =>
          event.userName.toLowerCase().includes(search) ||
          event.details.toLowerCase().includes(search) ||
          event.action.toLowerCase().includes(search)
      );
    }

    if (days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      events = events.filter((event) => new Date(event.timestamp) >= since);
    }

    const total = events.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;
    const data = events.slice(offset, offset + pageSize);

    return res.json({
      success: true,
      data,
      meta: {
        total,
        page: safePage,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[adminAnalytics] getAdminAuditLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load audit logs",
    });
  }
}
