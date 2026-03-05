import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/lib/auth";
import { FullPageLoader } from "@/components/FullPageLoader";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <FullPageLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
