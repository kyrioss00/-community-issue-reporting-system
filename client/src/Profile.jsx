
import { useEffect, useState } from "react";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please log in to view your profile.");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load profile.");
        }

        setProfile(result.data);
        setName(result.data.name || "");
      } catch (err) {
        setError(err.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update profile.");
      }

      setProfile(result.data);
      setName(result.data.name || "");

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, name: result.data.name })
      );

      setIsEditing(false);
      setNotice("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(profile?.name || "");
    setIsEditing(false);
    setError("");
    setNotice("");
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/profile/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },  
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (error && !profile) {
    return <div className="profile-container">{error}</div>;
  }

  if (!profile) {
    return <div className="profile-container">Profile not found.</div>;
  }

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <p>View and manage your account information.</p>

      {error && <p className="error-message">{error}</p>}
      {notice && <p className="success-message">{notice}</p>}

      <div className="profile-card">
        <div className="profile-avatar">
          {profile.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSave}>
              <label>
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>

              <div className="profile-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3>{profile.name}</h3>

              <p>
                <strong>Email:</strong> {profile.email}
              </p>

              <p>
                <strong>Account Role:</strong>{" "}
                {profile.role === "admin" ? "Administrator" : "Resident"}
              </p>

              <p>
                <strong>Registered:</strong>{" "}
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "Not available"}
              </p>

              <button
                type="button"
                onClick={() => {
                  setName(profile.name || "");
                  setIsEditing(true);
                  setError("");
                  setNotice("");
                }}
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-card password-card">
        <div className="profile-details">
          <h3>Change Password</h3>
          <p>Update your account password to keep your account secure.</p>

          <form onSubmit={handleChangePassword}>
            <label>
              Current Password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </label>

            <div className="profile-actions">
              <button type="submit" disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
