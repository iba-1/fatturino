import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile, useSaveProfile, type ProfileFormData } from "@/hooks/use-profile";
import { parseApiFieldErrors } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { fadeSlideUp } from "@/lib/motion";
import { Skeleton } from "@/components/ui/skeleton";

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
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SettingsSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={fadeSlideUp}
            initial="initial"
            animate="animate"
          >
            <ProfileForm
              profile={profile}
              onSubmit={handleSubmit}
              isLoading={saveProfile.isPending}
              serverErrors={serverErrors}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-28" />
    </div>
  );
}
