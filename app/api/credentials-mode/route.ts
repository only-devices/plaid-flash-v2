import { NextRequest, NextResponse } from 'next/server';
import { getUseAltCredentialsFromRequest, isAltCredentialsAvailable } from '@/lib/server/plaidCredentials';

const COOKIE_NAME = 'plaid_flash_use_alt_credentials';

export async function GET(request: NextRequest) {
  const altAvailable = isAltCredentialsAvailable();
  const useAltCredentials = getUseAltCredentialsFromRequest(request);
  return NextResponse.json({ useAltCredentials, altAvailable });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const desired = !!body?.useAltCredentials;

    const altAvailable = isAltCredentialsAvailable();
    const effective = altAvailable ? desired : false;

    const res = NextResponse.json({ useAltCredentials: effective, altAvailable });
    res.cookies.set(COOKIE_NAME, effective ? '1' : '0', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: 'INVALID_REQUEST', message: e?.message || 'Invalid JSON body' },
      { status: 400 }
    );
  }
}

