import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const configSchema = z.object({
  canvasApiKey: z.string().describe("Your Canvas API access token"),
  canvasBaseUrl: z
    .string()
    .default("https://canvas.instructure.com")
    .describe("Your Canvas instance URL"),
  debug: z.boolean().default(false).describe("Enable debug logging"),
});

export type Config = z.infer<typeof configSchema>;

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatCourse = (course: Record<string, any>): string => {
  const teacherList = Array.isArray(course?.teachers)
    ? course.teachers
        .map((t: any) => t?.name)
        .filter(Boolean)
        .join(", ")
    : undefined;

  return [
    `📚 **${course?.name ?? "Untitled Course"}** (${course?.course_code ?? "N/A"})`,
    `   ID: ${course?.id ?? "N/A"} | Status: ${course?.workflow_state ?? "unknown"}`,
    `   Term: ${course?.term?.name ?? "N/A"}`,
    teacherList ? `   Teachers: ${teacherList}` : undefined,
    course?.html_url ? `   URL: ${course.html_url}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
};

const formatAssignment = (assignment: Record<string, any>): string =>
  [
    `📝 **${assignment?.name ?? "Assignment"}**`,
    `   ID: ${assignment?.id ?? "N/A"} | Points: ${assignment?.points_possible ?? "N/A"}`,
    `   Due: ${formatDate(assignment?.due_at)}`,
    assignment?.html_url ? `   URL: ${assignment.html_url}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

const formatModule = (module: Record<string, any>): string =>
  [
    `📦 **${module?.name ?? "Module"}**`,
    `   ID: ${module?.id ?? "N/A"} | Status: ${module?.state ?? "unknown"}`,
    `   Items: ${module?.items_count ?? module?.items?.length ?? 0}`,
  ].join("\n");

const formatAnnouncement = (announcement: Record<string, any>): string =>
  [
    `📣 **${announcement?.title ?? "Announcement"}**`,
    `   ID: ${announcement?.id ?? "N/A"} | Posted: ${formatDate(announcement?.posted_at)}`,
    announcement?.message
      ? `   ${announcement.message.replace(/<[^>]+>/g, " ").trim()}`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");

const formatDiscussion = (discussion: Record<string, any>): string =>
  [
    `💬 **${discussion?.title ?? "Discussion"}**`,
    `   ID: ${discussion?.id ?? "N/A"} | Replies: ${discussion?.discussion_subentry_count ?? 0}`,
    `   Last post: ${formatDate(discussion?.last_reply_at)}`,
  ].join("\n");

const formatEvent = (event: Record<string, any>): string =>
  [
    `📅 **${event?.title ?? "Calendar Event"}**`,
    `   ID: ${event?.id ?? "N/A"} | When: ${formatDate(event?.start_at)}`,
    event?.type ? `   Type: ${event.type}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

const formatTodo = (todo: Record<string, any>): string =>
  [
    `✅ **${todo?.title ?? "Todo"}**`,
    todo?.course_id ? `   Course ID: ${todo.course_id}` : undefined,
    todo?.due_at ? `   Due: ${formatDate(todo.due_at)}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

const formatQuiz = (quiz: Record<string, any>): string =>
  [
    `🧪 **${quiz?.title ?? "Quiz"}**`,
    `   ID: ${quiz?.id ?? "N/A"} | Points: ${quiz?.points_possible ?? "N/A"}`,
    `   Due: ${formatDate(quiz?.due_at)}`,
  ].join("\n");

const formatSubmissionStatus = (submission: Record<string, any>): string =>
  [
    `📤 **Submission Status**`,
    `   Workflow: ${submission?.workflow_state ?? "unknown"}`,
    `   Score: ${submission?.score ?? "N/A"}`,
    `   Grade: ${submission?.grade ?? "N/A"}`,
    `   Submitted: ${formatDate(submission?.submitted_at)}`,
  ].join("\n");

const formatProfile = (profile: Record<string, any>): string =>
  [
    `👤 **${profile?.name ?? "Canvas User"}**`,
    profile?.primary_email ? `   Email: ${profile.primary_email}` : undefined,
    profile?.login_id ? `   Login: ${profile.login_id}` : undefined,
    profile?.id ? `   ID: ${profile.id}` : undefined,
    profile?.time_zone ? `   Timezone: ${profile.time_zone}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

const formatJson = (value: unknown): string =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

const CourseArgsSchema = z.object({ course_id: z.number() });
const SubmissionArgsSchema = z.object({
  course_id: z.number(),
  assignment_id: z.number(),
});

// Canvas API client
class CanvasAPI {
  constructor(
    private apiKey: string,
    private baseUrl: string,
  ) {}

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Canvas API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async listCourses() {
    return this.fetch("/courses?enrollment_state=active&per_page=100");
  }

  async getAssignments(courseId: number) {
    return this.fetch(`/courses/${courseId}/assignments?per_page=100`);
  }

  async getUpcomingAssignments() {
    const courses = (await this.listCourses()) as any[];
    const allAssignments = await Promise.all(
      courses.map((course: any) =>
        this.getAssignments(course.id).catch(() => []),
      ),
    );

    const now = new Date();
    return allAssignments
      .flat()
      .filter((a: any) => a.due_at && new Date(a.due_at) > now)
      .sort(
        (a: any, b: any) =>
          new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
      )
      .slice(0, 20);
  }

  async getGrades(courseId: number) {
    return this.fetch(
      `/courses/${courseId}/enrollments?user_id=self&include[]=total_scores`,
    );
  }

  async getUserProfile() {
    return this.fetch("/users/self/profile");
  }

  async getModules(courseId: number) {
    return this.fetch(`/courses/${courseId}/modules?per_page=100`);
  }

  async getAnnouncements(courseId: number) {
    return this.fetch(
      `/courses/${courseId}/discussion_topics?only_announcements=true&per_page=20`,
    );
  }

  async getDiscussions(courseId: number) {
    return this.fetch(`/courses/${courseId}/discussion_topics?per_page=50`);
  }

  async getCalendarEvents() {
    const startDate = new Date().toISOString();
    return this.fetch(`/calendar_events?start_date=${startDate}&per_page=50`);
  }

  async getTodoItems() {
    return this.fetch("/users/self/todo");
  }

  async getQuizzes(courseId: number) {
    return this.fetch(`/courses/${courseId}/quizzes?per_page=100`);
  }

  async getSubmissionStatus(courseId: number, assignmentId: number) {
    return this.fetch(
      `/courses/${courseId}/assignments/${assignmentId}/submissions/self`,
    );
  }
}

export default function createServer({ config }: { config: Config }) {
  const server = new Server(
    {
      name: "canvas-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const canvas = new CanvasAPI(config.canvasApiKey, config.canvasBaseUrl);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_courses",
          description:
            "Get all active Canvas courses for the authenticated user",
          inputSchema: {
            type: "object" as const,
            properties: {},
          },
        },
        {
          name: "get_assignments",
          description: "Get assignments for a specific Canvas course",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
            },
            required: ["course_id"],
          },
        },
        {
          name: "get_upcoming_assignments",
          description:
            "Get upcoming assignments across all courses with future due dates",
          inputSchema: {
            type: "object" as const,
            properties: {},
          },
        },
        {
          name: "get_grades",
          description:
            "Get current grades for a Canvas course, including assignment scores and overall grade",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
            },
            required: ["course_id"],
          },
        },
        {
          name: "get_user_profile",
          description:
            "Get the authenticated user's Canvas profile information",
          inputSchema: {
            type: "object" as const,
            properties: {},
          },
        },
        {
          name: "get_modules",
          description: "Get all modules for a specific Canvas course",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
            },
            required: ["course_id"],
          },
        },
        {
          name: "get_announcements",
          description: "Get recent announcements for a Canvas course",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
            },
            required: ["course_id"],
          },
        },
        {
          name: "get_discussions",
          description: "Get discussion topics for a Canvas course",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
            },
            required: ["course_id"],
          },
        },
        {
          name: "get_calendar_events",
          description: "Get calendar events for the authenticated user",
          inputSchema: {
            type: "object" as const,
            properties: {},
          },
        },
        {
          name: "get_todo_items",
          description:
            "Get todo items (assignments that need action) for the authenticated user",
          inputSchema: {
            type: "object" as const,
            properties: {},
          },
        },
        {
          name: "get_quizzes",
          description: "Get all quizzes for a specific Canvas course",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
            },
            required: ["course_id"],
          },
        },
        {
          name: "get_submission_status",
          description: "Check submission status for a specific assignment",
          inputSchema: {
            type: "object" as const,
            properties: {
              course_id: { type: "number", description: "Canvas course ID" },
              assignment_id: {
                type: "number",
                description: "Assignment ID",
              },
            },
            required: ["course_id", "assignment_id"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const parseArgs = <T>(schema: z.ZodType<T>) => schema.parse(rawArgs ?? {});

    try {
      let title = "Canvas";
      let body = "";

      switch (name) {
        case "list_courses": {
          title = "Canvas Courses";
          const courses = await canvas.listCourses();
          if (!Array.isArray(courses) || courses.length === 0) {
            body = "No active courses found.";
          } else {
            body = courses
              .map((course: any) => formatCourse(course))
              .join("\n\n");
          }
          break;
        }
        case "get_assignments": {
          const { course_id } = parseArgs(CourseArgsSchema);
          title = `Assignments for course ${course_id}`;
          const assignments = await canvas.getAssignments(course_id);
          if (!Array.isArray(assignments) || assignments.length === 0) {
            body = "No assignments found.";
          } else {
            body = assignments
              .map((a: any) => formatAssignment(a))
              .join("\n\n");
          }
          break;
        }
        case "get_upcoming_assignments": {
          title = "Upcoming Assignments";
          const assignments = await canvas.getUpcomingAssignments();
          if (!Array.isArray(assignments) || assignments.length === 0) {
            body = "No upcoming assignments found.";
          } else {
            body = assignments
              .map((a: any) => formatAssignment(a))
              .join("\n\n");
          }
          break;
        }
        case "get_grades": {
          const { course_id } = parseArgs(CourseArgsSchema);
          title = `Grades for course ${course_id}`;
          const grades = await canvas.getGrades(course_id);
          if (!Array.isArray(grades) || grades.length === 0) {
            body = "No grade information returned.";
          } else {
            body = formatJson(grades);
          }
          break;
        }
        case "get_user_profile": {
          title = "Canvas Profile";
          const profile = await canvas.getUserProfile();
          body = formatProfile(profile as any);
          break;
        }
        case "get_modules": {
          const { course_id } = parseArgs(CourseArgsSchema);
          title = `Modules for course ${course_id}`;
          const modules = await canvas.getModules(course_id);
          if (!Array.isArray(modules) || modules.length === 0) {
            body = "No modules found.";
          } else {
            body = modules.map((m: any) => formatModule(m)).join("\n\n");
          }
          break;
        }
        case "get_announcements": {
          const { course_id } = parseArgs(CourseArgsSchema);
          title = `Announcements for course ${course_id}`;
          const announcements = await canvas.getAnnouncements(course_id);
          if (!Array.isArray(announcements) || announcements.length === 0) {
            body = "No announcements found.";
          } else {
            body = announcements
              .map((a: any) => formatAnnouncement(a))
              .join("\n\n");
          }
          break;
        }
        case "get_discussions": {
          const { course_id } = parseArgs(CourseArgsSchema);
          title = `Discussions for course ${course_id}`;
          const discussions = await canvas.getDiscussions(course_id);
          if (!Array.isArray(discussions) || discussions.length === 0) {
            body = "No discussions found.";
          } else {
            body = discussions
              .map((d: any) => formatDiscussion(d))
              .join("\n\n");
          }
          break;
        }
        case "get_calendar_events": {
          title = "Upcoming Calendar Events";
          const events = await canvas.getCalendarEvents();
          if (!Array.isArray(events) || events.length === 0) {
            body = "No calendar events found.";
          } else {
            body = events.map((e: any) => formatEvent(e)).join("\n\n");
          }
          break;
        }
        case "get_todo_items": {
          title = "Todo Items";
          const todos = await canvas.getTodoItems();
          if (!Array.isArray(todos) || todos.length === 0) {
            body = "No todo items found.";
          } else {
            body = todos.map((t: any) => formatTodo(t)).join("\n\n");
          }
          break;
        }
        case "get_quizzes": {
          const { course_id } = parseArgs(CourseArgsSchema);
          title = `Quizzes for course ${course_id}`;
          const quizzes = await canvas.getQuizzes(course_id);
          if (!Array.isArray(quizzes) || quizzes.length === 0) {
            body = "No quizzes found.";
          } else {
            body = quizzes.map((q: any) => formatQuiz(q)).join("\n\n");
          }
          break;
        }
        case "get_submission_status": {
          const { course_id, assignment_id } = parseArgs(SubmissionArgsSchema);
          title = `Submission status for assignment ${assignment_id}`;
          const submission = await canvas.getSubmissionStatus(
            course_id,
            assignment_id,
          );
          body = formatSubmissionStatus(submission as any);
          break;
        }
        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: [title, body].filter(Boolean).join("\n\n") || "No data returned.",
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof McpError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("401")) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Canvas returned 401 Unauthorized. Check your API key and base URL.\n\nDetails: ${message}`,
        );
      }
      throw new McpError(ErrorCode.InternalError, message);
    }
  });

  return server;
}
