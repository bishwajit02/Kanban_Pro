import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaUser,
  FaCalendar,
  FaGithub,
  FaGoogle,
  FaPalette,
  FaKeyboard,
  FaCamera,
  FaCheckCircle,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const defaultProfile = (user) => {
  let firstName = "";
  if (user?.displayName) {
    firstName = user.displayName.split(" ")[0];
  } else if (user?.email) {
    firstName = user.email.split("@")[0];
  }
  return {
    name: user?.displayName || user?.email || "",
    displayName: firstName || "User",
    avatar: user?.photoURL || "",
    dob: "",
    github: "",
    google: user?.email || "",
    theme: "system",
    shortcuts: "default",
  };
};

const ProfilePage = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [tempProfile, setTempProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const ref = doc(db, "profiles", user.uid);
      const snap = await getDoc(ref);
      let loadedProfile;
      if (snap.exists()) {
        loadedProfile = snap.data();
        loadedProfile = {
          ...loadedProfile,
          name: user?.displayName || user?.email || "",
          google: user?.email || "",
          displayName: loadedProfile.displayName || user?.displayName?.split(" ")[0] || "User",
        };
      } else {
        loadedProfile = defaultProfile(user);
        await setDoc(ref, loadedProfile);
      }
      setProfile(loadedProfile);
      setTempProfile(loadedProfile);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "profiles", user.uid);
      await updateDoc(ref, tempProfile);
      setProfile(tempProfile);
      setEdit(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setEdit(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTempProfile((p) => ({ ...p, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-10"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-surface-900 dark:text-surface-100">
              Profile Settings
            </h1>
            <p className="text-lg text-surface-500 dark:text-surface-400 font-medium mt-1">
              Manage your personal information and preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {edit ? (
              <>
                <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} isLoading={saving} leftIcon={FaSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEdit(true)} leftIcon={FaEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Identity Card */}
            <Card className="p-8 md:p-10 rounded-3xl overflow-visible border-surface-200 dark:border-surface-800 shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-surface-800 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <img
                      src={edit ? tempProfile.avatar : profile.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          profile.displayName
                        )}&background=0ea5e9&color=fff&size=128`;
                      }}
                    />
                  </div>
                  {edit && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-3 -right-3 w-10 h-10 bg-primary-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-surface-900 flex items-center justify-center hover:bg-primary-700 transition-colors"
                    >
                      <FaCamera className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-3xl font-black text-surface-900 dark:text-surface-100">
                    {profile.displayName}
                  </h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Badge variant="primary" size="sm" dot>Active Member</Badge>
                    <Badge variant="surface" size="sm" icon={FaClock}>Joined {new Date(user.metadata.creationTime).toLocaleDateString()}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Display Name"
                  disabled={!edit}
                  value={edit ? tempProfile.displayName : profile.displayName}
                  onChange={(e) => setTempProfile(p => ({ ...p, displayName: e.target.value }))}
                  leftIcon={FaUser}
                  className="py-3.5 rounded-2xl"
                />
                <Input
                  label="Full Name"
                  disabled
                  value={profile.name}
                  leftIcon={FaUser}
                  className="py-3.5 rounded-2xl opacity-70"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  disabled={!edit}
                  value={edit ? tempProfile.dob : profile.dob}
                  onChange={(e) => setTempProfile(p => ({ ...p, dob: e.target.value }))}
                  leftIcon={FaCalendar}
                  className="py-3.5 rounded-2xl"
                />
                <Input
                  label="GitHub Profile"
                  disabled={!edit}
                  value={edit ? tempProfile.github : profile.github}
                  onChange={(e) => setTempProfile(p => ({ ...p, github: e.target.value }))}
                  leftIcon={FaGithub}
                  placeholder="github.com/username"
                  className="py-3.5 rounded-2xl"
                />
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-8 md:p-10 rounded-3xl border-surface-200 dark:border-surface-800 shadow-xl">
              <h3 className="text-xl font-black text-surface-900 dark:text-surface-100 mb-8 flex items-center gap-3">
                <FaPalette className="text-primary-500" />
                App Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-black text-surface-700 dark:text-surface-300 uppercase tracking-widest">
                    Theme Mode
                  </label>
                  <select
                    disabled={!edit}
                    value={edit ? tempProfile.theme : profile.theme}
                    onChange={(e) => setTempProfile(p => ({ ...p, theme: e.target.value }))}
                    className="input py-3.5 rounded-2xl appearance-none bg-no-repeat bg-[right_1rem_center]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.5rem' }}
                  >
                    <option value="system">System Preference</option>
                    <option value="light">Always Light</option>
                    <option value="dark">Always Dark</option>
                  </select>
                </div>
                <Input
                  label="Keyboard Shortcuts"
                  disabled={!edit}
                  value={edit ? tempProfile.shortcuts : profile.shortcuts}
                  onChange={(e) => setTempProfile(p => ({ ...p, shortcuts: e.target.value }))}
                  leftIcon={FaKeyboard}
                  className="py-3.5 rounded-2xl"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <Card className="p-8 rounded-3xl border-surface-200 dark:border-surface-800 shadow-xl bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-800">
              <h3 className="text-xl font-black text-surface-900 dark:text-surface-100 mb-6 flex items-center gap-3">
                <FaShieldAlt className="text-primary-500" />
                Account Security
              </h3>
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 shadow-sm">
                  <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="font-bold text-surface-700 dark:text-surface-200">{user.email}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 shadow-sm">
                  <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-2">Status</p>
                  {user.emailVerified ? (
                    <Badge variant="success" icon={FaCheckCircle}>Verified Account</Badge>
                  ) : (
                    <Badge variant="warning">Verification Pending</Badge>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 shadow-sm">
                  <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1">Last Logged In</p>
                  <p className="font-bold text-surface-700 dark:text-surface-200">
                    {new Date(user.metadata.lastSignInTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-800 bg-transparent text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto text-surface-400">
                <FaShieldAlt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-surface-500">Need to change your password or delete your account?</p>
              <Button variant="ghost" className="w-full text-error-500 hover:bg-error-50">
                Advanced Security
              </Button>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
