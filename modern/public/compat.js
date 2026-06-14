const closeDropdowns = (except) => {
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    if (menu !== except) {
      menu.classList.remove("show");
    }
  });
  document.querySelectorAll('[data-bs-toggle="dropdown"].show').forEach((toggle) => {
    if (!except || toggle.nextElementSibling !== except) {
      toggle.classList.remove("show");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
};

document.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const dropdownToggle = target.closest('[data-bs-toggle="dropdown"]');
  if (dropdownToggle instanceof HTMLElement) {
    event.preventDefault();
    const menu = dropdownToggle.parentElement?.querySelector(".dropdown-menu");
    if (menu instanceof HTMLElement) {
      const willShow = !menu.classList.contains("show");
      closeDropdowns(menu);
      menu.classList.toggle("show", willShow);
      dropdownToggle.classList.toggle("show", willShow);
      dropdownToggle.setAttribute("aria-expanded", String(willShow));
    }
    return;
  }

  const savedSearchToggle = target.closest(".show-saved-searches");
  if (savedSearchToggle instanceof HTMLElement) {
    event.preventDefault();
    const itemType = (savedSearchToggle.dataset.itemtype || "").toLowerCase();
    document.querySelectorAll(`.saved-searches-panel.${itemType}`).forEach((panel) => {
      panel.classList.toggle("d-none");
      panel.classList.toggle("responsive-toggle");
    });
    return;
  }

  if (target.closest(".close-saved-searches-panel")) {
    event.preventDefault();
    target.closest(".saved-searches-panel")?.classList.add("d-none");
    return;
  }

  const modalButton = target.closest("[data-glpi-modal-url]");
  if (modalButton instanceof HTMLElement) {
    event.preventDefault();
    const url = modalButton.dataset.glpiModalUrl;
    if (url) {
      await showModal(url);
    }
    return;
  }

  if (target.closest("[data-glpi-modal-close]") || target.classList.contains("glpi-modal-backdrop")) {
    event.preventDefault();
    document.querySelector(".glpi-modal-backdrop")?.remove();
    return;
  }

  const tabLink = target.closest('#tabspanel [data-bs-toggle="tab"]');
  if (tabLink instanceof HTMLAnchorElement) {
    event.preventDefault();
    const list = tabLink.closest("#tabspanel");
    const tabsWrapper = list?.parentElement;
    list?.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
    tabLink.classList.add("active");

    if (tabLink.dataset.showAllTabs === "true") {
      tabsWrapper?.querySelectorAll(".tab-pane").forEach((pane) => {
        pane.classList.add("active", "show");
        pane.classList.remove("fade");
      });
      return;
    }

    const tabIndex = Array.from(list?.querySelectorAll(".nav-link") || []).indexOf(tabLink);
    tabsWrapper?.querySelectorAll(".tab-pane").forEach((pane, index) => {
      pane.classList.toggle("active", index === tabIndex);
      pane.classList.toggle("show", index === tabIndex);
    });
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.classList.contains("massive_action_checkbox")) {
    const checked = document.querySelectorAll(".massive_action_checkbox:checked").length;
    document.querySelectorAll(".massiveactions-control").forEach((control) => {
      control.classList.toggle("d-none", checked === 0);
      control.classList.toggle("animate__slideInLeft", checked > 0);
      control.classList.toggle("animate__slideOutLeft", checked === 0);
    });
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.name !== "saved_searches_filter_list_input") {
    return;
  }

  const panel = target.closest(".saved-searches-panel");
  const query = target.value.toLowerCase();
  panel?.querySelectorAll(".savedsearches-item").forEach((row) => {
    row.classList.toggle("d-none", query.length > 0 && !row.textContent?.toLowerCase().includes(query));
  });
});

document.querySelectorAll(".massive_action_checkbox").forEach((checkbox) => {
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
});

async function showModal(url) {
  const previous = document.querySelector(".glpi-modal-backdrop");
  previous?.remove();

  const response = await fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } });
  const html = await response.text();
  const backdrop = document.createElement("div");
  backdrop.className = "glpi-modal-backdrop";
  backdrop.innerHTML = `<div class="modal d-block" role="dialog">${html}</div>`;
  document.body.append(backdrop);
}
