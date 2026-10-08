import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/identity";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/signin");

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">个人资料</h2>
        <p className="text-sm text-muted-foreground mt-1">
          头像和名称会展示给同住室友
        </p>
      </div>

      <ProfileForm
        user={{
          name: identity.name,
          email: identity.email,
          avatarUrl: identity.avatarUrl,
          isOwner: identity.isOwner,
        }}
      />
    </div>
  );
}
