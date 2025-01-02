import { SchemaCreate } from "@/components/auth/schema-auth";
import { blogPostRules } from "@/lib/arject";
import { verifyAuth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import BlogPost from "@/model/BlogPost";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

export async function createBlogPostAction(data) {
    const token = (await cookies()).get("token")?.value;
    const user = await verifyAuth(token);
  
    if (!user) {
      return {
        error: "Unauth user",
        status: 401,
      };
    }

  const validateFields = SchemaCreate.safeParse(data);

  if (!validateFields.success) {
    return {
      error: validateFields.error.errors[0].message,
    };
  }

  const { title, coverImage, content, category } = validateFields.data;

  try {
    const req = await request();
    const headersList = await headers();
    const isSuspicious = headersList.get("x-arcjet-suspicious") === "true";

    const decision = await blogPostRules.protect(req, {
      shield: {
        params: {
          title,
          content,
          isSuspicious,
        },
      },
      requested: 10,
    });

    console.log(decision);

    if (decision.isErrored()) {
      return {
        error: "An error occured!",
      };
    }

    if (decision.isDenied()) {
      if (decision.reason.isShield()) {
        return {
          error:
            "Input validation failed! Potentially malicious content detected",
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
    const post = new BlogPost({
      title,
      content,
      author: user.userId,
      coverImage,
      category,
      comments: [],
      upvotes: [],
    });

    await post.save();
    revalidatePath("/");
    return {
      success: true,
      post,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
}
