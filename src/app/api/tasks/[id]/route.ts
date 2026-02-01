// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Task } from "@/models/Task";
import { auth } from "@/auth";
import { taskSchema } from "@/lib/schemas";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;  // ← Await here!
  const id = params.id;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const task = await Task.findOne({ _id: id, userId: session.user.id });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;  // ← Await here!
  const id = params.id;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Update task body for ID:", id, body);

    const validated = taskSchema.parse(body);

    await dbConnect();
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("Task update error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;  // ← Await here!
  const id = params.id;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const task = await Task.findOneAndDelete({ _id: id, userId: session.user.id });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Task deleted successfully" });
}