import { NextResponse } from "next/server";

// For deployment, we're providing a simplified route handler
// that will respond with a message explaining that authentication
// requires a proper database connection

export async function POST(request: Request) {
  return NextResponse.json(
    {
      message: "Auth API in demo mode. This deployment is for UI demonstration purposes only.",
      info: "For full functionality, a Turso database connection is required."
    },
    { status: 200 }
  );
}

export async function GET(request: Request) {
  return NextResponse.json(
    {
      message: "Auth API in demo mode. This deployment is for UI demonstration purposes only.",
      info: "For full functionality, a Turso database connection is required."
    },
    { status: 200 }
  );
}
