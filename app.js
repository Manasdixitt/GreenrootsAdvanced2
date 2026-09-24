/* ==============================
   GreenRoots App — Shared Logic
   Navigation, counters, forms,
   track page, community page
============================== */

document.addEventListener("DOMContentLoaded", async function () {
  initNavigation();
  initSmoothScroll();
  await initCounters();
  initRegisterForm();
  initContactForm();
  await initTrackPage();
  await initCommunityPage();
});

/* ==============================
   NAVIGATION (mobile menu)
============================== */

function initNavigation() {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("open");
    navToggle.classList.toggle("active");
    const expanded = navLinks.classList.contains("open");
    navToggle.setAttribute("aria-expanded", expanded);
  });

  document.querySelectorAll(".nav-links a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (e) {
    if (
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target) &&
      navLinks.classList.contains("open")
    ) {
      navLinks.classList.remove("open");
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ==============================
   SMOOTH SCROLL
============================== */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/* ==============================
   ANIMATED COUNTERS
============================== */

async function fetchStats() {
  try {
    const supabase = await getSupabaseClient();
    const [{ count: treeCount }, { count: updateCount }] = await Promise.all([
      supabase.from("trees").select("*", { count: "exact", head: true }),
      supabase.from("tree_updates").select("*", { count: "exact", head: true }),
    ]);
    const { data: contributors } = await supabase
      .from("trees")
      .select("planter_name")
      .order("planter_name");
    const { data: locations } = await supabase
      .from("trees")
      .select("location_name")
      .neq("location_name", "");

    const uniqueContributors = new Set(
      (contributors || []).map((r) => r.planter_name)
    ).size;
    const uniqueLocations = new Set(
      (locations || []).map((r) => r.location_name)
    ).size;

    return {
      trees: treeCount || 0,
      contributors: uniqueContributors || 0,
      locations: uniqueLocations || 0,
      updates: updateCount || 0,
    };
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    return { trees: 0, contributors: 0, locations: 0, updates: 0 };
  }
}

async function initCounters() {
  const counters = document.querySelectorAll(".counter");
  if (counters.length === 0) return;

  const stats = await fetchStats();

  counters.forEach(function (el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || "";
    el.dataset.suffix = suffix;
  });

  const counterMap = {
    "Trees Planted": "trees",
    "Contributors": "contributors",
    "Locations": "locations",
    "Locations Reached": "locations",
    "Growth Updates": "updates",
    "People Involved": "contributors",
  };

  counters.forEach(function (el) {
    const labelEl = el.nextElementSibling;
    const label = labelEl ? labelEl.textContent.trim() : "";
    const key = counterMap[label];
    if (key && stats[key] !== undefined) {
      el.dataset.target = stats[key];
    }
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(function (c) {
    observer.observe(c);
  });
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10) || 0;
  const suffix = el.dataset.suffix || "";
  const duration = 1500;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target + suffix;
    }
  }

  requestAnimationFrame(update);
}

/* ==============================
   REGISTER FORM
============================== */

