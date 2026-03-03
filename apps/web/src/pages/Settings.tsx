import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile, useSaveProfile, type ProfileFormData } from "@/hooks/use-profile";
import { parseApiFieldErrors } from "@/lib/api";

export function Settings() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const saveProfile = useSaveProfile();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  function handleSubmit(data: ProfileFormData) {
    setServerErrors({});
    saveProfile.mutate(data, {
      onError: (error) => {
        setServerErrors(parseApiFieldErrors(error));
      },
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        {t("settings.title")}
      </h1>
      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <ProfileForm
          profile={profile}
          onSubmit={handleSubmit}
          isLoading={saveProfile.isPending}
          serverErrors={serverErrors}
        />
      )}
    </div>
  );
}
