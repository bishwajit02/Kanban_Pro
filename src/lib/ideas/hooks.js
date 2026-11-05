import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";

const withId = (d) => ({ id: d.id, ...d.data() });

/**
 * Subscribe to a Firestore query/doc. `makeSource` must be stable for the same
 * `key`; pass key=null to skip subscribing.
 */
const useSnapshot = (key, makeSource, map, options = {}) => {
  const [state, setState] = useState({ key: null, data: undefined, error: null });

  useEffect(() => {
    if (!key) return undefined;
    return onSnapshot(
      makeSource(),
      options,
      (snap) => setState({ key, data: map(snap), error: null }),
      (error) => {
        console.error("Firestore subscription failed", key, error);
        setState({ key, data: undefined, error });
      }
    );
    // makeSource/map are derived from key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : null,
    loading: !!key && (!current || (state.data === undefined && !state.error)),
  };
};

const docsOf = (snap) => snap.docs.map(withId);

/**
 * Skip folders whose creation the server hasn't confirmed yet: rules on their
 * subcollections look the folder up server-side, so subscribing early is
 * rejected (and trips a Firestore SDK assertion). A pending createdAt
 * (serverTimestamp) identifies an unconfirmed create; renames keep theirs.
 */
const confirmedFolders = (snap) =>
  snap.docs.filter((d) => !(d.metadata.hasPendingWrites && !d.get("createdAt"))).map(withId);
const WITH_METADATA = { includeMetadataChanges: true };

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export const useFolders = (user) => {
  const email = user.email?.toLowerCase();
  const owned = useSnapshot(
    `owned:${user.uid}`,
    () => query(collection(db, "ideaFolders"), where("ownerId", "==", user.uid)),
    confirmedFolders,
    WITH_METADATA
  );
  // Rules only grant shared access to verified emails, so don't ask otherwise.
  const shared = useSnapshot(
    user.emailVerified && email ? `shared:${email}` : null,
    () => query(collection(db, "ideaFolders"), where("memberEmails", "array-contains", email)),
    docsOf
  );
  return {
    owned: [...(owned.data || [])].sort(byName),
    shared: [...(shared.data || [])].sort(byName),
    loading: owned.loading || shared.loading,
    error: owned.error || shared.error,
  };
};

export const useFolder = (folderId) =>
  useSnapshot(
    folderId ? `folder:${folderId}` : null,
    () => doc(db, "ideaFolders", folderId),
    (snap) => (snap.exists() ? withId(snap) : null)
  );

export const useCanvases = (folderId) =>
  useSnapshot(
    folderId ? `canvases:${folderId}` : null,
    () => query(collection(db, "ideaFolders", folderId, "canvases"), orderBy("createdAt")),
    docsOf
  );

export const useCanvasItems = (folderId, canvasId) =>
  useSnapshot(
    folderId && canvasId ? `items:${folderId}/${canvasId}` : null,
    () => collection(db, "ideaFolders", folderId, "canvases", canvasId, "items"),
    docsOf
  );

export const useComments = (folderId, canvasId) =>
  useSnapshot(
    folderId && canvasId ? `comments:${folderId}/${canvasId}` : null,
    () => collection(db, "ideaFolders", folderId, "canvases", canvasId, "comments"),
    docsOf
  );
