import CreateBlogForm from "@/components/blog/CreateBlogForm";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import React from "react";

const CreateBlog = async () => {
  const token = (await cookies()).get("token")?.value;
  const user = await verifyAuth(token);

  return <CreateBlogForm user={user} />;
};

export default CreateBlog;
