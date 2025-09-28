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

export async function getUserInterviews(userId: string) {
  try {
    // First get all interviews for the user
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .get();

    // Then sort them in memory by createdAt
    const interviews = interviewsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        // Sort by createdAt in descending order (newest first)
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    return {
      success: true,
      interviews,
    };
  } catch (error: any) {
    console.error("Error fetching user interviews:", error);
    return {
      success: false,
      interviews: [],
      error: error.message,
    };
  }
}

export async function getInterviewById(interviewId: string) {
  try {
    const interviewDoc = await db.collection("interviews").doc(interviewId).get();
    
    if (!interviewDoc.exists) {
      return {
        success: false,
        interview: null,
        error: "Interview not found",
      };
    }

    return {
      success: true,
      interview: {
        id: interviewDoc.id,
        ...interviewDoc.data(),
      },
    };
  } catch (error: any) {
    console.error("Error fetching interview:", error);
    return {
      success: false,
      interview: null,
      error: error.message,
    };
  }
}

export async function getInterviewsByUserId(userId: string) {
  try {
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .where("finalized", "==", true)
      .get();

    const interviews = interviewsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    return interviews;
  } catch (error: any) {
    console.error("Error fetching user interviews:", error);
    return [];
  }
}

export async function getLatestInterviews(params: GetLatestInterviewsParams) {
  const { userId, limit = 10 } = params;
  
  try {
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .limit(limit)
      .get();

    const interviews = interviewsSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((interview: any) => interview.userId !== userId) // Exclude user's own interviews
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);

    return interviews;
  } catch (error: any) {
    console.error("Error fetching latest interviews:", error);
    return [];
  }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams) {
  const { interviewId, userId } = params;
  
  try {
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .get();

    if (feedbackSnapshot.empty) {
      return null;
    }

    const feedbackDoc = feedbackSnapshot.docs[0];
    return {
      id: feedbackDoc.id,
      ...feedbackDoc.data(),
    };
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    return null;
  }
}