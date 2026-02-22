import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";

const registerSchema = z
  .object({
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(255),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100),
    email: z
      .string()
      .email("Invalid email address")
      .max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80) +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { organizationName, firstName, lastName, email, password } =
      parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = generateSlug(organizationName);

    const [org] = await db
      .insert(organizations)
      .values({
        name: organizationName,
        slug,
      })
      .returning({ id: organizations.id });

    await db.insert(users).values({
      orgId: org.id,
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
      role: "admin",
      status: "active",
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
