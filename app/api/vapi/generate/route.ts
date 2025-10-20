import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log('📥 Received interview generation request:', JSON.stringify(requestBody, null, 2));
    
    const { type, role, level, techstack, tech_stack, amount, userid } = requestBody;
    
    // Handle both techstack and tech_stack parameter names
    const finalTechstack = techstack || tech_stack;
    
    // Log each parameter individually to see what we received
    console.log('🔍 Parameter analysis:');
    console.log('  - role:', role, typeof role);
    console.log('  - type:', type, typeof type);
    console.log('  - level:', level, typeof level);
    console.log('  - techstack:', techstack, typeof techstack);
    console.log('  - tech_stack:', tech_stack, typeof tech_stack);
    console.log('  - finalTechstack:', finalTechstack, typeof finalTechstack);
    console.log('  - amount:', amount, typeof amount);
    console.log('  - userid:', userid, typeof userid);

    // Validate required fields
    if (!userid) {
      console.error('❌ Missing userid');
      return Response.json(
        { error: "Missing required field: userid" },
        { status: 400 }
      );
    }

    // Use defaults for missing fields
    const finalRole = role || "Software Engineer";
    const finalType = type || "technical";
    const finalLevel = level || "mid";
    const finalAmount = amount || "5";

    console.log('🔧 Using interview parameters:', {
      role: finalRole,
      type: finalType,
      level: finalLevel,
      amount: finalAmount,
      userid
    });

    // Handle techstack safely
    const techStackArray = finalTechstack ? finalTechstack.split(",").map((tech: string) => tech.trim()) : ["General"];

    console.log('🤖 Generating questions with AI...');
    console.log('📋 AI Prompt parameters:', {
      finalRole,
      finalLevel, 
      techStackArray: techStackArray.join(", "),
      finalType,
      finalAmount
    });
    
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${finalRole}.
        The job experience level is ${finalLevel}.
        The tech stack used in the job is: ${techStackArray.join(", ")}.
        The focus between behavioural and technical questions should lean towards: ${finalType}.
        The amount of questions required is: ${finalAmount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    console.log('📝 Generated questions:', questions);

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
      role: finalRole,
      type: finalType,
      level: finalLevel,
      techstack: techStackArray,
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    console.log('💾 Saving interview to Firebase:', interview);
    const docRef = await db.collection("interviews").add(interview);
    console.log('✅ Interview saved successfully with ID:', docRef.id);

    return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Error in interview generation:", error);
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