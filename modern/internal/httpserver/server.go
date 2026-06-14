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
  <link rel="stylesheet" href="/lib/base.css">
  <link rel="stylesheet" href="/lib/tabler.css">
</head>
<body class="welcome-anonymous">
  <main id="page" class="page-anonymous" role="main" tabindex="-1">
    <div class="container-tight py-6" style="max-width: 60rem">
      <div class="text-center"><span class="glpi-logo mb-4" title="GLPI"></span></div>
      <div class="card card-md main-content-card">
        <div class="card-header"></div>
        <div class="card-body">
          <form action="/front/login.php" method="post" autocomplete="off">
            <div class="row justify-content-center">
              <div class="col-md-5">
                <div class="card-header mb-4"><h2 class="mx-auto">Login to your account</h2></div>
                <div class="mb-3"><label class="form-label" for="login_name">Login</label><input class="form-control" id="login_name" name="login_name" value="glpi"></div>
                <div class="mb-4"><label class="form-label" for="login_password">Password</label><input class="form-control" id="login_password" name="login_password" type="password"></div>
                <div class="mb-3"><label class="form-label" for="auth">Login source</label><select class="form-select" id="auth" name="auth"><option>GLPI internal database</option></select></div>
                <button type="submit" class="btn btn-primary w-100 mb-2">Sign in</button>
              </div>
            </div>
          </form>
        </div>
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
  <link rel="stylesheet" href="/lib/base.css">
  <link rel="stylesheet" href="/lib/tabler.css">
</head>
<body class="vertical-layout central">
  <div class="page">
    <aside class="navbar navbar-vertical navbar-expand-lg sticky-lg-top sidebar" aria-label="Sidebar">
      <div class="container-fluid">
        <a href="/front/central.php" class="navbar-brand"><span class="glpi-logo"></span></a>
        <nav class="navbar-collapse">
          <ul class="navbar-nav">
            <li class="nav-item"><a class="nav-link" href="/front/dashboard_assets.php"><i class="ti ti-package"></i><span class="menu-label">Assets</span></a></li>
            <li class="nav-item"><a class="nav-link" href="/front/ticket.php"><i class="ti ti-headset"></i><span class="menu-label">Assistance</span></a></li>
            <li class="nav-item"><a class="nav-link" href="/front/softwarelicense.php"><i class="ti ti-briefcase"></i><span class="menu-label">Management</span></a></li>
            <li class="nav-item"><a class="nav-link" href="/front/project.php"><i class="ti ti-tool"></i><span class="menu-label">Tools</span></a></li>
            <li class="nav-item"><a class="nav-link" href="/front/user.php"><i class="ti ti-users"></i><span class="menu-label">Administration</span></a></li>
            <li class="nav-item"><a class="nav-link" href="/front/dropdown.php"><i class="ti ti-settings"></i><span class="menu-label">Setup</span></a></li>
          </ul>
        </nav>
      </div>
    </aside>
    <header class="navbar d-print-none sticky-lg-top shadow-sm navbar-light navbar-expand-md">
      <div class="header-container container-fluid">
        <nav aria-label="Breadcrumbs">
          <ol class="breadcrumb breadcrumb-alternate">
            <li class="breadcrumb-item"><a href="/front/central.php"><i class="ti ti-home-2"></i> Home</a></li>
            {{if .Parent}}<li class="breadcrumb-item"><a href="{{.Href}}"><i class="ti {{.ParentIcon}}"></i> {{.Parent}}</a></li>{{end}}
            <li class="breadcrumb-item"><a class="here" href="{{.Href}}"><i class="ti {{.Icon}}"></i> {{.Label}}</a></li>
          </ol>
        </nav>
        <div class="ms-auto"><a href="/front/logout.php" class="btn btn-sm btn-ghost-secondary">Logout</a></div>
      </div>
    </header>
    <div class="page-wrapper mb-0">
      <div class="page-body container-fluid">
        <main id="page" class="legacy" role="main" tabindex="-1">
          <div class="card">
            <div class="card-header"><h1 class="card-title">{{.Label}}</h1></div>
            <div class="card-body">
              <p class="text-muted">Go runtime compatibility page for {{.Href}}. PHP behavior will be replaced here module by module while preserving the old GLPI schema and route contract.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</body>
</html>`))
