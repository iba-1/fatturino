import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile, useSaveProfile } from "@/hooks/use-profile";

export function Settings() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const saveProfile = useSaveProfile();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {t("settings.title")}
      </h1>
      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <ProfileForm
          profile={profile}
          onSubmit={(data) => saveProfile.mutate(data)}
          isLoading={saveProfile.isPending}
        />
      )}
    </div>
  );
}