function initRegisterForm() {
  const form = document.getElementById("tree-form");
  if (!form) return;

  const nameInput = document.getElementById("planter-name");
  const typeInput = document.getElementById("tree-type");
  const dateInput = document.getElementById("planting-date");
  const locationMethod = document.querySelector(".location-method");
  const locationLat = document.querySelector(".location-lat");
  const locationLng = document.querySelector(".location-lng");
  const locationNameHidden = document.querySelector(".location-name-hidden");
  const photoInput = document.getElementById("tree-photo");
  const formMessage = document.getElementById("form-message");
  const submitBtn = document.getElementById("submit-btn");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearErrors();
    formMessage.className = "form-message";
    formMessage.textContent = "";

    let valid = true;

    if (!nameInput.value.trim()) {
      showError("error-planter-name", "Please enter your name.");
      nameInput.classList.add("invalid");
      valid = false;
    }

    if (!typeInput.value.trim()) {
      showError("error-tree-type", "Please enter the tree type.");
      typeInput.classList.add("invalid");
      valid = false;
    }

    if (!dateInput.value) {
      showError("error-planting-date", "Please select a planting date.");
      dateInput.classList.add("invalid");
      valid = false;
    } else {
      const selectedDate = new Date(dateInput.value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        showError("error-planting-date", "Planting date cannot be in the future.");
        dateInput.classList.add("invalid");
        valid = false;
      }
    }

    if (!locationMethod.value || !locationLat.value || !locationLng.value) {
      showError("error-location", "Please select a planting location on the map.");
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";
    formMessage.className = "form-message loading";
    formMessage.textContent = "Saving your tree...";

    try {
      const supabase = await getSupabaseClient();

      const insertData = {
        planter_name: nameInput.value.trim(),
        tree_type: typeInput.value.trim(),
        planting_date: dateInput.value,
        latitude: parseFloat(locationLat.value),
        longitude: parseFloat(locationLng.value),
        location_name: locationNameHidden.value || "",
        photo_url: null,
      };

      const { error } = await supabase.from("trees").insert(insertData);

      if (error) throw error;

      formMessage.className = "form-message success";
      formMessage.textContent =
        "🌳 Your tree has been registered successfully! You can now track its growth on the Track Growth page.";
      form.reset();
      if (locationMethod) locationMethod.value = "";
      if (locationLat) locationLat.value = "";
      if (locationLng) locationLng.value = "";
      if (locationNameHidden) locationNameHidden.value = "";
      const locationStatus = document.querySelector(".location-status");
      if (locationStatus) locationStatus.textContent = "Location not selected yet";

      submitBtn.textContent = "🌳 Register My Tree";
      submitBtn.disabled = false;

      setTimeout(function () {
        formMessage.className = "form-message";
        formMessage.textContent = "";
      }, 6000);
    } catch (err) {
      console.error("Registration error:", err);
      formMessage.className = "form-message error";
      formMessage.textContent =
        "Unable to register your tree right now. Please try again in a moment.";
      submitBtn.textContent = "🌳 Register My Tree";
      submitBtn.disabled = false;
    }
  });

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
    });
    document.querySelectorAll(".invalid").forEach(function (el) {
      el.classList.remove("invalid");
    });
  }

  nameInput.addEventListener("input", function () {
    if (nameInput.value.trim()) nameInput.classList.remove("invalid");
  });
  typeInput.addEventListener("input", function () {
    if (typeInput.value.trim()) typeInput.classList.remove("invalid");
  });
  dateInput.addEventListener("change", function () {
    if (dateInput.value) dateInput.classList.remove("invalid");
  });
}

/* ==============================
   CONTACT FORM
============================== */

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");
  const formMessage = document.getElementById("contact-form-message");
  const submitBtn = document.getElementById("contact-submit-btn");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearContactErrors();
    formMessage.className = "form-message";
    formMessage.textContent = "";

    let valid = true;

    if (!nameInput.value.trim()) {
      showContactError("error-contact-name", "Please enter your name.");
      nameInput.classList.add("invalid");
      valid = false;
    }

    const email = emailInput.value.trim();
    if (!email) {
      showContactError("error-contact-email", "Please enter your email.");
      emailInput.classList.add("invalid");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showContactError("error-contact-email", "Please enter a valid email address.");
      emailInput.classList.add("invalid");
      valid = false;
    }

    if (!messageInput.value.trim()) {
      showContactError("error-contact-message", "Please enter a message.");
      messageInput.classList.add("invalid");
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    formMessage.className = "form-message loading";
    formMessage.textContent = "Sending your message...";

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("contact_messages").insert({
        name: nameInput.value.trim(),
        email: email,
        message: messageInput.value.trim(),
      });

      if (error) throw error;

      formMessage.className = "form-message success";
      formMessage.textContent =
        "✅ Thank you! Your message has been sent. We'll get back to you soon.";
      form.reset();
      submitBtn.textContent = "📨 Send Message";
      submitBtn.disabled = false;

      setTimeout(function () {
        formMessage.className = "form-message";
        formMessage.textContent = "";
      }, 6000);
    } catch (err) {
      console.error("Contact form error:", err);
      formMessage.className = "form-message error";
      formMessage.textContent =
        "Unable to send your message right now. Please try again later.";
      submitBtn.textContent = "📨 Send Message";
      submitBtn.disabled = false;
    }
  });

  function showContactError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearContactErrors() {
    document.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
    });
    document.querySelectorAll(".invalid").forEach(function (el) {
      el.classList.remove("invalid");
    });
  }
}

