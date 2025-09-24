"use server";

import { db } from "@/firebase/admin";

export async function createFeedback(params: {
  interviewId: string;
  userId: string;
  feedback: string;
  score?: number;
}) {
  const { interviewId, userId, feedback, score } = params;

  try {
    const feedbackData = {
      interviewId,
      userId,
      feedback,
      score: score || 0,
      createdAt: new Date().toISOString(),
    };

    await db.collection("feedback").add(feedbackData);

    return {
      success: true,
      message: "Feedback created successfully",
    };
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    return {
      success: false,
      message: "Failed to create feedback",
      error: error.message,
    };
  }
}