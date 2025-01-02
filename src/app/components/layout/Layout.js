import React from "react";
import Header from "./Header";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

const CommonLayout = async ({ children }) => {
  const token = (await cookies()).get("token")?.value;
  const user = await verifyAuth(token);
  return (
    <div className="min-h-screen bg-white">
      {user && <Header />}
      {children}
    </div>
  );
};

export default CommonLayout;
