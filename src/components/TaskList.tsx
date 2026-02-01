"use client";

import { useEffect, useState } from 'react';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // TODO: fetch tasks from /api/tasks
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <ul>
      {tasks.map((task: any) => (
        <li key={task._id}>{task.title} - {task.status}</li>
      ))}
    </ul>
  );
}
