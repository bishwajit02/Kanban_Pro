import React, { useState } from "react";
import { FiCheck, FiLink, FiMail, FiX } from "react-icons/fi";
import { ROLES, setFolderMembers } from "../../lib/ideas/api";
import { toast } from "../../lib/toast";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RoleSelect = ({ value, onChange, disabled, className = "" }) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    aria-label="Role"
    className={`field h-9 w-auto py-1 pr-7 text-xs ${className}`}
  >
    {Object.entries(ROLES).map(([key, r]) => (
      <option key={key} value={key}>
        {r.label}
      </option>
    ))}
  </select>
);

const ShareModal = ({ isOpen, onClose, folder, user }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!folder) return null;
  const members = folder.members || {};
  const link = `${window.location.origin}/ideas/${folder.id}`;

  const save = async (next, message) => {
    setBusy(true);
    try {
      await setFolderMembers(folder.id, next);
      if (message) toast.success(message);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update sharing. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    const addresses = email
      .split(/[\s,;]+/)
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);
    const bad = addresses.find((a) => !EMAIL_RE.test(a));
    if (!addresses.length) return setError("Enter an email address.");
    if (bad) return setError(`“${bad}” isn't a valid email.`);
    if (addresses.includes(folder.ownerEmail) || addresses.includes(user.email?.toLowerCase())) {
      return setError("You already own this folder.");
    }
    if (Object.keys(members).length + addresses.length > 50) return setError("A folder can be shared with up to 50 people.");
    setError(null);
    await save(
      { ...members, ...Object.fromEntries(addresses.map((a) => [a, role])) },
      addresses.length === 1 ? `Invited ${addresses[0]}` : `Invited ${addresses.length} people`
    );
    setEmail("");
  };

  const mailto = (address) => {
    const subject = encodeURIComponent(`${user.displayName || user.email} shared “${folder.name}” with you`);
    const body = encodeURIComponent(
      `I've shared the “${folder.name}” folder on KanbanPro with you as ${ROLES[members[address]]?.label || "a collaborator"}.\n\nOpen it here (sign in with ${address}):\n${link}`
    );
    return `mailto:${address}?subject=${subject}&body=${body}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share “${folder.name}”`}
      description="People get access to every canvas in this folder."
      size="md"
      footer={
        <>
          <Button variant="secondary" leftIcon={copied ? FiCheck : FiLink} onClick={copyLink} className="mr-auto">
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          type="text"
          inputMode="email"
          autoFocus
          aria-label="Email addresses"
          placeholder="name@gmail.com, another@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          error={error}
          containerClassName="flex-1"
        />
        <div className="flex gap-2">
          <RoleSelect value={role} onChange={setRole} />
          <Button type="submit" isLoading={busy}>
            Invite
          </Button>
        </div>
      </form>
      <p className="mt-2 text-xs text-surface-500">
        Invitees sign in with that Google account (or a verified email) and the folder appears under “Shared with me”.
        No email is sent automatically — use the mail icon or copy the link.
      </p>

      <ul className="mt-5 divide-y divide-surface-100 dark:divide-surface-800">
        <li className="flex items-center gap-3 py-2.5">
          <Avatar name={folder.ownerName || folder.ownerEmail} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
              {folder.ownerName || folder.ownerEmail}
              {folder.ownerId === user.uid && <span className="font-normal text-surface-400"> (you)</span>}
            </p>
            <p className="truncate text-xs text-surface-500">{folder.ownerEmail}</p>
          </div>
          <span className="pr-2 text-xs text-surface-500">Owner</span>
        </li>
        {Object.entries(members)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([address, r]) => (
            <li key={address} className="flex items-center gap-3 py-2.5">
              <Avatar name={address} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-surface-900 dark:text-surface-100">{address}</p>
                <p className="truncate text-xs text-surface-500">{ROLES[r]?.description}</p>
              </div>
              <a
                href={mailto(address)}
                aria-label={`Email ${address} the invite`}
                title="Email the invite link"
                className="rounded-md p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
              >
                <FiMail className="h-4 w-4" />
              </a>
              <RoleSelect
                value={r}
                disabled={busy}
                onChange={(next) => save({ ...members, [address]: next })}
              />
              <button
                type="button"
                disabled={busy}
                aria-label={`Remove ${address}`}
                onClick={() => {
                  const next = { ...members };
                  delete next[address];
                  save(next, `Removed ${address}`);
                }}
                className="rounded-md p-1.5 text-surface-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
              >
                <FiX className="h-4 w-4" />
              </button>
            </li>
          ))}
      </ul>
      {!Object.keys(members).length && (
        <p className="py-3 text-center text-sm text-surface-500">Only you can see this folder right now.</p>
      )}
    </Modal>
  );
};

export default ShareModal;