/* ==============================
   TRACK PAGE
============================== */

async function initTrackPage() {
  const treeList = document.getElementById("tree-list");
  if (!treeList) return;

  let allTrees = [];
  let trackMap = null;
  let trackMarkers = [];

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("trees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    allTrees = data || [];
  } catch (err) {
    console.error("Failed to load trees:", err);
    treeList.innerHTML =
      '<div class="track-loading">Unable to load trees. Please try again later.</div>';
    return;
  }

  if (allTrees.length === 0) {
    treeList.innerHTML =
      '<div class="track-loading">No trees registered yet. <a href="register.html">Register the first one!</a></div>';
    return;
  }

  renderTreeList(allTrees);

  const searchInput = document.getElementById("track-search");
  const filterSelect = document.getElementById("track-filter");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      applyFilters();
    });
  }
  if (filterSelect) {
    filterSelect.addEventListener("change", function () {
      applyFilters();
    });
  }

  function applyFilters() {
    const query = (searchInput?.value || "").toLowerCase().trim();
    const stage = filterSelect?.value || "";

    let filtered = allTrees.filter(function (t) {
      const matchesQuery =
        !query ||
        t.tree_type.toLowerCase().includes(query) ||
        t.planter_name.toLowerCase().includes(query) ||
        (t.location_name || "").toLowerCase().includes(query);
      const matchesStage = !stage || t.growth_stage === stage;
      return matchesQuery && matchesStage;
    });

    renderTreeList(filtered);
  }

  function renderTreeList(trees) {
    treeList.innerHTML = "";
    if (trees.length === 0) {
      treeList.innerHTML =
        '<div class="track-loading">No trees match your search.</div>';
      return;
    }
    trees.forEach(function (tree) {
      const card = document.createElement("div");
      card.className = "tree-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.dataset.treeId = tree.id;

      const stageIcon = {
        seedling: "🌱",
        sapling: "🌿",
        young: "🌳",
        mature: "🌲",
      }[tree.growth_stage] || "🌱";

      card.innerHTML =
        '<div class="tree-card-header">' +
        '<span class="tree-card-title">' + stageIcon + " " + escapeHtml(tree.tree_type) + "</span>" +
        '<span class="growth-badge ' + tree.growth_stage + '">' + tree.growth_stage + "</span>" +
        "</div>" +
        '<div class="tree-card-meta">' +
        "Planted by " + escapeHtml(tree.planter_name) + " · " +
        formatDate(tree.planting_date) +
        "</div>" +
        (tree.location_name
          ? '<div class="tree-card-meta">📍 ' + escapeHtml(tree.location_name) + "</div>"
          : "");

      card.addEventListener("click", function () {
        document.querySelectorAll(".tree-card").forEach(function (c) {
          c.classList.remove("active");
        });
        card.classList.add("active");
        showTreeDetail(tree);
      });

      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });

      treeList.appendChild(card);
    });
  }

  async function showTreeDetail(tree) {
    const detailEl = document.getElementById("tree-detail");
    if (!detailEl) return;

    detailEl.innerHTML =
      '<div class="track-loading">Loading details...</div>';

    let updates = [];
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("tree_updates")
        .select("*")
        .eq("tree_id", tree.id)
        .order("update_date", { ascending: false });
      if (!error) updates = data || [];
    } catch (err) {
      console.error("Failed to load updates:", err);
    }

    const daysPlanted = Math.floor(
      (Date.now() - new Date(tree.planting_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const stageIcon = {
      seedling: "🌱",
      sapling: "🌿",
      young: "🌳",
      mature: "🌲",
    }[tree.growth_stage] || "🌱";

    let updatesHtml = "";
    if (updates.length === 0) {
      updatesHtml = "<p style='color:var(--text-light);font-size:15px;'>No growth updates recorded yet.</p>";
    } else {
      updatesHtml = updates.map(function (u) {
        return (
          '<div class="update-entry">' +
          '<div class="update-date">' + formatDate(u.update_date) + "</div>" +
          '<div class="update-stats">' +
          (u.height_cm ? "<span>" + u.height_cm + " cm</span>" : "") +
          "<span>Health: " + escapeHtml(u.health_status) + "</span>" +
          "</div>" +
          (u.notes ? "<p>" + escapeHtml(u.notes) + "</p>" : "") +
          "</div>"
        );
      }).join("");
    }

    detailEl.innerHTML =
      '<div class="detail-header">' +
      "<h3>" + stageIcon + " " + escapeHtml(tree.tree_type) + "</h3>" +
      "<p>Planted by " + escapeHtml(tree.planter_name) + "</p>" +
      "</div>" +
      '<div class="detail-grid">' +
      '<div class="detail-item"><label>Planting Date</label><span class="value">' + formatDate(tree.planting_date) + "</span></div>" +
      '<div class="detail-item"><label>Days Since Planted</label><span class="value">' + daysPlanted + " days</span></div>" +
      '<div class="detail-item"><label>Growth Stage</label><span class="value">' + escapeHtml(tree.growth_stage) + "</span></div>" +
      '<div class="detail-item"><label>Status</label><span class="value">' + escapeHtml(tree.status) + "</span></div>" +
      '<div class="detail-item"><label>Location</label><span class="value">' + escapeHtml(tree.location_name || "Not specified") + "</span></div>" +
      '<div class="detail-item"><label>Coordinates</label><span class="value">' + tree.latitude.toFixed(4) + ", " + tree.longitude.toFixed(4) + "</span></div>" +
      "</div>" +
      '<div class="detail-updates">' +
      "<h4>🌿 Growth History</h4>" +
      updatesHtml +
      "</div>" +
      '<div id="track-map"></div>';

    if (typeof L !== "undefined") {
      initTrackMap(tree);
    }
  }

  function initTrackMap(tree) {
    if (trackMap) {
      trackMap.remove();
      trackMap = null;
      trackMarkers = [];
    }
    const mapEl = document.getElementById("track-map");
    if (!mapEl) return;

    trackMap = L.map("track-map").setView([tree.latitude, tree.longitude], 14);
    const tileUrl =
      "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=6b4b353b3eb74bd191c7ae4751a7a86a";
    L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    }).addTo(trackMap);

    const marker = L.marker([tree.latitude, tree.longitude])
      .addTo(trackMap)
      .bindPopup(
        "<strong>" + escapeHtml(tree.tree_type) + "</strong><br>" +
        escapeHtml(tree.planter_name) + "<br>" +
        escapeHtml(tree.location_name || "")
      )
      .openPopup();
    trackMarkers.push(marker);

    setTimeout(function () {
      trackMap.invalidateSize();
    }, 100);
  }
}

