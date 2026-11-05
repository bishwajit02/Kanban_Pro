import React, { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { FiCamera, FiCheckCircle, FiGithub, FiLogOut, FiMail, FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { auth, db } from "../config/firebase";
import { useTheme } from "../lib/theme";
import { toast } from "../lib/toast";
import { cn, readImageFile, safeUrl } from "../lib/utils";
import PageHeader from "../components/layout/PageHeader";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { PageLoader } from "../components/ui/Spinner";

const profileFromUser = (user) => ({
  displayName: user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "",
  avatar: user.photoURL || "",
  dob: "",
  github: "",
});

const shortcuts = [
  { keys: ["N"], label: "Create a new task", scope: "Board" },
  { keys: ["/"], label: "Focus task search", scope: "Board" },
  { keys: ["Esc"], label: "Close dialogs, clear search", scope: "Anywhere" },
  { keys: ["Enter"], label: "Open the focused task", scope: "Board" },
];

const themeOptions = [
  { value: "light", label: "Light", icon: FiSun },
  { value: "dark", label: "Dark", icon: FiMoon },
  { value: "system", label: "System", icon: FiMonitor },
];

/** Labelled settings row: description on the left, control on the right. */
const Section = ({ title, description, children }) => (
  <section className="grid gap-6 py-8 md:grid-cols-[16rem_1fr]">
    <div>
      <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{title}</h2>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

const ProfilePage = ({ user }) => {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);
  const ref = doc(db, "profiles", user.uid);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fallback = profileFromUser(user);
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const data = snap.exists() ? { ...fallback, ...snap.data() } : fallback;
        if (!snap.exists()) await setDoc(doc(db, "profiles", user.uid), data);
        if (!cancelled) {
          setSaved(data);
          setForm(data);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        toast.error("Couldn't load your profile. Showing account defaults.");
        if (!cancelled) {
          setSaved(fallback);
          setForm(fallback);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!form) return <PageLoader label="Loading settings…" />;

  const dirty = ["displayName", "avatar", "dob", "github"].some((k) => (form[k] || "") !== (saved[k] || ""));
  const githubUrl = form.github.trim() ? safeUrl(form.github) : "";
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isPasswordUser = user.providerData.some((p) => p.providerId === "password");

  const handleSave = async (e) => {
    e.preventDefault();
    if (githubUrl === null) return;
    setSaving(true);
    const next = { ...form, displayName: form.displayName.trim(), github: githubUrl };
    try {
      await setDoc(ref, next, { merge: true });
      setSaved(next);
      setForm(next);
      toast.success("Profile saved");
    } catch (err) {
      console.error("Failed to save profile", err);
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const avatar = await readImageFile(file, 256, 0.85);
      setForm((f) => ({ ...f, avatar }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePasswordReset = async () => {
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Reset link sent to ${user.email}`);
    } catch {
      toast.error("Couldn't send the reset email. Please try again later.");
    } finally {
      setSendingReset(false);
    }
  };

  const fmt = (value) =>
    value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="flex-1">
      <PageHeader title="Settings" description="Manage your profile, appearance and account." />

      <div className="mx-auto max-w-5xl divide-y divide-surface-200 px-4 sm:px-6 lg:px-8 dark:divide-surface-800">
        <Section title="Profile" description="How you appear across your workspace.">
          <Card as="form" onSubmit={handleSave}>
            <Card.Body className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar name={user.displayName || user.email} src={form.avatar} size="xl" />
                  <button
                    type="button"
                    aria-label="Change photo"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-surface-900 text-white transition-colors hover:bg-primary-600 dark:border-surface-900 dark:bg-surface-700"
                  >
                    <FiCamera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-surface-900 dark:text-surface-100">
                    {user.displayName || form.displayName || "Unnamed user"}
                  </p>
                  <p className="truncate text-sm text-surface-500">{user.email}</p>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, avatar: "" }))}
                      className="mt-1 text-xs text-surface-500 hover:text-error-600"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Display name" value={form.displayName} onChange={set("displayName")} maxLength={40} />
                <Input label="Full name" value={user.displayName || ""} disabled hint="Managed by your sign-in provider." />
                <Input label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
                <Input
                  label="GitHub"
                  placeholder="github.com/username"
                  leftIcon={FiGithub}
                  value={form.github}
                  onChange={set("github")}
                  error={githubUrl === null ? "Enter a valid http(s) link." : undefined}
                />
              </div>
            </Card.Body>
            <Card.Footer>
              {dirty && <span className="mr-auto text-xs text-surface-500">You have unsaved changes</span>}
              <Button variant="ghost" disabled={!dirty || saving} onClick={() => setForm(saved)}>
                Discard
              </Button>
              <Button type="submit" disabled={!dirty || githubUrl === null} isLoading={saving}>
                Save changes
              </Button>
            </Card.Footer>
          </Card>
        </Section>

        <Section title="Appearance" description="Choose how KanbanPro looks on this device.">
          <div className="grid max-w-md grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={theme === opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-sm transition-all dark:bg-surface-900",
                  theme === opt.value
                    ? "border-primary-500 font-medium text-surface-900 ring-4 ring-primary-500/15 dark:text-surface-50"
                    : "border-surface-200 text-surface-600 hover:border-surface-300 dark:border-surface-800 dark:text-surface-400 dark:hover:border-surface-700"
                )}
              >
                <opt.icon className="h-5 w-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Keyboard shortcuts" description="Move faster without reaching for the mouse.">
          <Card className="divide-y divide-surface-100 dark:divide-surface-800">
            {shortcuts.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <span className="text-surface-800 dark:text-surface-200">{s.label}</span>
                  <span className="ml-2 text-xs text-surface-400">{s.scope}</span>
                </div>
                <div className="flex gap-1">
                  {s.keys.map((k) => (
                    <kbd key={k} className="kbd">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Account" description="Sign-in details and security.">
          <Card className="divide-y divide-surface-100 dark:divide-surface-800">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <FiMail className="h-4 w-4 text-surface-400" />
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{user.email}</p>
                  <p className="text-xs text-surface-500">
                    Member since {new Date(user.metadata.creationTime).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    {" · "}Last sign-in {fmt(user.metadata.lastSignInTime)}
                  </p>
                </div>
              </div>
              {user.emailVerified ? (
                <Badge variant="success" icon={FiCheckCircle}>
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
            {isPasswordUser && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Password</p>
                  <p className="text-xs text-surface-500">We'll email you a secure link to set a new password.</p>
                </div>
                <Button variant="secondary" size="sm" isLoading={sendingReset} onClick={handlePasswordReset}>
                  Send reset link
                </Button>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Sign out</p>
                <p className="text-xs text-surface-500">End your session on this device.</p>
              </div>
              <Button variant="danger-ghost" size="sm" leftIcon={FiLogOut} onClick={() => signOut(auth)}>
                Sign out
              </Button>
            </div>
          </Card>
        </Section>
      </div>
    </div>
  );
};

export default ProfilePage;
