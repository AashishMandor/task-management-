import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Task } from "@/models/Task";
import { auth } from "@/auth";                 
import { taskSchema } from "@/lib/schemas";

export async function GET() {
  const session = await auth();                 
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const tasks = await Task.find({ userId: session.user.id }).sort({ dueDate: 1, createdAt: -1 });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();                 // now works here too
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Received task body:", body);     // helpful for debugging

    const validated = taskSchema.parse(body);

    await dbConnect();
    const task = await Task.create({
      ...validated,
      userId: session.user.id,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Task creation error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}