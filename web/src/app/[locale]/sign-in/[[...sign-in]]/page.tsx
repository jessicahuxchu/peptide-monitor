import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-command-bg px-4 py-12">
      <SignIn appearance={clerkAppearance} />
    </div>
  );
}
