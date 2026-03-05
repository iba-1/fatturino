import { useCallback } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        navigate(to);
      } else {
        navigate(to, { viewTransition: true, ...options });
      }
    },
    [navigate]
  );
}
