"use server";

import { commentRules } from "@/lib/arject";
import { verifyAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import BlogPost from "@/model/BlogPost";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  postId: z.string().min(1, "Post ID is required"),
});

export async function addCommentAction(data) {
    const token = (await cookies()).get("token")?.value;
    const user = await verifyAuth(token);
  
    if (!user) {
      return {
        error: "Unauth user",
        status: 401,
      };
    }
    const validateFields = commentSchema.safeParse(data);
  
    if (!validateFields.success) {
      return {
        error: validateFields.error.errors[0].message,
      };
    }
  
    const { postId, content } = validateFields.data;
  
    try {
      const req = await request();
      const decision = await commentRules.protect(req, { requested: 1 });
  
      if (decision.isDenied()) {
        console.log(decision, "decision", decision.isDenied());
  
        if (decision.reason.isRateLimit()) {
          return {
            error: "Rate limit excedeed! Please try after some time",
            status: 429,
          };
        }
  
        if (decision.reason.isBot()) {
          return {
            error: "Bot activity detected",
          };
        }
        return {
          error: "Request denied",
          status: 403,
        };
      }
  
      await connectToDatabase();
      const post = await BlogPost.findById(postId);
      if (!post) {
        return {
          error: "Blog post not found",
        };
      }
  
      if (!post.comments) {
        post.comments = [];
      }
  
      post.comments.push({
        content,
        author: user.userId,
        authorName: user.userName,
      });
      await post.save();
      revalidatePath(`/blog/${postId}`);
  
      return {
        success: true,
        message: "Comment added successfully",
      };
    } catch (e) {
      return {
        error: "Some error occured!",
      };
    }
  }
  
