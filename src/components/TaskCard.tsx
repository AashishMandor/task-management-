"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TaskForm from "./TaskForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, isPast } from "date-fns";
import { AlertCircle, Edit2, Pencil, Trash2 } from "lucide-react";

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
};

export default function TaskCard({ task, onDelete, onUpdate }: { task: Task; onDelete: () => void; onUpdate: () => void }) {
  const isOverdue = task.dueDate && task.status !== "completed" && isPast(new Date(task.dueDate));

  const priorityColor = {
    high: "bg-red-600 hover:bg-red-700 text-white",
    medium: "bg-amber-500 hover:bg-amber-600 text-white",
    low: "bg-green-600 hover:bg-green-700 text-white",
  }[task.priority];

  const statusColor = {
    pending: "bg-gray-600 text-white",
    "in-progress": "bg-blue-600 text-white",
    completed: "bg-green-700 text-white",
  }[task.status];

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Task deleted successfully");
      onDelete();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  return (
    <Card
      className={`group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-l-4 ${
        isOverdue ? "border-l-red-600 bg-red-50/50 dark:bg-red-950/20" : "border-l-transparent"
      } overflow-hidden`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
            {/* Due Date सबसे पहले */}
            {task.dueDate && (
              <div className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue ? "text-red-700" : "text-muted-foreground"}`}>
                {isOverdue && <AlertCircle className="h-4 w-4" />}
                Due: {format(new Date(task.dueDate), "dd MMM yyyy")}
              </div>
            )}

            <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
              {task.title}
            </CardTitle>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center opacity-90 group-hover:opacity-100 transition-opacity">
            {/* Edit Button with Pencil Icon */}
            <TaskForm task={task} onSuccess={onUpdate}>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit task</span>
              </Button>
            </TaskForm>

            {/* Delete Button with Confirmation Modal */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete task</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>"{task.title}"</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={`${priorityColor} px-3 py-1 text-xs font-medium border-none shadow-sm`}>
            {task.priority.toUpperCase()}
          </Badge>

          <Badge className={`${statusColor} px-3 py-1 text-xs font-medium border-none shadow-sm`}>
            {task.status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </Badge>

          {isOverdue && (
            <Badge variant="outline" className="text-red-600 border-red-400 bg-red-50">
              Overdue
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}