package httpserver

import (
	"html/template"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Beta1o/glpi/modern/internal/legacy"
)

type Config struct {
	Addr       string
	LegacyRoot string
}

type Server struct {
	cfg    Config
	logger *slog.Logger
}

func ConfigFromEnv() Config {
	addr := getenv("GLPI_ADDR", "127.0.0.1:8091")
	root := getenv("GLPI_LEGACY_ROOT", "..")
	return Config{Addr: addr, LegacyRoot: root}
}

func New(cfg Config, logger *slog.Logger) http.Handler {
	server := &Server{cfg: cfg, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("/", server.route)
	return securityHeaders(mux)
}

func (s *Server) route(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.URL.Path == "/healthz":
		writeText(w, http.StatusOK, "ok\n")
	case r.URL.Path == "/readyz":
		writeText(w, http.StatusOK, "ready\n")
	case r.URL.Path == "/" || r.URL.Path == "/index.html":
		s.renderLogin(w, r)
	case r.URL.Path == "/front/login.php" && r.Method == http.MethodPost:
		http.SetCookie(w, &http.Cookie{Name: "glpi_session", Value: "1", Path: "/", HttpOnly: true, SameSite: http.SameSiteLaxMode})
		http.Redirect(w, r, "/front/central.php", http.StatusFound)
	case r.URL.Path == "/front/logout.php":
		http.SetCookie(w, &http.Cookie{Name: "glpi_session", Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode})
		http.Redirect(w, r, "/", http.StatusFound)
	case s.serveStatic(w, r):
		return
	case legacy.IsLegacyRoute(r.URL.Path):
		if !isLoggedIn(r) {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}
		s.renderLegacyPage(w, r, legacy.PageFor(r.URL.Path))
	default:
		http.NotFound(w, r)
	}
}

func (s *Server) serveStatic(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		return false
	}

	var base string
	var rel string
	switch {
	case strings.HasPrefix(r.URL.Path, "/assets/"):
		base = filepath.Join(s.cfg.LegacyRoot, "modern", "static")
		rel = strings.TrimPrefix(r.URL.Path, "/assets/")
	case strings.HasPrefix(r.URL.Path, "/lib/"),
		strings.HasPrefix(r.URL.Path, "/pics/"),
		strings.HasPrefix(r.URL.Path, "/build/"),
		strings.HasPrefix(r.URL.Path, "/css/"),
		strings.HasPrefix(r.URL.Path, "/sound/"):
		base = filepath.Join(s.cfg.LegacyRoot, "public")
		rel = strings.TrimPrefix(r.URL.Path, "/")
	case strings.HasPrefix(r.URL.Path, "/js/"):
		base = filepath.Join(s.cfg.LegacyRoot, "js")
		rel = strings.TrimPrefix(r.URL.Path, "/js/")
	default:
		return false
	}

	path := filepath.Clean(filepath.Join(base, rel))
	if !strings.HasPrefix(path, filepath.Clean(base)+string(os.PathSeparator)) && path != filepath.Clean(base) {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return true
	}

	http.ServeFile(w, r, path)
	return true
}

func (s *Server) renderLogin(w http.ResponseWriter, _ *http.Request) {
	writeHTML(w, loginTemplate, nil)
}

func (s *Server) renderLegacyPage(w http.ResponseWriter, _ *http.Request, page legacy.Page) {
	writeHTML(w, shellTemplate, page)
}

func isLoggedIn(r *http.Request) bool {
	cookie, err := r.Cookie("glpi_session")
	return err == nil && cookie.Value == "1"
}

func writeText(w http.ResponseWriter, status int, body string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(body))
}

func writeHTML(w http.ResponseWriter, tpl *template.Template, data any) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = tpl.Execute(w, data)
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}

var loginTemplate = template.Must(template.New("login").Parse(`<!doctype html>
<html lang="en" data-glpi-theme="auror" data-glpi-theme-dark="0">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authentication - GLPI</title>
  <link rel="stylesheet" href="/assets/glpi-modern.css">
</head>
<body class="welcome-anonymous">
  <main id="page" class="page-anonymous" role="main" tabindex="-1">
    <div class="login-shell">
      <div class="login-brand">
        <img src="/pics/glpi.png" alt="GLPI">
      </div>
      <div class="login-card">
        <div class="login-card-header">
          <h1>Login to your account</h1>
          <span>GLPI internal database</span>
        </div>
        <form action="/front/login.php" method="post" autocomplete="off">
          <label class="form-label" for="login_name">Login</label>
          <input class="form-control" id="login_name" name="login_name" value="glpi">
          <label class="form-label" for="login_password">Password</label>
          <input class="form-control" id="login_password" name="login_password" type="password">
          <label class="form-label" for="auth">Login source</label>
          <select class="form-select" id="auth" name="auth"><option>GLPI internal database</option></select>
          <button type="submit" class="btn btn-primary btn-block">Sign in</button>
        </form>
      </div>
    </div>
  </main>
</body>
</html>`))

