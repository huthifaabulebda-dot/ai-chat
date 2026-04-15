import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { findUserById, updateUser } from '@/lib/memoryStore';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for profile GET.', error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    if (useMemoryStore) {
      const user = findUserById(decoded.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, profilePic: user.profilePic },
      });
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let useMemoryStore = false;
  try {
    await dbConnect();
  } catch (error) {
    useMemoryStore = true;
    console.warn('MongoDB unavailable; using memory store for profile PUT.', error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const { name, profilePic } = await request.json() as { name?: string; profilePic?: string };

    const updateData: { name?: string; profilePic?: string } = {};
    if (name) updateData.name = name;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    if (useMemoryStore) {
      const user = updateUser(decoded.id, updateData);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email, profilePic: user.profilePic },
      });
    }

    const user = await User.findByIdAndUpdate(decoded.id, updateData, { new: true }).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}