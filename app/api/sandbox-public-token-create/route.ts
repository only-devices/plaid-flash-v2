import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      institution_id, 
      initial_products, 
      options, 
      user_id, 
      user_token, 
      useAltCredentials 
    } = body;

    // Select credentials based on flag
    const clientId = useAltCredentials && process.env.ALT_PLAID_CLIENT_ID 
      ? process.env.ALT_PLAID_CLIENT_ID 
      : process.env.PLAID_CLIENT_ID;
    const secret = useAltCredentials && process.env.ALT_PLAID_SECRET 
      ? process.env.ALT_PLAID_SECRET 
      : process.env.PLAID_SECRET;

    // Build the sandbox config
    const sandboxConfig: any = {
      client_id: clientId,
      secret: secret,
      institution_id: institution_id || 'ins_109511',
      initial_products: initial_products || ['auth'],
    };

    // Add options if provided
    if (options) {
      sandboxConfig.options = options;
    }

    // Add user_id or user_token for CRA products
    if (user_id) {
      sandboxConfig.user_id = user_id;
    }
    if (user_token) {
      sandboxConfig.user_token = user_token;
    }

    // Make direct fetch call to sandbox endpoint
    const response = await fetch(
      `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/sandbox/public_token/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sandboxConfig),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log('Plaid sandbox error response:', JSON.stringify(data, null, 2));
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ public_token: data.public_token });
  } catch (error: any) {
    console.error('Error creating sandbox public token:', error);
    return NextResponse.json(
      { 
        error_code: 'INTERNAL_SERVER_ERROR',
        error_message: error.message || 'Failed to create sandbox public token',
        display_message: 'Unable to create sandbox public token. Please try again.'
      },
      { status: 500 }
    );
  }
}
