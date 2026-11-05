import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import {
  FiDownloadCloud,
  FiEdit2,
  FiFolder,
  FiFolderPlus,
  FiGrid,
  FiMail,
  FiMoreHorizontal,
  FiPlus,
  FiShare2,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { auth } from "../config/firebase";
import {
  ROLES,
  can,
  createCanvas,
  createFolder,
  deleteCanvas,
  deleteFolder,
  renameCanvas,
  renameFolder,
  roleFor,
  validateFolderName,
} from "../lib/ideas/api";
import { useCanvases, useFolders } from "../lib/ideas/hooks";
import { importLegacyIdeas, readLegacyIdeas } from "../lib/ideas/legacy";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import ShareModal from "../components/ideas/ShareModal";
import PageHeader from "../components/layout/PageHeader";
import { AvatarStack } from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { ConfirmDialog, PromptDialog } from "../components/ui/Dialogs";
import Menu, { MenuItem, MenuSeparator } from "../components/ui/Menu";
import { PageLoader } from "../components/ui/Spinner";

const timeAgo = (ts) => {
  const d = ts?.toDate?.();
  if (!d) return "just now";
  const s = (Date.now() - d) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const FolderLink = ({ folder, active, shared }) => (
  <Link
    to={`/ideas/${folder.id}`}
    className={cn(
      "group flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
      active
        ? "bg-white font-medium text-surface-900 shadow-xs ring-1 ring-surface-200 dark:bg-surface-800 dark:text-surface-50 dark:ring-surface-700"
        : "text-surface-600 hover:bg-surface-200/50 dark:text-surface-400 dark:hover:bg-surface-800/60"
    )}
  >
    {shared ? (
      <FiUsers className={cn("h-4 w-4 shrink-0", active ? "text-primary-500" : "opacity-60")} />
    ) : (
      <FiFolder className={cn("h-4 w-4 shrink-0", active ? "text-primary-500" : "opacity-60")} />
    )}
    <span className="min-w-0 flex-1 truncate">{folder.name}</span>
    {!shared && folder.memberEmails?.length > 0 && (
      <FiUsers className="h-3 w-3 shrink-0 text-surface-400" title="Shared" />
    )}
  </Link>
);

const VerifyEmailNote = ({ user }) => {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-2 mt-1 rounded-lg bg-warning-50 p-2.5 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
      Verify {user.email} to see folders shared with you.
      <div className="mt-1.5 flex gap-3 font-medium">
        {!sent ? (
          <button
            type="button"
            onClick={() =>
              sendEmailVerification(user)
                .then(() => setSent(true))
                .catch(() => toast.error("Couldn't send the email. Try again later."))
            }
            className="underline"
          >
            Send link
          </button>
        ) : (
          <span>Link sent</span>
        )}
        <button
          type="button"
          className="underline"
          onClick={async () => {
            await auth.currentUser.reload();
            await auth.currentUser.getIdToken(true);
            window.location.reload();
          }}
        >
          I've verified
        </button>
      </div>
    </div>
  );
};

const CanvasCard = ({ canvas, folderId, canEdit, onRename, onDelete }) => (
  <div className="group relative overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-800 dark:bg-surface-900">
    <Link to={`/ideas/${folderId}/${canvas.id}`} className="block">
      <div className="canvas-dots relative aspect-[16/10] overflow-hidden bg-surface-100 [background-size:16px_16px] dark:bg-surface-950">
        {canvas.cover ? (
          <img src={canvas.cover} alt="" className="absolute inset-0 m-auto max-h-[80%] max-w-[80%] rounded-md object-contain shadow-lg" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FiGrid className="h-6 w-6 text-surface-300 dark:text-surface-700" />
          </div>
        )}
      </div>
      <div className="px-3.5 py-3">
        <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{canvas.name}</p>
        <p className="mt-0.5 text-xs text-surface-500">Edited {timeAgo(canvas.updatedAt)}</p>
      </div>
    </Link>
    {canEdit && (
      <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <Menu
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="Canvas options"
              className="rounded-md bg-white/90 p-1.5 text-surface-600 shadow-sm backdrop-blur hover:text-surface-900 dark:bg-surface-800/90 dark:text-surface-300"
            >
              <FiMoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          <MenuItem icon={FiEdit2} onClick={onRename}>
            Rename
          </MenuItem>
          <MenuItem icon={FiTrash2} danger onClick={onDelete}>
            Delete
          </MenuItem>
        </Menu>
      </div>
    )}
  </div>
);

const FolderView = ({ folder, user, owned, onShare }) => {
  const navigate = useNavigate();
  const { data: canvases, loading, error } = useCanvases(folder.id);
  const [dialog, setDialog] = useState(null); // { type, canvas? }
  const role = roleFor(folder, user);
  const canEdit = can.edit(role);
  const members = Object.keys(folder.members || {});

  return (
    <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50">{folder.name}</h2>
            {role !== "owner" && <Badge variant="primary">{ROLES[role]?.label}</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-surface-500">
            {role === "owner"
              ? members.length
                ? `Shared with ${members.length} ${members.length === 1 ? "person" : "people"}`
                : "Private to you"
              : `Shared by ${folder.ownerName || folder.ownerEmail}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {members.length > 0 && <AvatarStack names={[folder.ownerName || folder.ownerEmail, ...members]} max={5} size="sm" />}
          {role === "owner" && (
            <>
              <Button variant="secondary" leftIcon={FiShare2} onClick={onShare}>
                Share
              </Button>
              <Menu
                trigger={({ toggle }) => (
                  <Button variant="ghost" iconOnly aria-label="Folder options" onClick={toggle}>
                    <FiMoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              >
                <MenuItem icon={FiEdit2} onClick={() => setDialog({ type: "renameFolder" })}>
                  Rename folder
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={FiTrash2} danger onClick={() => setDialog({ type: "deleteFolder" })}>
                  Delete folder
                </MenuItem>
              </Menu>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-error-600">You no longer have access to this folder.</p>
      ) : loading ? (
        <PageLoader label="Loading canvases…" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {canvases.map((c) => (
            <CanvasCard
              key={c.id}
              canvas={c}
              folderId={folder.id}
              canEdit={canEdit}
              onRename={() => setDialog({ type: "renameCanvas", canvas: c })}
              onDelete={() => setDialog({ type: "deleteCanvas", canvas: c })}
            />
          ))}
          {canEdit && (
            <button
              type="button"
              onClick={() => setDialog({ type: "newCanvas" })}
              className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-300 text-sm text-surface-500 transition-colors hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-600 dark:border-surface-700 dark:hover:bg-primary-500/5"
            >
              <FiPlus className="h-5 w-5" />
              New canvas
            </button>
          )}
          {!canEdit && !canvases.length && <p className="text-sm text-surface-500">No canvases in this folder yet.</p>}
        </div>
      )}

      <PromptDialog
        isOpen={dialog?.type === "newCanvas"}
        onClose={() => setDialog(null)}
        title="New canvas"
        label="Name"
        initialValue={`Canvas ${(canvases?.length || 0) + 1}`}
        submitLabel="Create"
        onSubmit={async (name) => navigate(`/ideas/${folder.id}/${await createCanvas(folder.id, name, user)}`)}
      />
      <PromptDialog
        isOpen={dialog?.type === "renameCanvas"}
        onClose={() => setDialog(null)}
        title="Rename canvas"
        label="Name"
        initialValue={dialog?.canvas?.name || ""}
        onSubmit={(name) => renameCanvas(folder.id, dialog.canvas.id, name)}
      />
      <ConfirmDialog
        isOpen={dialog?.type === "deleteCanvas"}
        onClose={() => setDialog(null)}
        title={`Delete “${dialog?.canvas?.name}”?`}
        description="Everything on this canvas will be permanently deleted for everyone in the folder."
        confirmLabel="Delete canvas"
        onConfirm={() => deleteCanvas(folder.id, dialog.canvas.id)}
      />
      <PromptDialog
        isOpen={dialog?.type === "renameFolder"}
        onClose={() => setDialog(null)}
        title="Rename folder"
        label="Name"
        initialValue={folder.name}
        validate={(v) => validateFolderName(v, owned, folder.id)}
        onSubmit={(name) => renameFolder(folder, name)}
      />
      <ConfirmDialog
        isOpen={dialog?.type === "deleteFolder"}
        onClose={() => setDialog(null)}
        title={`Delete “${folder.name}”?`}
        description={`This permanently deletes ${canvases?.length || 0} canvas${canvases?.length === 1 ? "" : "es"} and everything on them${
          members.length ? `, and removes access for ${members.length} ${members.length === 1 ? "person" : "people"}` : ""
        }. This can't be undone.`}
        confirmLabel="Delete folder"
        onConfirm={async () => {
          await deleteFolder(folder);
          navigate("/ideas", { replace: true });
        }}
      />
    </section>
  );
};

const IdeasPage = ({ user }) => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { owned, shared, loading, error } = useFolders(user);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [legacy, setLegacy] = useState(() => readLegacyIdeas(user.uid));
  const [importing, setImporting] = useState(null);

  const all = [...owned, ...shared];
  const folder = all.find((f) => f.id === folderId);

  useEffect(() => {
    if (!loading && folderId && !folder && !error) toast.error("That folder doesn't exist or isn't shared with you.");
  }, [loading, folderId, folder, error]);

  if (loading) return <PageLoader label="Loading ideas…" />;
  if (!folderId && all.length) return <Navigate to={`/ideas/${all[0].id}`} replace />;
  if (folderId && !folder) return <Navigate to="/ideas" replace />;

  const runImport = async () => {
    setImporting(0);
    try {
      const { imported, failed } = await importLegacyIdeas(user, legacy.folders, owned, setImporting);
      toast.success(`Imported ${imported} idea${imported === 1 ? "" : "s"}${failed ? ` (${failed} couldn't be imported)` : ""}`);
      setLegacy(null);
    } catch (err) {
      console.error(err);
      toast.error("Import stopped partway. Your local ideas are still saved — try again.");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Ideas"
        description="Infinite canvases for moodboards, references and research. Paste anything."
        actions={
          <Button leftIcon={FiFolderPlus} onClick={() => setNewFolderOpen(true)}>
            New folder
          </Button>
        }
      >
        {legacy && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-100">
            <FiDownloadCloud className="h-4 w-4 shrink-0" />
            <p className="flex-1">
              You have {legacy.count} idea{legacy.count === 1 ? "" : "s"} saved only in this browser. Import them into cloud canvases so
              they sync and can be shared.
            </p>
            <Button size="sm" onClick={runImport} isLoading={importing !== null}>
              {importing !== null ? `Importing ${Math.round(importing * 100)}%` : "Import"}
            </Button>
          </div>
        )}
      </PageHeader>

      {error && (
        <p className="px-4 pt-4 text-sm text-error-600 sm:px-6 lg:px-8">
          Couldn't load your folders. If you just deployed, make sure the Firestore rules in <code>firestore.rules</code> are published.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-surface-200 px-4 py-3 lg:w-64 lg:border-r lg:border-b-0 lg:px-3 lg:py-5 dark:border-surface-800">
          <div className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            <p className="hidden px-2 pb-1 text-[11px] font-medium tracking-wide text-surface-400 uppercase lg:block">My folders</p>
            {owned.map((f) => (
              <FolderLink key={f.id} folder={f} active={f.id === folderId} />
            ))}
            {!owned.length && <p className="hidden px-2 text-xs text-surface-400 lg:block">No folders yet</p>}
            <p className="hidden px-2 pt-5 pb-1 text-[11px] font-medium tracking-wide text-surface-400 uppercase lg:block">Shared with me</p>
            {shared.map((f) => (
              <FolderLink key={f.id} folder={f} active={f.id === folderId} shared />
            ))}
            {user.emailVerified ? (
              !shared.length && <p className="hidden px-2 text-xs text-surface-400 lg:block">Nothing shared with you yet</p>
            ) : (
              <div className="hidden lg:block">
                <VerifyEmailNote user={user} />
              </div>
            )}
          </div>
        </aside>

        {folder ? (
          <FolderView key={folder.id} folder={folder} user={user} owned={owned} onShare={() => setShareOpen(true)} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <FiGrid className="h-6 w-6" />
              </div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-100">Create your first folder</h2>
              <p className="mt-1.5 mb-5 text-sm text-surface-500">
                Each folder holds as many infinite canvases as you like, and can be shared with teammates as visitors, commenters
                or editors.
              </p>
              <Button leftIcon={FiFolderPlus} onClick={() => setNewFolderOpen(true)}>
                New folder
              </Button>
              {!user.emailVerified && (
                <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-surface-500">
                  <FiMail className="h-3.5 w-3.5" /> Verify your email to see folders others share with you.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <PromptDialog
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        title="New folder"
        description="Folder names must be unique."
        label="Name"
        placeholder="e.g. Brand moodboard"
        submitLabel="Create folder"
        validate={(v) => validateFolderName(v, owned)}
        onSubmit={async (name) => {
          const { folderId: id, canvasId } = await createFolder(user, name);
          navigate(`/ideas/${id}/${canvasId}`);
        }}
      />
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} folder={folder} user={user} />
    </div>
  );
};

export default IdeasPage;
