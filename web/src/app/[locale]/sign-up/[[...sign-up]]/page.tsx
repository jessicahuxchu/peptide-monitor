import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-command-bg px-4 py-12">
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
