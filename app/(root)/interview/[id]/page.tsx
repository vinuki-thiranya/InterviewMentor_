import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

const InterviewPage = async ({ params }: PageProps) => {
  const user = await getCurrentUser();
  const { success, interview } = await getInterviewById(params.id);

  if (!success || !interview) {
    redirect("/");
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <h2>Mock Interview: {interview.role}</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Type: {interview.type}</span>
          <span>Level: {interview.level}</span>
          <span>Questions: {interview.questions?.length || 0}</span>
        </div>
      </div>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        interviewId={interview.id}
        type="interview"
        questions={interview.questions}
      />
    </>
  );
};

export default InterviewPage;