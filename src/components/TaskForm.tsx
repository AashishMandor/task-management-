"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema } from "@/lib/schemas";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isFuture, isPast, isValid } from "date-fns"; // isFuture और isValid add
import { CalendarIcon } from "lucide-react";
import { ReactNode } from "react";

// Updated schema with required title and dueDate
const enhancedTaskSchema = taskSchema.extend({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title too long"),
  dueDate: z.string()
    .min(1, "Due date is required") // Required now
    .refine((val) => isValid(new Date(val)), { message: "Invalid date format" })
    .refine((val) => isFuture(new Date(val)), { message: "Due date must be in the future" }),
});

type TaskFormProps = {
  task?: any;
  onSuccess?: () => void;
  children?: ReactNode;
};

export default function TaskForm({ task, onSuccess, children }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );

  const form = useForm<z.infer<typeof enhancedTaskSchema>>({
    resolver: zodResolver(enhancedTaskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
        }
      : { title: "", description: "", priority: "medium", status: "pending", dueDate: "" },
  });

  const isFormValid = form.formState.isValid && !!date; // Extra check for date

  const onSubmit = async (data: z.infer<typeof enhancedTaskSchema>) => {
    console.log("Submitting task data:", data);

    const method = task ? "PUT" : "POST";
    const url = task ? `/api/tasks/${task._id}` : "/api/tasks";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dueDate: date ? format(date, "yyyy-MM-dd") : undefined,
        }),
      });

      const responseData = await res.json();
      console.log("API response:", responseData);

      if (!res.ok) {
        throw new Error(
          responseData.error ||
            responseData.details?.[0]?.message ||
            "Failed to save task"
        );
      }

      toast.success(task ? "Task updated successfully!" : "Task created successfully!");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error("Failed to save task", {
        description: err.message || "Please check the form and try again",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="default">{task ? "Edit Task" : "Add New Task"}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Title - Required */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title (required)"
              {...form.register("title")}
              className={form.formState.errors.title ? "border-red-500" : ""}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500 font-medium">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description - Optional */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add details about the task (optional)"
              rows={4}
              {...form.register("description")}
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-base font-medium">Priority</Label>
              <Select
                defaultValue={form.getValues("priority")}
                onValueChange={(val) => form.setValue("priority", val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Status</Label>
              <Select
                defaultValue={form.getValues("status")}
                onValueChange={(val) => form.setValue("status", val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date - Required */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              Due Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    form.formState.errors.dueDate ? "border-red-500" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a due date (required)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    // Manually set form value for validation
                    form.setValue("dueDate", selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                  }}
                  initialFocus
                  disabled={(date) => isPast(date)} // No past dates
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.dueDate && (
              <p className="text-sm text-red-500 font-medium">
                {form.formState.errors.dueDate.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full mt-4"
            disabled={!isFormValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : task
              ? "Update Task"
              : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}