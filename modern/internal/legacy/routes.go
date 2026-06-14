package legacy

import "strings"

type Page struct {
	Active     string
	Href       string
	Icon       string
	Label      string
	Parent     string
	ParentIcon string
}

func PageFor(path string) Page {
	if page, ok := pages[path]; ok {
		return page
	}

	label := strings.TrimSuffix(strings.TrimPrefix(path, "/front/"), ".php")
	label = strings.ReplaceAll(label, "_", " ")
	label = strings.ReplaceAll(label, ".", " ")
	label = strings.TrimSpace(label)
	if label == "" {
		label = "GLPI"
	}

	return Page{
		Active:     "tools",
		Href:       path,
		Icon:       "ti-file",
		Label:      title(label),
		Parent:     "GLPI",
		ParentIcon: "ti-dashboard",
	}
}

func IsLegacyRoute(path string) bool {
	if path == "/ServiceCatalog" || path == "/Inventory/Configuration" {
		return true
	}
	return strings.HasPrefix(path, "/front/") && strings.HasSuffix(path, ".php")
}

func title(value string) string {
	parts := strings.Fields(value)
	for i, part := range parts {
		if part == "" {
			continue
		}
		parts[i] = strings.ToUpper(part[:1]) + part[1:]
	}
	return strings.Join(parts, " ")
}

var pages = map[string]Page{
	"/front/central.php":            {"central", "/front/central.php", "ti-dashboard", "Dashboard", "", ""},
	"/front/dashboard_assets.php":   {"assets", "/front/dashboard_assets.php", "ti-dashboard", "Dashboard", "Assets", "ti-package"},
	"/front/computer.php":           {"assets", "/front/computer.php", "ti-device-laptop", "Computers", "Assets", "ti-package"},
	"/front/monitor.php":            {"assets", "/front/monitor.php", "ti-device-desktop", "Monitors", "Assets", "ti-package"},
	"/front/software.php":           {"assets", "/front/software.php", "ti-apps", "Software", "Assets", "ti-package"},
	"/front/networkequipment.php":   {"assets", "/front/networkequipment.php", "ti-network", "Network Devices", "Assets", "ti-package"},
	"/front/peripheral.php":         {"assets", "/front/peripheral.php", "ti-usb", "Peripherals", "Assets", "ti-package"},
	"/front/printer.php":            {"assets", "/front/printer.php", "ti-printer", "Printers", "Assets", "ti-package"},
	"/front/cartridgeitem.php":      {"assets", "/front/cartridgeitem.php", "ti-droplet-half-2-filled", "Cartridges", "Assets", "ti-package"},
	"/front/consumableitem.php":     {"assets", "/front/consumableitem.php", "ti-package", "Consumables", "Assets", "ti-package"},
	"/front/phone.php":              {"assets", "/front/phone.php", "ti-phone", "Phones", "Assets", "ti-package"},
	"/front/allassets.php":          {"assets", "/front/allassets.php", "ti-packages", "Global", "Assets", "ti-package"},
	"/front/dashboard_helpdesk.php": {"assistance", "/front/dashboard_helpdesk.php", "ti-dashboard", "Dashboard", "Assistance", "ti-headset"},
	"/front/ticket.php":             {"assistance", "/front/ticket.php", "ti-alert-circle", "Tickets", "Assistance", "ti-headset"},
	"/front/ticket.form.php":        {"assistance", "/front/ticket.form.php", "ti-plus", "Create Ticket", "Assistance", "ti-headset"},
	"/front/problem.php":            {"assistance", "/front/problem.php", "ti-alert-triangle", "Problems", "Assistance", "ti-headset"},
	"/front/change.php":             {"assistance", "/front/change.php", "ti-clipboard-check", "Changes", "Assistance", "ti-headset"},
	"/front/planning.php":           {"assistance", "/front/planning.php", "ti-calendar-time", "Planning", "Assistance", "ti-headset"},
	"/front/stat.php":               {"assistance", "/front/stat.php", "ti-chart-pie", "Statistics", "Assistance", "ti-headset"},
	"/ServiceCatalog":               {"assistance", "/ServiceCatalog", "ti-library", "Service catalog", "Assistance", "ti-headset"},
	"/front/softwarelicense.php":    {"management", "/front/softwarelicense.php", "ti-certificate", "Licenses", "Management", "ti-briefcase"},
	"/front/budget.php":             {"management", "/front/budget.php", "ti-cash", "Budgets", "Management", "ti-briefcase"},
	"/front/supplier.php":           {"management", "/front/supplier.php", "ti-building-factory-2", "Suppliers", "Management", "ti-briefcase"},
	"/front/contact.php":            {"management", "/front/contact.php", "ti-address-book", "Contacts", "Management", "ti-briefcase"},
	"/front/contract.php":           {"management", "/front/contract.php", "ti-file-description", "Contracts", "Management", "ti-briefcase"},
	"/front/document.php":           {"management", "/front/document.php", "ti-files", "Documents", "Management", "ti-briefcase"},
	"/front/project.php":            {"tools", "/front/project.php", "ti-layout-kanban", "Projects", "Tools", "ti-tool"},
	"/front/knowbaseitem.php":       {"tools", "/front/knowbaseitem.php", "ti-lifebuoy", "Knowledge Base", "Tools", "ti-tool"},
	"/front/report.php":             {"tools", "/front/report.php", "ti-report", "Reports", "Tools", "ti-tool"},
	"/front/savedsearch.php":        {"tools", "/front/savedsearch.php", "ti-star", "Saved Searches", "Tools", "ti-tool"},
	"/front/user.php":               {"administration", "/front/user.php", "ti-user", "Users", "Administration", "ti-users"},
	"/front/group.php":              {"administration", "/front/group.php", "ti-users-group", "Groups", "Administration", "ti-users"},
	"/front/entity.php":             {"administration", "/front/entity.php", "ti-sitemap", "Entities", "Administration", "ti-users"},
	"/front/rule.php":               {"administration", "/front/rule.php", "ti-adjustments", "Rules", "Administration", "ti-users"},
	"/front/profile.php":            {"administration", "/front/profile.php", "ti-user-check", "Profiles", "Administration", "ti-users"},
	"/front/logs.php":               {"administration", "/front/logs.php", "ti-list-details", "Logs", "Administration", "ti-users"},
	"/Inventory/Configuration":      {"setup", "/Inventory/Configuration", "ti-package-import", "Inventory", "Setup", "ti-settings"},
	"/front/dropdown.php":           {"setup", "/front/dropdown.php", "ti-list", "Dropdowns", "Setup", "ti-settings"},
	"/front/devices.php":            {"setup", "/front/devices.php", "ti-cpu", "Components", "Setup", "ti-settings"},
	"/front/setup.notification.php": {"setup", "/front/setup.notification.php", "ti-bell", "Notifications", "Setup", "ti-settings"},
	"/front/webhook.php":            {"setup", "/front/webhook.php", "ti-webhook", "Webhooks", "Setup", "ti-settings"},
	"/front/config.form.php":        {"setup", "/front/config.form.php", "ti-settings", "General", "Setup", "ti-settings"},
	"/front/plugin.php":             {"setup", "/front/plugin.php", "ti-plug-connected", "Plugins", "Setup", "ti-settings"},
}
