import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '@/lib/memoryStore';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for login.', error);
  }

  let authUser: { id: string; name: string; email: string; profilePic: string; password: string } | null = null;
  if (useMemoryStore) {
    const user = findUserByEmail(email);
    if (user) {
      authUser = { id: user.id, name: user.name, email: user.email, profilePic: user.profilePic, password: user.password };
    }
  } else {
    const user = await User.findOne({ email });
    if (user) {
      authUser = { id: String(user._id), name: user.name, email: user.email, profilePic: user.profilePic, password: user.password };
    }
  }

  if (!authUser || !(await bcrypt.compare(password, authUser.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server is missing JWT_SECRET configuration.' }, { status: 500 });
  }

  const token = jwt.sign({ id: authUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return NextResponse.json({
    token,
    user: {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      profilePic: authUser.profilePic
    }
  });
}