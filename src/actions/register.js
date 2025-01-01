"use server";

import { SchemaRegister } from "@/components/auth/schema-auth";
import aj from "@/lib/arject";
import connectToDatabase from "@/lib/db";
import User from "@/model/User";
import { request } from "@arcjet/next";
import bcrypt from "bcryptjs";

export async function registerUserAction(formData) {
  const validDataFields = SchemaRegister.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validDataFields.success) {
    return {
      error: validDataFields.error.errors[0].message,
      status: 400,
    };
  }

  const { name, email, password } = validDataFields.data;

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      email,
    });

    if (decision.isDenied()) {
      if (decision.reason.isEmail()) {
        const emailTypes = decision.reason.emailTypes;
        if (emailTypes.includes("DISPOSABLE")) {
          return {
            error: "Disposable email addresses are not allowed",
            status: 403,
          };
        } else if (emailTypes.includes("INVALID")) {
          return {
            error: "Invalid Email address",
            status: 403,
          };
        } else if (emailTypes.includes("NO_MX_RECORDS")) {
          return {
            error: "Email domain does not have valid MX records",
            status: 403,
          };
        } else {
          return {
            error: "Email address is not accepted! Please try again",
            status: 403,
          };
        }
      } else if (decision.reason.isBot()) {
        return {
          error: "Bot activity detected",
          status: 403,
        };
      } else if (decision.reason.isRateLimit()) {
        return {
          error: "Too many requests! Please try again later",
          status: 403,
        };
      }
    }

    //database connection
    await connectToDatabase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        error: "User already exists",
        status: 400,
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const result = new User({
      name,
      email,
      password: hashPassword,
    });

    await result.save();

    if (result) {
      return {
        success: "user registered successfully",
        status: 201,
      };
    } else {
      return {
        error: "Internal server error",
        status: 500,
      };
    }
  } catch (e) {
    console.error(e, "Registration error");
    return {
      error: "Internal server error",
      status: 500,
    };
  }
}