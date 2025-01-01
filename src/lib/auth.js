import { jwtVerify } from "jose";

export async function verifyAuth(token) {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    console.log(error, "Error verifying token");
    return null;
  }
}