var shellTemplate = template.Must(template.New("shell").Parse(`<!doctype html>
<html lang="en" data-glpi-theme="auror" data-glpi-theme-dark="0">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{.Label}} - GLPI</title>
  <link rel="stylesheet" href="/assets/glpi-modern.css">
</head>
<body class="vertical-layout central">
  <div class="page">
    <aside class="navbar navbar-vertical navbar-expand-lg sticky-lg-top sidebar" aria-label="Sidebar">
      <div class="container-fluid">
        <a href="/front/central.php" class="navbar-brand"><img src="/pics/glpi.png" alt="GLPI"></a>
        <nav class="navbar-collapse">
          <ul class="navbar-nav">
            <li class="nav-item"><a class="nav-link {{if eq .Active "assets"}}active{{end}}" href="/front/dashboard_assets.php"><i class="ti ti-package"></i><span class="menu-label">Assets</span></a></li>
            <li class="nav-item"><a class="nav-link {{if eq .Active "assistance"}}active{{end}}" href="/front/ticket.php"><i class="ti ti-headset"></i><span class="menu-label">Assistance</span></a></li>
            <li class="nav-item"><a class="nav-link {{if eq .Active "management"}}active{{end}}" href="/front/softwarelicense.php"><i class="ti ti-briefcase"></i><span class="menu-label">Management</span></a></li>
            <li class="nav-item"><a class="nav-link {{if eq .Active "tools"}}active{{end}}" href="/front/project.php"><i class="ti ti-tool"></i><span class="menu-label">Tools</span></a></li>
            <li class="nav-item"><a class="nav-link {{if eq .Active "administration"}}active{{end}}" href="/front/user.php"><i class="ti ti-users"></i><span class="menu-label">Administration</span></a></li>
            <li class="nav-item"><a class="nav-link {{if eq .Active "setup"}}active{{end}}" href="/front/dropdown.php"><i class="ti ti-settings"></i><span class="menu-label">Setup</span></a></li>
          </ul>
        </nav>
      </div>
    </aside>
    <header class="navbar d-print-none sticky-lg-top shadow-sm navbar-light navbar-expand-md">
      <div class="header-container container-fluid">
        <nav aria-label="Breadcrumbs">
          <ol class="breadcrumb breadcrumb-alternate">
            <li class="breadcrumb-item"><a href="/front/central.php">Home</a></li>
            {{if .Parent}}<li class="breadcrumb-item"><a href="{{.Href}}">{{.Parent}}</a></li>{{end}}
            <li class="breadcrumb-item"><a class="here" href="{{.Href}}">{{.Label}}</a></li>
          </ol>
        </nav>
        <div class="top-actions">
          <form class="global-search" action="/front/search.php" method="get">
            <input name="globalsearch" placeholder="Search" aria-label="Search">
          </form>
          <a href="/front/logout.php" class="btn btn-sm btn-ghost-secondary">Logout</a>
        </div>
      </div>
    </header>
    <div class="page-wrapper mb-0">
      <div class="page-body container-fluid">
        <main id="page" class="legacy" role="main" tabindex="-1">
          <div class="page-title-row">
            <div>
              <h1>{{.Label}}</h1>
              {{if .Parent}}<span>{{.Parent}}</span>{{else}}<span>Home</span>{{end}}
            </div>
            <div class="page-actions">
              <a class="btn btn-outline" href="{{.Href}}">Refresh</a>
              <a class="btn btn-primary" href="{{if eq .Active "assistance"}}/front/ticket.form.php{{else}}{{.Href}}{{end}}">Add</a>
            </div>
          </div>

          {{if eq .Href "/front/central.php"}}
          <section class="dashboard-grid">
            <article class="metric-card accent-blue"><span>Assistance</span><strong>12</strong><small>Tickets to process</small></article>
            <article class="metric-card accent-green"><span>Assets</span><strong>148</strong><small>Active inventory items</small></article>
            <article class="metric-card accent-amber"><span>Planning</span><strong>5</strong><small>Tasks scheduled today</small></article>
            <article class="metric-card accent-red"><span>Overdue</span><strong>3</strong><small>SLA alerts</small></article>
          </section>
          <section class="content-grid">
            <div class="card">
              <div class="card-header"><h2>Tickets</h2><a href="/front/ticket.php">View all</a></div>
              <div class="table-responsive">
                <table class="data-table">
                  <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Last update</th></tr></thead>
                  <tbody>
                    <tr><td>1</td><td>New employee workstation</td><td><span class="badge badge-new">New</span></td><td>Medium</td><td>Today 09:40</td></tr>
                    <tr><td>2</td><td>VPN access request</td><td><span class="badge badge-processing">Processing</span></td><td>High</td><td>Today 08:15</td></tr>
                    <tr><td>3</td><td>Printer maintenance</td><td><span class="badge badge-waiting">Waiting</span></td><td>Low</td><td>Yesterday</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-header"><h2>Personal view</h2><a href="/front/planning.php">Planning</a></div>
              <ul class="timeline-list">
                <li><span class="timeline-dot"></span><div><strong>09:00</strong><p>Review unassigned incidents</p></div></li>
                <li><span class="timeline-dot"></span><div><strong>11:30</strong><p>Change approval meeting</p></div></li>
                <li><span class="timeline-dot"></span><div><strong>14:00</strong><p>Inventory reconciliation</p></div></li>
              </ul>
            </div>
          </section>
          {{else if eq .Href "/front/ticket.form.php"}}
          <form class="card form-card" method="post" action="/front/ticket.form.php">
            <div class="card-header"><h2>Ticket</h2><div class="tab-row"><a class="active" href="#">Ticket</a><a href="#">Actors</a><a href="#">Processing</a><a href="#">Documents</a></div></div>
            <div class="form-grid">
              <label><span>Title</span><input class="form-control" name="name" value=""></label>
              <label><span>Type</span><select class="form-select" name="type"><option>Incident</option><option>Request</option></select></label>
              <label><span>Status</span><select class="form-select" name="status"><option>New</option><option>Processing</option><option>Pending</option><option>Solved</option></select></label>
              <label><span>Priority</span><select class="form-select" name="priority"><option>Medium</option><option>High</option><option>Very high</option><option>Low</option></select></label>
              <label><span>Category</span><select class="form-select" name="category"><option>General</option><option>Hardware</option><option>Software</option><option>Network</option></select></label>
              <label><span>Requester</span><input class="form-control" name="requester" value="glpi"></label>
              <label class="full"><span>Description</span><textarea class="form-control" name="content" rows="7"></textarea></label>
            </div>
            <div class="form-actions"><button class="btn btn-primary" type="submit">Save</button><a class="btn btn-outline" href="/front/ticket.php">Cancel</a></div>
          </form>
          {{else}}
          <section class="card list-card">
            <div class="card-header">
              <h2>{{.Label}}</h2>
              <div class="list-actions"><a class="btn btn-sm btn-outline" href="{{.Href}}">Search</a><a class="btn btn-sm btn-primary" href="{{.Href}}">Add</a></div>
            </div>
            <form class="search-panel" method="get" action="{{.Href}}">
              <label><span>Search</span><input class="form-control" name="criteria" placeholder="contains"></label>
              <label><span>Status</span><select class="form-select" name="status"><option>All</option><option>Active</option><option>Deleted</option></select></label>
              <label><span>Entity</span><select class="form-select" name="entity"><option>Root entity</option><option>Recursive</option></select></label>
              <button class="btn btn-primary" type="submit">Search</button>
            </form>
            <div class="tab-row list-tabs"><a class="active" href="#">All</a><a href="#">Personal view</a><a href="#">Global view</a></div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th><input type="checkbox" aria-label="Select all"></th><th>ID</th><th>Name</th><th>Status</th><th>Entity</th><th>Last update</th></tr>
                </thead>
                <tbody>
                  <tr><td><input type="checkbox" aria-label="Select row"></td><td>1</td><td>{{.Label}} - default</td><td><span class="badge badge-new">Active</span></td><td>Root entity</td><td>Today</td></tr>
                  <tr><td><input type="checkbox" aria-label="Select row"></td><td>2</td><td>{{.Label}} - operations</td><td><span class="badge badge-processing">In use</span></td><td>Root entity</td><td>Yesterday</td></tr>
                  <tr><td><input type="checkbox" aria-label="Select row"></td><td>3</td><td>{{.Label}} - archived</td><td><span class="badge badge-waiting">Archived</span></td><td>Root entity</td><td>Last week</td></tr>
                </tbody>
              </table>
            </div>
            <div class="bulk-actions"><select class="form-select"><option>Actions</option><option>Update</option><option>Put in trashbin</option><option>Restore</option><option>Delete permanently</option></select><button class="btn btn-outline" type="button">Apply</button></div>
          </section>
          {{end}}
        </main>
      </div>
    </div>
  </div>
</body>
</html>`))
