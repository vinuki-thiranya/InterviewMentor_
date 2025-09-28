"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";
import{ interviewCovers, mappings} from "@/constants";

// Helper function to extract interview data from conversation messages
function extractInterviewData(messages: Array<{ role: string; content: string }>) {
  let role = "";
  let interviewType = "";
  let level = "";
  let techstack = "";
  let amount = "";

  // Join all user messages to analyze
  const userResponses = messages
    .filter(msg => msg.role === "user")
    .map(msg => msg.content.toLowerCase())
    .join(" ");

  // Also analyze assistant questions to understand context
  const assistantMessages = messages
    .filter(msg => msg.role === "assistant")
    .map(msg => msg.content.toLowerCase())
    .join(" ");

  console.log('🔍 Analyzing user responses:', userResponses);
  console.log('🤖 Assistant messages for context:', assistantMessages);

  // Extract role (common job titles)
  const rolePatterns = [
    { pattern: /data scientist|data science|machine learning engineer/i, value: "Data Scientist" },
    { pattern: /software engineer|software developer|programmer/i, value: "Software Engineer" },
    { pattern: /frontend|front-end|react developer|vue developer/i, value: "Frontend Developer" },
    { pattern: /backend|back-end|server developer|api developer/i, value: "Backend Developer" },
    { pattern: /fullstack|full-stack|full stack developer/i, value: "Fullstack Developer" },
    { pattern: /product manager|pm|product owner/i, value: "Product Manager" },
    { pattern: /designer|ui|ux|user experience|user interface/i, value: "Designer" },
    { pattern: /devops|site reliability|sre|infrastructure/i, value: "DevOps Engineer" },
  ];

  for (const { pattern, value } of rolePatterns) {
    if (pattern.test(userResponses)) {
      role = value;
      console.log('🎯 Detected role:', role);
      break;
    }
  }

  // Extract interview type
  if (/technical|coding|algorithm|programming/i.test(userResponses)) {
    interviewType = "technical";
  } else if (/behavioral|behavior|soft skill|leadership|teamwork/i.test(userResponses)) {
    interviewType = "behavioral";
  } else if (/mixed|both|combination/i.test(userResponses)) {
    interviewType = "mixed";
  } else {
    // Default to technical if not specified
    interviewType = "technical";
  }
  console.log('🎯 Detected interview type:', interviewType);

  // Extract level
  if (/junior|entry|beginner|new grad|1-2 years/i.test(userResponses)) {
    level = "junior";
  } else if (/senior|lead|principal|experienced|5\+ years|senior level/i.test(userResponses)) {
    level = "senior";
  } else if (/mid|middle|intermediate|3-5 years/i.test(userResponses)) {
    level = "mid";
  } else {
    level = "mid"; // Default to mid if not specified
  }
  console.log('🎯 Detected level:', level);

  // Extract tech stack - improved patterns for better detection
  const techPatterns = [
    { pattern: /python|pandas|tensorflow|scikit|numpy|django|flask|data science|machine learning|ml|ai/i, value: "Python,TensorFlow,Pandas,Jupyter,AWS" },
    { pattern: /react|javascript|js|node|next\.?js|typescript|frontend|front-end/i, value: "JavaScript,React,Node.js" },
    { pattern: /java|spring|hibernate/i, value: "Java,Spring" },
    { pattern: /c\+\+|cpp/i, value: "C++" },
    { pattern: /c#|dotnet|\.net/i, value: "C#,.NET" },
    { pattern: /go|golang/i, value: "Go" },
    { pattern: /rust/i, value: "Rust" },
    { pattern: /aws|amazon web services|cloud|s3|ec2/i, value: "AWS" },
    { pattern: /docker|kubernetes|k8s|devops/i, value: "Docker,Kubernetes" },
  ];

  for (const { pattern, value } of techPatterns) {
    if (pattern.test(userResponses)) {
      techstack = value;
      console.log('🎯 Detected techstack:', techstack);
      break;
    }
  }
  
  // If no specific tech stack detected but role is Data Scientist, use default
  if (!techstack && role === "Data Scientist") {
    techstack = "Python,TensorFlow,Pandas,Jupyter,AWS";
    console.log('🎯 Using default Data Scientist techstack:', techstack);
  }

  // Extract number of questions
  const numberMatch = userResponses.match(/(\d+)\s*question/i);
  if (numberMatch) {
    amount = numberMatch[1];
  } else if (/few|3|three/i.test(userResponses)) {
    amount = "3";
  } else if (/many|10|ten/i.test(userResponses)) {
    amount = "10";
  } else if (/five|5/i.test(userResponses)) {
    amount = "5";
  } else if (/seven|8|eight/i.test(userResponses)) {
    amount = "8";
  } else {
    amount = "5"; // Default to 5 questions
  }
  console.log('🎯 Detected amount:', amount);

  return { role, type: interviewType, level, techstack, amount };
}

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      console.log('📨 Received message:', {
        type: message.type,
        ...(message.type === "transcript" ? {
          role: message.role,
          transcript: message.transcript,
          transcriptType: message.transcriptType
        } : {})
      });

      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        console.log('💬 Adding message to state:', newMessage);
        setMessages((prev) => {
          const updated = [...prev, newMessage];
          console.log('📋 Updated messages array:', updated);
          return updated;
        });

        // Check if this is the generate flow and the assistant is ready to create the interview
        if (type === "generate" && message.role === "assistant") {
          console.log('🔍 Checking assistant message:', message.transcript.toLowerCase());
          
          if (message.transcript.toLowerCase().includes("perfect! i have all the information") ||
              message.transcript.toLowerCase().includes("let me generate your interview") ||
              message.transcript.toLowerCase().includes("generate your interview questions")) {
            console.log('🎯 Trigger phrase detected! Starting interview generation...');
            
            // Extract the collected information from the conversation
            setTimeout(async () => {
              try {
                // Get the most up-to-date messages including the current one
                const allMessages = [...messages, newMessage];
                console.log('🔍 All messages for extraction:', allMessages);
                
                // Parse the conversation to extract interview parameters
                const extractedData = extractInterviewData(allMessages);
                console.log('📊 Extracted data:', extractedData);
                
                const interviewData = {
                  role: extractedData.role || "Software Engineer",
                  type: extractedData.type || "technical",
                  level: extractedData.level || "mid",
                  techstack: extractedData.techstack || "JavaScript",
                  amount: extractedData.amount || "5",
                  userid: userId
                };

                console.log('� Sending interview data to API:', interviewData);

                const response = await fetch('/api/vapi/generate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(interviewData),
                });

                console.log('📡 API Response status:', response.status);
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ Interview generated successfully:', result);
                } else {
                  const errorText = await response.text();
                  console.error('❌ Failed to generate interview - Status:', response.status);
                  console.error('❌ Error response:', errorText);
                }
              } catch (error) {
                console.error('💥 Error in interview generation process:', error);
              }
            }, 2000); // Increased delay
          }
        }

        // Check if assistant says goodbye and end the call
        if (type === "generate" && message.role === "assistant" && 
            (message.transcript.toLowerCase().includes("goodbye") ||
             message.transcript.toLowerCase().includes("thank you for using mockmate"))) {
          console.log('👋 Goodbye detected, ending call in 3 seconds...');
          setTimeout(() => {
            console.log('🔚 Ending call after goodbye');
            vapi.stop();
            // Redirect to home page after interview generation
            router.push("/");
          }, 3000);
        }
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: any) => {
      console.error("VAPI Error:", error);
      setCallStatus(CallStatus.INACTIVE);
      
      // Enhanced error debugging
      console.log("🔍 Error details breakdown:");
      console.log("- Type:", error?.type);
      console.log("- Stage:", error?.stage);
      console.log("- Error object:", error?.error);
      console.log("- Context:", error?.context);
      
      // Try to extract response details if available
      if (error?.error instanceof Response) {
        console.log("📄 Response status:", error.error.status);
        console.log("📄 Response statusText:", error.error.statusText);
        console.log("📄 Response URL:", error.error.url);
      }
      
      // Handle specific error types safely
      const errorMessage = error?.message || JSON.stringify(error);
      if (errorMessage && (errorMessage.includes("401") || errorMessage.includes("Unauthorized"))) {
        console.error("❌ Authentication failed. Please check your VAPI API key.");
      } else if (errorMessage && errorMessage.includes("400")) {
        console.error("❌ Bad Request. Possible issues:");
        console.error("   • Invalid assistant configuration");
        console.error("   • Missing required fields");
        console.error("   • Malformed request payload");
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        feedback: JSON.stringify(messages), // Convert transcript to string
        score: 0, // Default score
      });

      if (success) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        // Add a small delay to ensure the API call completes
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    // Debug: Log environment variables to console
    console.log("VAPI_WEB_TOKEN:", process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN);
    console.log("VAPI_WORKFLOW_ID:", process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);

    try {
      if (type === "generate") {
        // Create a simple assistant that will collect interview details
        await vapi.start({
          name: "MockMate Interview Generator",
          firstMessage: `Hello ${userName}! Let's prepare your interview. I will ask you a few questions and generate a perfect interview just for you. Are you ready?`,
          model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: `You are MockMate, an AI interview preparation assistant. You need to collect the following information from the user step by step:

1. What role are they interviewing for?
2. What type of interview do they want? (technical, behavioral, or mixed)  
3. What is their experience level? (junior, mid, senior)
4. What tech stack should be covered? (optional, can be "General" if none specified)
5. How many questions do they want? (3-10)

After collecting ALL this information, say: "Perfect! I have all the information I need. Let me generate your interview questions now."

Wait 3 seconds, then say: "Your interview has been successfully created and saved! Thank you for using MockMate. Goodbye!"

The word "Goodbye" will automatically end the call and the user will be redirected to see their new interview.

Ask questions ONE BY ONE and wait for complete answers before proceeding. Be conversational and helpful. Do not proceed until you have clear answers to all 5 questions.`
              }
            ]
          },
          voice: {
            provider: "playht",
            voiceId: "jennifer"
          },
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US"
          }
        });
      } else {
        // Create interview assistant that asks questions one by one
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question, index) => `${index + 1}. ${question}`)
            .join("\n");
        }

        await vapi.start({
          name: "Interview Assistant", 
          firstMessage: `Hello ${userName}! Welcome to your mock interview. I have ${questions?.length || 0} questions prepared for you. Let's start with the first question. Are you ready?`,
          model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: `You are an AI interviewer conducting a mock interview. 

Here are the questions you must ask ONE BY ONE:
${formattedQuestions}

IMPORTANT INSTRUCTIONS:
1. Ask ONLY ONE question at a time
2. Wait for the candidate's complete answer before moving to the next question
3. Provide brief, encouraging feedback after each answer
4. Keep the conversation professional but friendly
5. After asking all questions, provide a summary and end the interview
6. Do not ask questions outside of the provided list
7. Guide the conversation naturally and help the candidate if they seem stuck

Start by asking if they're ready, then ask the first question.`
              }
            ]
          },
          voice: {
            provider: "playht", 
            voiceId: "jennifer"
          },
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US"
          }
        });
      }
    } catch (error) {
      console.error("Error starting VAPI call:", error);
      
      // Enhanced error logging to see the exact API response
      if (error instanceof Error && error.message.includes('400')) {
        console.error("🔍 Debugging 400 error - checking response details...");
      }
      
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;