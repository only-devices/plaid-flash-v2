import { NextResponse } from 'next/server';

export async function GET() {
  const altClientId = process.env.ALT_PLAID_CLIENT_ID;
  const altSecret = process.env.ALT_PLAID_SECRET;
  
  const available = !!(altClientId && altSecret);
  
  return NextResponse.json({ available });
}
