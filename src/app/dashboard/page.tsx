"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import TaskCard from "@/components/TaskCard";
import Pagination from "@/components/Pagination"; // ← Import new component
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogOut, User, Search, Filter } from "lucide-react";
import { format, isPast } from "date-fns";

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  dueDate?: string;
  createdAt: string;
};

const ITEMS_PER_PAGE = 8; // 8 tasks per page

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status !== "authenticated") return;

    fetchTasks();
  }, [status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTasks(data);
      setFilteredTasks(data);
      setCurrentPage(1); // Reset to page 1 after fetch
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort
  useEffect(() => {
    let result = [...tasks];

    // Search
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          (t.description?.toLowerCase().includes(lower) ?? false)
      );
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Due date
    if (dueDateFilter) {
      const filterDate = format(dueDateFilter, "yyyy-MM-dd");
      result = result.filter((t) =>
        t.dueDate ? format(new Date(t.dueDate), "yyyy-MM-dd") === filterDate : false
      );
    }

    // Sort: Overdue first → High priority → Due date → Newest
    result.sort((a, b) => {
      const aOverdue = a.dueDate && a.status !== "completed" && isPast(new Date(a.dueDate));
      const bOverdue = b.dueDate && b.status !== "completed" && isPast(new Date(b.dueDate));

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const priOrder = { high: 0, medium: 1, low: 2 };
      const aPri = priOrder[a.priority] ?? 3;
      const bPri = priOrder[b.priority] ?? 3;
      if (aPri !== bPri) return aPri - bPri;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredTasks(result);
  }, [tasks, search, statusFilter, priorityFilter, dueDateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{session?.user?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters & Add Button */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <TaskForm onSuccess={fetchTasks} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                  <Filter className="mr-2 h-4 w-4" />
                  {dueDateFilter ? format(dueDateFilter, "PPP") : "Due Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDateFilter}
                  onSelect={setDueDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {paginatedTasks.length} of {filteredTasks.length} tasks
          </p>
        </div>

        {/* Tasks */}
        {paginatedTasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No tasks found</p>
            <p className="text-sm mt-2">Try changing filters or add a new task</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onDelete={fetchTasks}
                onUpdate={fetchTasks}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </main>
    </div>
  );
}