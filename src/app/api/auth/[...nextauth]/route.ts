// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";  // ← Import from auth.ts

export const { GET, POST } = handlers;