import * as z from "zod";

export const SchemaRegister = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
});

export const SchemaLogin = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
});

export const SchemaCreate = z.object({
  title: z.string().min(1, {message: "Title is required"}),
  content: z.string().min(1, {message: "content is required"}),
  category: z.string().min(1, {message: "Category is required"}),
  coverImage: z.string().min(1, {message: "Image is required"}),
})