import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";

export const metadata = {
  title: "Order Pipeline | TerraTrack",
};

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 w-full overflow-x-hidden">
      <PipelineBoard />
    </div>
  );
}
