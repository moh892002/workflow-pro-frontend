import { http, HttpResponse } from "msw";
import { mockAdmin, mockEmployee, mockTasks, mockUsers, mockAttendance, mockActivityLogs } from "./data";
import { TaskPriority, TaskStatus } from "../../types";

let tasksStore = [...mockTasks];

export const handlers = [
  http.post("http://localhost:8000/api/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body?.email === "admin@example.com" && body?.password === "password") {
      return HttpResponse.json({
        success: true,
        data: {
          token: "mock-token-123",
          user: {
            id: mockAdmin.id,
            fullname: mockAdmin.fullName,
            username: mockAdmin.username,
            role: mockAdmin.role,
            department: { name: mockAdmin.department },
            salary: mockAdmin.salary,
            job_title: mockAdmin.jobTitle,
            image_url: mockAdmin.profileImage,
            deleted_at: null,
          },
        },
      });
    }
    return HttpResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }),

  http.post("http://localhost:8000/api/logout", () => {
    return HttpResponse.json({ success: true, message: "Logged out" });
  }),

  http.get("http://localhost:8000/api/user", () => {
    const hasToken = localStorage.getItem("wfp_token");
    if (!hasToken) {
      return HttpResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }
    return HttpResponse.json({
      id: mockAdmin.id,
      fullname: mockAdmin.fullName,
      username: mockAdmin.username,
      role: mockAdmin.role,
      department: { name: mockAdmin.department },
      salary: mockAdmin.salary,
      job_title: mockAdmin.jobTitle,
      image_url: mockAdmin.profileImage,
      deleted_at: null,
    });
  }),

  http.get("http://localhost:8000/api/tasks", () => {
    return HttpResponse.json({
      success: true,
      data: tasksStore.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority === TaskPriority.CRITICAL ? "URGENT" : t.priority,
        status: t.status === TaskStatus.PENDING ? "pending" : t.status === TaskStatus.IN_PROGRESS ? "in_progress" : t.status === TaskStatus.COMPLETED ? "completed" : "pending",
        deadline_date: t.deadline,
        assigned_to: t.assignedToId,
        created_at: t.createdAt,
        user: { id: t.assignedToId, fullname: t.assignedToName },
      })),
    });
  }),

  http.post("http://localhost:8000/api/tasks", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newTask = {
      id: String(Date.now()),
      title: body.title as string,
      description: body.description as string,
      priority: body.priority as string,
      status: body.status as string,
      deadline_date: body.deadline_date as string,
      assigned_to: body.assigned_to as string,
      created_at: new Date().toISOString(),
      user: { id: body.assigned_to as string, fullname: "Assigned User" },
    };
    return HttpResponse.json({ success: true, data: newTask }, { status: 201 });
  }),

  http.put("http://localhost:8000/api/tasks/:id", async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const taskId = params.id as string;
    tasksStore = tasksStore.map((t) =>
      t.id === taskId ? { ...t, status: body.status as TaskStatus, ...body } : t
    );
    const updated = tasksStore.find((t) => t.id === taskId);
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.delete("http://localhost:8000/api/tasks/:id", ({ params }) => {
    const taskId = params.id as string;
    tasksStore = tasksStore.filter((t) => t.id !== taskId);
    return HttpResponse.json({ success: true, message: "Task deleted" });
  }),

  http.get("http://localhost:8000/api/users", () => {
    return HttpResponse.json({
      success: true,
      data: mockUsers.map((u) => ({
        id: u.id,
        fullname: u.fullName,
        username: u.username,
        role: u.role,
        department: u.department,
        salary: u.salary,
        job_title: u.jobTitle,
        image_url: u.profileImage,
        deleted_at: null,
      })),
    });
  }),

  http.get("http://localhost:8000/api/activity-logs", () => {
    return HttpResponse.json({
      success: true,
      data: mockActivityLogs,
    });
  }),

  http.post("http://localhost:8000/api/activity-logs", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ success: true, data: body }, { status: 201 });
  }),

  http.get("http://localhost:8000/api/attendance", ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
    return HttpResponse.json({
      success: true,
      data: mockAttendance.filter((a) => a.date === date),
    });
  }),

  http.get("http://localhost:8000/api/attendance/today", () => {
    return HttpResponse.json({
      success: true,
      data: mockAttendance[0] || null,
    });
  }),

  http.get("http://localhost:8000/api/attendance/history", () => {
    return HttpResponse.json({
      success: true,
      data: mockAttendance,
    });
  }),

  http.post("http://localhost:8000/api/attendance/check-in", () => {
    return HttpResponse.json({
      success: true,
      data: { ...mockAttendance[0], check_in: new Date().toISOString() },
    });
  }),

  http.put("http://localhost:8000/api/attendance/:id/check-out", () => {
    return HttpResponse.json({
      success: true,
      data: { check_out: new Date().toISOString() },
    });
  }),

  http.get("http://localhost:8000/api/departments", () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: "Executive Management" },
        { id: 2, name: "Engineering" },
      ],
    });
  }),

  http.get("http://localhost:8000/api/records", () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, user_id: "1", transaction_type: "salary", amount: 5000, transaction_date: "2026-06-01", notes: "Monthly salary", user: { fullname: "Abdalraheem Fadda", department: { name: "Executive Management" } } },
      ],
    });
  }),

  http.post("http://localhost:8000/api/records", async ({ request }) => {
    return HttpResponse.json({ success: true, data: {} }, { status: 201 });
  }),

  http.delete("http://localhost:8000/api/records/:id", () => {
    return HttpResponse.json({ success: true, message: "Deleted" });
  }),

  http.get("http://localhost:8000/api/recycle-bin", () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          deleted_item_id: 99,
          deleted_model: "App\\Models\\Task",
          deleted_data: { title: "Old Task" },
          deleted_by: "1",
          deleted_at: new Date().toISOString(),
          user: { fullname: "Abdalraheem Fadda" },
        },
      ],
    });
  }),

  http.post("http://localhost:8000/api/recycle-bin/:model/:id/restore", () => {
    return HttpResponse.json({ success: true, message: "Restored" });
  }),

  http.delete("http://localhost:8000/api/recycle-bin/:model/:id/force", () => {
    return HttpResponse.json({ success: true, message: "Deleted permanently" });
  }),

  http.get("http://localhost:8000/api/reports/attendance", () => {
    return HttpResponse.json({
      success: true,
      data: {
        employee: { id: "1", fullname: "Abdalraheem Fadda" },
        stats: { total_days: 20, present_days: 18, absent_days: 2, late_days: 1, total_hours: 144, average_hours: 8 },
        daily_breakdown: [
          { date: "2026-06-01", check_in: "09:00", check_out: "17:00", status: "PRESENT" },
        ],
      },
    });
  }),
];

export { tasksStore };
