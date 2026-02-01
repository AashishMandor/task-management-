// src/app/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
          Welcome to Task Manager Pro
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
          A secure, scalable, and beautiful task management app built with Next.js 16, MongoDB, and Tailwind CSS.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
      <footer className="mt-20 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Task Manager • Built with ❤️ in Indore
      </footer>
    </div>
  );
}