/* ==============================
   COMMUNITY PAGE
============================== */

async function initCommunityPage() {
  const activityFeed = document.getElementById("activity-feed");
  const speciesChart = document.getElementById("species-chart");
  const contributorsGrid = document.getElementById("contributors-grid");

  if (!activityFeed && !speciesChart && !contributorsGrid) return;

  let trees = [];
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("trees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    trees = data || [];
  } catch (err) {
    console.error("Failed to load community data:", err);
    if (activityFeed)
      activityFeed.innerHTML =
        '<div class="track-loading">Unable to load activity.</div>';
    if (speciesChart)
      speciesChart.innerHTML =
        '<div class="track-loading">Unable to load species data.</div>';
    if (contributorsGrid)
      contributorsGrid.innerHTML =
        '<div class="track-loading">Unable to load contributors.</div>';
    return;
  }

  if (activityFeed) renderActivityFeed(trees);
  if (speciesChart) renderSpeciesChart(trees);
  if (contributorsGrid) renderContributors(trees);
}

function renderActivityFeed(trees) {
  const feed = document.getElementById("activity-feed");
  if (!feed) return;

  if (trees.length === 0) {
    feed.innerHTML =
      '<div class="track-loading">No activity yet.</div>';
    return;
  }

  const recent = trees.slice(0, 8);
  feed.innerHTML = recent
    .map(function (t) {
      const initials = t.planter_name
        .split(" ")
        .map(function (w) {
          return w[0];
        })
        .join("")
        .substring(0, 2)
        .toUpperCase();
      const stageIcon = {
        seedling: "🌱",
        sapling: "🌿",
        young: "🌳",
        mature: "🌲",
      }[t.growth_stage] || "🌱";
      const timeAgo = formatTimeAgo(t.created_at);

      return (
        '<div class="activity-item">' +
        '<div class="activity-avatar">' + stageIcon + "</div>" +
        '<div class="activity-content">' +
        '<div class="activity-text"><strong>' + escapeHtml(t.planter_name) +
        "</strong> planted a <strong>" + escapeHtml(t.tree_type) +
        "</strong>" + (t.location_name ? " in " + escapeHtml(t.location_name) : "") + "</div>" +
        '<div class="activity-time">' + timeAgo + "</div>" +
        "</div>" +
        "</div>"
      );
    })
    .join("");
}

