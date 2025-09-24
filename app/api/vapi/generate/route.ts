import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  // Validate required fields
  if (!type || !role || !level || !amount || !userid) {
    return Response.json(
      { error: "Missing required fields: type, role, level, amount, userid" },
      { status: 400 }
    );
  }

  // Handle techstack safely
  const techStackArray = techstack ? techstack.split(",").map((tech: string) => tech.trim()) : [];

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techStackArray.length > 0 ? techStackArray.join(", ") : "General"}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    // Parse questions safely
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (parseError) {
      console.error("Failed to parse questions JSON:", questions);
      return Response.json(
        { error: "Failed to parse generated questions" },
        { status: 500 }
      );
    }

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techStackArray,
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json(
      { 
        error: "Failed to generate interview",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}