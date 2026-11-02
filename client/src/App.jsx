
import { useEffect, useState } from "react";
import Login from "./Login";
import Register from "./Register";
import UserManagement from "./UserManagement";
import Profile from "./Profile";
import "./App.css";

const API_URL = "http://localhost:5000/api/issues";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const STATUSES = [
  "Pending",
  "Under Review",
  "In Progress",
  "Resolved",
  "Closed",
];

const CATEGORIES = [
  "Road Damage",
  "Waste Management",
  "Streetlight",
  "Water Supply",
  "Public Safety",
  "Other",
];

function formatDate(date) {
  if (!date) return "Date unavailable";
  return new Date(date).toLocaleString();
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [authPage, setAuthPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");

  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Road Damage",
    location: "",
    priority: "Medium",
  });

  function handleLoginSuccess(userData) {
    setUser(userData);
    setActivePage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setIssues([]);
    setError("");
    setNotice("");
    setActivePage("dashboard");
    setAuthPage("login");
  }

  async function loadIssues() {
    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load reports.");
      }

      setIssues(result.data);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch(`${API_URL}/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load dashboard statistics."
        );
      }

      setStats(result.data);
    } catch (err) {
      console.error("Statistics error:", err.message);
    }
  }

  // Load reports after a successful login.
  useEffect(() => {
    if (user) {
      setLoading(true);
      loadIssues();

      if (user.role === "admin") {
        loadStats();
      }
    }
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit report.");
      }

      setForm({
        title: "",
        description: "",
        category: "Road Damage",
        location: "",
        priority: "Medium",
      });

      setNotice("Report submitted successfully.");
      setSearch("");
      setStatusFilter("All");
      setCategoryFilter("All");

      await loadIssues();

      if (user.role === "admin") {
        await loadStats();
      }
    } catch (err) {
      setError(err.message || "Unable to submit report.");
    }
  }

  async function handleStatusChange(issueId, newStatus) {
    setError("");
    setNotice("");
    setUpdatingId(issueId);

    try {
      const response = await fetch(`${API_URL}/${issueId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update report status."
        );
      }

      setIssues((previousIssues) =>
        previousIssues.map((issue) =>
          issue._id === issueId
            ? { ...issue, status: result.data.status }
            : issue
        )
      );

      setNotice("Report status updated successfully.");

      if (user.role === "admin") {
        await loadStats();
      }
    } catch (err) {
      setError(err.message || "Unable to update report status.");
      await loadIssues();
    } finally {
      setUpdatingId("");
    }
  }

  const filteredIssues = issues.filter((issue) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      issue.title?.toLowerCase().includes(searchText) ||
      issue.location?.toLowerCase().includes(searchText) ||
      issue.description?.toLowerCase().includes(searchText) ||
      issue._id?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      (issue.status || "Pending") === statusFilter;

    const matchesCategory =
      categoryFilter === "All" ||
      issue.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Show Login or Registration when no user is logged in.
  if (!user) {
    return authPage === "register" ? (
      <Register onShowLogin={() => setAuthPage("login")} />
    ) : (
      <Login
        onShowRegister={() => setAuthPage("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <main className="app-container">
      <header className="hero">
        <p className="eyebrow">COMMUNITY SERVICES</p>
        <h1>Community Issue Reporting System</h1>
        <p>
          Report community concerns and monitor their progress in one place.
        </p>

        <div className="user-info">
          <span>
            Welcome, {user.name}! ({user.role})
          </span>

          <button
            type="button"
            onClick={() => {
              setActivePage("profile");
              setError("");
              setNotice("");
            }}
          >
            My Profile
          </button>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {activePage === "profile" ? (
        <section>
          <Profile />

        <button
          type="button"
          className="profile-back-button"
          onClick={() => setActivePage("dashboard")}
        >
          Back to Dashboard
        </button>
        </section>
      ) : (
        <>
          {user.role === "admin" && (
            <section className="dashboard-stats">
              <h2>Admin Dashboard</h2>
              <p>Overview of community issue reports.</p>

              {stats ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Reports</h3>
                    <p>{stats.totalReports}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Pending</h3>
                    <p>{stats.pendingReports}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Under Review</h3>
                    <p>{stats.underReviewReports}</p>
                  </div>

                  <div className="stat-card">
                    <h3>In Progress</h3>
                    <p>{stats.inProgressReports}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Resolved</h3>
                    <p>{stats.resolvedReports}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Closed</h3>
                    <p>{stats.closedReports}</p>
                  </div>
                </div>
              ) : (
                <p>Loading dashboard statistics...</p>
              )}
            </section>
          )}

          {user.role === "admin" && <UserManagement />}

          <section className="issue-form-section">
            <h2>Submit a Community Issue</h2>

            <form onSubmit={handleSubmit} className="issue-form">
              <label>
                Issue Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: Broken streetlight"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the community issue..."
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Priority
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>

              <label>
                Location
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Enter the issue location"
                  required
                />
              </label>

              <button type="submit">Submit Report</button>
            </form>
          </section>

          {error && <p className="error-message">{error}</p>}
          {notice && <p className="success-message">{notice}</p>}

          <section className="reports-section">
            <div className="section-heading">
              <div>
                <h2>Community Reports</h2>
                <p>Search, filter, and review community reports.</p>
              </div>

              <button type="button" onClick={loadIssues}>
                Refresh
              </button>
            </div>

            <div className="report-filters">
              <label>
                Search Reports
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, location, description, or ID..."
                />
              </label>

              <label>
                Filter by Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Filter by Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
              >
                Clear Filters
              </button>
            </div>

            <p className="results-count">
              Showing {filteredIssues.length} of {issues.length} reports
            </p>

            {loading ? (
              <p>Loading reports...</p>
            ) : filteredIssues.length === 0 ? (
              <p>
                No matching reports found. Try changing your search or filters.
              </p>
            ) : (
              <div className="reports-grid">
                {filteredIssues.map((issue) => (
                  <article className="issue-card" key={issue._id}>
                    <div className="issue-card-heading">
                      <span className="category-label">{issue.category}</span>
                      <span className="status-label">
                        {issue.status || "Pending"}
                      </span>
                    </div>

                    <h3>{issue.title}</h3>
                    <p className="issue-description">{issue.description}</p>

                    <div className="issue-details">
                      <p>
                        <strong>Report ID:</strong> {issue._id}
                      </p>
                      <p>
                        <strong>Location:</strong> {issue.location}
                      </p>
                      <p>
                        <strong>Priority:</strong> {issue.priority || "Not set"}
                      </p>
                      <p>
                        <strong>Date Submitted:</strong>{" "}
                        {formatDate(issue.createdAt)}
                      </p>
                      <p>
                        <strong>Status:</strong> {issue.status || "Pending"}
                      </p>
                    </div>

                    {user.role === "admin" && (
                      <label className="status-control">
                        Update Status
                        <select
                          value={issue.status || "Pending"}
                          onChange={(event) =>
                            handleStatusChange(issue._id, event.target.value)
                          }
                          disabled={updatingId === issue._id}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {updatingId === issue._id && (
                          <small>Saving status...</small>
                        )}
                      </label>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default App;