function renderSpeciesChart(trees) {
  const chart = document.getElementById("species-chart");
  if (!chart) return;

  if (trees.length === 0) {
    chart.innerHTML = '<div class="track-loading">No species data yet.</div>';
    return;
  }

  const counts = {};
  trees.forEach(function (t) {
    const type = t.tree_type || "Unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort(function (a, b) {
    return b[1] - a[1];
  });
  const maxCount = sorted[0][1];

  chart.innerHTML = sorted
    .map(function (entry) {
      const pct = (entry[1] / maxCount) * 100;
      return (
        '<div class="species-bar-row">' +
        '<div class="species-label">' + escapeHtml(entry[0]) + "</div>" +
        '<div class="species-bar-bg">' +
        '<div class="species-bar-fill" style="width:' + pct + '%"></div>' +
        "</div>" +
        '<div class="species-count">' + entry[1] + "</div>" +
        "</div>"
      );
    })
    .join("");
}

function renderContributors(trees) {
  const grid = document.getElementById("contributors-grid");
  if (!grid) return;

  if (trees.length === 0) {
    grid.innerHTML = '<div class="track-loading">No contributors yet.</div>';
    return;
  }

  const counts = {};
  trees.forEach(function (t) {
    counts[t.planter_name] = (counts[t.planter_name] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, 6);

  const icons = ["🌱", "🌳", "🌿", "🌲", "🪴", "🍃"];

  grid.innerHTML = sorted
    .map(function (entry, i) {
      const initials = entry[0]
        .split(" ")
        .map(function (w) {
          return w[0];
        })
        .join("")
        .substring(0, 2)
        .toUpperCase();
      return (
        '<div class="contributor-card">' +
        '<div class="contributor-avatar">' + (icons[i] || "🌿") + "</div>" +
        '<div class="contributor-name">' + escapeHtml(entry[0]) + "</div>" +
        '<div class="contributor-count">' + entry[1] + " tree" + (entry[1] > 1 ? "s" : "") + " planted</div>" +
        "</div>"
      );
    })
    .join("");
}

/* ==============================
   HELPERS
============================== */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 30) return Math.floor(days / 7) + " week" + (Math.floor(days / 7) > 1 ? "s" : "") + " ago";
  if (days < 365) return Math.floor(days / 30) + " month" + (Math.floor(days / 30) > 1 ? "s" : "") + " ago";
  return Math.floor(days / 365) + " year" + (Math.floor(days / 365) > 1 ? "s" : "") + " ago";
}
