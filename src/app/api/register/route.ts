// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ name, email, password: hashedPassword });

    return NextResponse.json({ message: 'User registered' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.errors?.[0]?.message || 'Registration failed' }, { status: 400 });
  }
}