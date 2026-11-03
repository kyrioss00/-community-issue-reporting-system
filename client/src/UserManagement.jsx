import { useEffect, useState } from "react";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load users.");
        }

        setUsers(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);


  async function handleRoleChange(userId, newRole) {
  setError("");
  setMessage("");
  setUpdatingId(userId);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/${userId}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to update user role.");
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user._id === userId
          ? { ...user, role: result.data.role }
          : user
      )
    );

    setMessage("User role updated successfully.");
  } catch (err) {
    setError(err.message);
  } finally {
    setUpdatingId("");
  }
}

async function handleDeleteUser(userId, userName) {
  const confirmed = window.confirm(
    `Are you sure you want to delete the account of ${userName}? This action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  setError("");
  setMessage("");
  setUpdatingId(userId);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to delete user.");
    }

    setUsers((previousUsers) =>
      previousUsers.filter((user) => user._id !== userId)
    );

    setMessage("User account deleted successfully.");
  } catch (err) {
    setError(err.message);
  } finally {
    setUpdatingId("");
  }
}

  return (
    <section className="user-management">
      <h2>User Management</h2>
      <p>View all registered community accounts.</p>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : users.length === 0 ? (
        <p>No registered users found.</p>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Manage Role</th>
                <th>Date Registered</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                
                 <td>
                    <select
                        value={user.role}
                        disabled={updatingId === user._id}
                        onChange={(event) =>
                        handleRoleChange(user._id, event.target.value)
                        }
                    >
                        <option value="resident">Resident</option>
                        <option value="admin">Admin</option>
                    </select>
                </td>


                <td>
                <button
                    type="button"
                    onClick={() => handleDeleteUser(user._id, user.name)}
                    disabled={updatingId === user._id}
                >
                    {updatingId === user._id ? "Processing..." : "Delete"}
                </button>
                </td>

                  <td>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="users-count">
        Total Registered Users: {users.length}
      </p>
    </section>
  );
}

export default UserManagement;