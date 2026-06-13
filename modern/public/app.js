const state = {
  assets: [],
  users: [],
  tickets: [],
  metrics: null
};

const elements = {
  assetCount: document.querySelector("#assetCount"),
  assetGrid: document.querySelector("#assetGrid"),
  assetSelect: document.querySelector("#assetSelect"),
  form: document.querySelector("#ticketForm"),
  formMessage: document.querySelector("#formMessage"),
  metrics: document.querySelector("#metrics"),
  refreshButton: document.querySelector("#refreshButton"),
  requesterSelect: document.querySelector("#requesterSelect"),
  systemStatus: document.querySelector("#systemStatus"),
  ticketCount: document.querySelector("#ticketCount"),
  ticketRows: document.querySelector("#ticketRows")
};

elements.refreshButton.addEventListener("click", () => {
  loadData();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.formMessage.textContent = "";

  const formData = new FormData(elements.form);
  const payload = {
    assetId: formData.get("assetId"),
    content: formData.get("content"),
    priority: formData.get("priority"),
    requesterId: formData.get("requesterId"),
    type: formData.get("type"),
    title: formData.get("title")
  };

  const response = await fetch("/api/v1/tickets", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });

  if (!response.ok) {
    const body = await response.json();
    elements.formMessage.textContent = body.error?.message || "Ticket was not created";
    return;
  }

  elements.form.reset();
  elements.formMessage.textContent = "Ticket created";
  await loadData();
});

loadData();

async function loadData() {
  elements.systemStatus.textContent = "Loading";
  const [metrics, assets, tickets, users] = await Promise.all([
    getJson("/api/v1/metrics"),
    getJson("/api/v1/assets"),
    getJson("/api/v1/tickets"),
    getJson("/api/v1/users")
  ]);

  state.metrics = metrics;
  state.assets = assets.data;
  state.tickets = tickets.data;
  state.users = users.data;
  render();
  elements.systemStatus.textContent = "Connected to legacy GLPI database";
}

async function getJson(path) {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return response.json();
}

function render() {
  renderMetrics();
  renderTickets();
  renderAssets();
  renderAssetOptions();
  renderUserOptions();
}

function renderMetrics() {
  const metrics = [
    ["Assets", state.metrics.assets],
    ["Active assets", state.metrics.onlineAssets],
    ["Open tickets", state.metrics.openTickets],
    ["Users", state.metrics.users]
  ];

  elements.metrics.replaceChildren(...metrics.map(([label, value]) => {
    const item = document.createElement("article");
    item.className = "metric";
    item.innerHTML = `<span></span><strong></strong>`;
    item.querySelector("span").textContent = label;
    item.querySelector("strong").textContent = value;
    return item;
  }));
}

function renderTickets() {
  elements.ticketCount.textContent = `${state.tickets.length} total`;
  elements.ticketRows.replaceChildren(...state.tickets.map((ticket) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td><span class="badge"></span></td>
      <td><span class="badge"></span></td>
    `;
    row.children[0].textContent = ticket.number;
    row.children[1].textContent = ticket.title;
    row.children[2].textContent = ticket.requester;
    row.children[3].textContent = ticket.typeLabel;
    row.children[4].querySelector("span").textContent = ticket.priorityLabel;
    row.children[4].querySelector("span").classList.add(`priority-${ticket.priorityKey}`);
    row.children[5].querySelector("span").textContent = ticket.statusLabel;
    row.children[5].querySelector("span").classList.add(`status-${ticket.statusKey}`);
    return row;
  }));
}

function renderAssets() {
  elements.assetCount.textContent = `${state.assets.length} tracked`;
  elements.assetGrid.replaceChildren(...state.assets.map((asset) => {
    const item = document.createElement("article");
    item.className = "asset-item";
    item.innerHTML = `
      <strong></strong>
      <div class="asset-meta">
        <span></span>
        <span></span>
        <span class="badge"></span>
      </div>
    `;
    item.querySelector("strong").textContent = asset.name;
    const spans = item.querySelectorAll("span");
    spans[0].textContent = `${asset.tag} / ${asset.site}`;
    spans[1].textContent = asset.owner;
    spans[2].textContent = asset.statusLabel;
    spans[2].classList.add(`status-${asset.statusKey}`);
    return item;
  }));
}

function renderAssetOptions() {
  const current = elements.assetSelect.value;
  const options = state.assets.map((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = `${asset.tag} - ${asset.name}`;
    return option;
  });

  elements.assetSelect.replaceChildren(new Option("Unassigned", ""), ...options);
  elements.assetSelect.value = current;
}

function renderUserOptions() {
  const current = elements.requesterSelect.value;
  const options = state.users.map((user) => {
    const option = document.createElement("option");
    option.value = String(user.id);
    option.textContent = `${user.displayName} (${user.login})`;
    return option;
  });

  elements.requesterSelect.replaceChildren(new Option("Select requester", ""), ...options);
  elements.requesterSelect.value = current;
}
