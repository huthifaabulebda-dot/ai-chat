import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '@/lib/memoryStore';

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for register.', error);
  }

  let createdUser: { id: string; name: string; email: string; profilePic: string };
  if (useMemoryStore) {
    const existingMemoryUser = findUserByEmail(email);
    if (existingMemoryUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    const user = createUser({ name, email, password: hashedPassword, profilePic: '' });
    createdUser = { id: user.id, name: user.name, email: user.email, profilePic: user.profilePic };
  } else {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    createdUser = { id: String(user._id), name: user.name, email: user.email, profilePic: user.profilePic };
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Server is missing JWT_SECRET configuration.' }, { status: 500 });
  }

  const token = jwt.sign({ id: createdUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return NextResponse.json({
    token,
    user: {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      profilePic: createdUser.profilePic,
    },
  }, { status: 201 });
}