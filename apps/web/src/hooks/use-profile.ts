import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import i18next from "i18next";

export interface UserProfile {
  id: string;
  userId: string;
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  codiceAteco: string;
  regimeFiscale: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  pec: string | null;
  codiceSdi: string | null;
  iban: string | null;
  annoInizioAttivita: number;
  gestioneInps: "separata" | "artigiani" | "commercianti";
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  codiceAteco: string;
  regimeFiscale?: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  pec?: string;
  codiceSdi?: string;
  iban?: string;
  annoInizioAttivita: number;
  gestioneInps?: "separata" | "artigiani" | "commercianti";
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => api.get<UserProfile>("/profile"),
    retry: false,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileFormData) =>
      api.put<UserProfile>("/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: i18next.t("toast.profileSaved"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("save_profile_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}
