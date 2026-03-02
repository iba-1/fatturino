import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signUp } from "@/lib/auth";

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signUp.email({ name, email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message || t("common.error"));
      return;
    }

    navigate("/");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
      <h1 className="mb-6 text-2xl font-bold">{t("auth.register")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            {t("auth.name")}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            {t("auth.password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("auth.register")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link to="/login" className="text-primary hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </div>
  );
}
