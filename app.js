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
      .select("planter_name");
    const { data: locations } = await supabase
      .from("trees")
      .select("location_name")
      .neq("location_name", "");

    const uniqueContributors = new Set(
      (contributors || []).map(function (r) { return r.planter_name; })
    ).size;
    const uniqueLocations = new Set(
      (locations || []).map(function (r) { return r.location_name; })
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

  var isSubmitting = false;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    clearErrors();
    formMessage.className = "form-message";
    formMessage.textContent = "";

    var valid = true;

    if (!nameInput.value.trim()) {
      showError("error-planter-name", "Please enter your name.");
      nameInput.classList.add("invalid");
      valid = false;
    } else if (nameInput.value.trim().length > 100) {
      showError("error-planter-name", "Name must be 100 characters or fewer.");
      nameInput.classList.add("invalid");
      valid = false;
    }

    if (!typeInput.value.trim()) {
      showError("error-tree-type", "Please enter the tree type.");
      typeInput.classList.add("invalid");
      valid = false;
    } else if (typeInput.value.trim().length > 80) {
      showError("error-tree-type", "Tree type must be 80 characters or fewer.");
      typeInput.classList.add("invalid");
      valid = false;
    }

    if (!dateInput.value) {
      showError("error-planting-date", "Please select a planting date.");
      dateInput.classList.add("invalid");
      valid = false;
    } else {
      var selectedDate = new Date(dateInput.value);
      var today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        showError("error-planting-date", "Planting date cannot be in the future.");
        dateInput.classList.add("invalid");
        valid = false;
      }
    }

    var lat = parseFloat(locationLat.value);
    var lng = parseFloat(locationLng.value);
    if (!locationMethod.value || isNaN(lat) || isNaN(lng)) {
      showError("error-location", "Please select a planting location on the map.");
      valid = false;
    } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showError("error-location", "Invalid location coordinates. Please reselect your location.");
      valid = false;
    }

    if (photoInput.files && photoInput.files[0]) {
      var file = photoInput.files[0];
      var validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (validTypes.indexOf(file.type) === -1) {
        showError("error-tree-photo", "Please upload a JPG, PNG, or WebP image.");
        valid = false;
      } else if (file.size > 5 * 1024 * 1024) {
        showError("error-tree-photo", "Image must be 5MB or smaller.");
        valid = false;
      }
    }

    if (!valid) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";
    formMessage.className = "form-message loading";
    formMessage.textContent = "Saving your tree...";

    try {
      var supabase = await getSupabaseClient();

      var insertData = {
        planter_name: nameInput.value.trim(),
        tree_type: typeInput.value.trim(),
        planting_date: dateInput.value,
        latitude: lat,
        longitude: lng,
        location_name: locationNameHidden.value || "",
        photo_url: null,
      };

      var result = await supabase.from("trees").insert(insertData).select("id").single();

      if (result.error) throw result.error;

      var treeId = result.data.id;
      var shortRef = treeId.substring(0, 8).toUpperCase();

      formMessage.className = "form-message";
      formMessage.textContent = "";

      var confirmation = document.createElement("div");
      confirmation.className = "success-confirmation";
      confirmation.innerHTML =
        '<div class="success-icon">🌳</div>' +
        '<h3>Your tree has been registered!</h3>' +
        '<p>Give it a name, watch it grow, and share its journey with the community.</p>' +
        '<div class="tree-ref">Tree ID: ' + shortRef + '</div>' +
        '<div class="success-actions">' +
        '<button type="button" onclick="window.location.href=\'track.html\'">🌿 Track Growth</button>' +
        '<button type="button" class="btn-secondary" onclick="resetRegisterForm()">🌱 Register Another</button>' +
        '</div>';

      form.appendChild(confirmation);
      confirmation.scrollIntoView({ behavior: "smooth", block: "center" });

      form.reset();
      if (locationMethod) locationMethod.value = "";
      if (locationLat) locationLat.value = "";
      if (locationLng) locationLng.value = "";
      if (locationNameHidden) locationNameHidden.value = "";
      var locationStatus = document.querySelector(".location-status");
      if (locationStatus) locationStatus.textContent = "Location not selected yet";

      submitBtn.textContent = "🌳 Register My Tree";
      submitBtn.disabled = false;
      isSubmitting = false;
    } catch (err) {
      console.error("Registration error:", err);
      formMessage.className = "form-message error";
      formMessage.textContent =
        "Unable to register your tree right now. Please try again in a moment.";
      submitBtn.textContent = "🌳 Register My Tree";
      submitBtn.disabled = false;
      isSubmitting = false;
    }
  });

  function showError(id, msg) {
    var el = document.getElementById(id);
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

function resetRegisterForm() {
  var confirmation = document.querySelector(".success-confirmation");
  if (confirmation) confirmation.remove();
  var form = document.getElementById("tree-form");
  if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
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

  var isSubmitting = false;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    clearContactErrors();
    formMessage.className = "form-message";
    formMessage.textContent = "";

    var valid = true;

    if (!nameInput.value.trim()) {
      showContactError("error-contact-name", "Please enter your name.");
      nameInput.classList.add("invalid");
      valid = false;
    }

    var email = emailInput.value.trim();
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
    } else if (messageInput.value.trim().length > 2000) {
      showContactError("error-contact-message", "Message must be 2000 characters or fewer.");
      messageInput.classList.add("invalid");
      valid = false;
    }

    if (!valid) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    formMessage.className = "form-message loading";
    formMessage.textContent = "Sending your message...";

    try {
      var supabase = await getSupabaseClient();
      var { error } = await supabase.from("contact_messages").insert({
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
      isSubmitting = false;

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
      isSubmitting = false;
    }
  });

  function showContactError(id, msg) {
    var el = document.getElementById(id);
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
  var treeList = document.getElementById("tree-list");
  if (!treeList) return;

  var allTrees = [];
  var trackMap = null;

  // Show skeleton loading
  treeList.innerHTML = "";
  for (var i = 0; i < 3; i++) {
    var skel = document.createElement("div");
    skel.className = "skeleton-card";
    skel.innerHTML =
      '<div class="skeleton-line medium"></div>' +
      '<div class="skeleton-line long"></div>' +
      '<div class="skeleton-line short"></div>';
    treeList.appendChild(skel);
  }

  try {
    var supabase = await getSupabaseClient();
    var { data, error } = await supabase
      .from("trees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    allTrees = data || [];
  } catch (err) {
    console.error("Failed to load trees:", err);
    treeList.innerHTML =
      '<div class="error-state">' +
      '<div class="error-state-icon">⚠️</div>' +
      '<h4>Unable to load trees</h4>' +
      '<p>Something went wrong while fetching tree data.</p>' +
      '<button type="button" onclick="location.reload()">Try Again</button>' +
      '</div>';
    return;
  }

  if (allTrees.length === 0) {
    treeList.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-state-icon">🌱</div>' +
      '<h4>No trees registered yet</h4>' +
      '<p>Be the first to register a tree and start tracking its growth.</p>' +
      '<a href="register.html">Register a tree →</a>' +
      '</div>';
    return;
  }

  renderTreeList(allTrees);

  var searchInput = document.getElementById("track-search");
  var filterSelect = document.getElementById("track-filter");

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
    var query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    var stage = filterSelect ? filterSelect.value : "";

    var filtered = allTrees.filter(function (t) {
      var matchesQuery =
        !query ||
        t.tree_type.toLowerCase().includes(query) ||
        t.planter_name.toLowerCase().includes(query) ||
        (t.location_name || "").toLowerCase().includes(query);
      var matchesStage = !stage || t.growth_stage === stage;
      return matchesQuery && matchesStage;
    });

    renderTreeList(filtered);
  }

  function renderTreeList(trees) {
    treeList.innerHTML = "";
    if (trees.length === 0) {
      treeList.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-icon">🔍</div>' +
        '<h4>No trees match your search</h4>' +
        '<p>Try adjusting your search or filter criteria.</p>' +
        '</div>';
      return;
    }
    trees.forEach(function (tree) {
      var card = document.createElement("div");
      card.className = "tree-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.dataset.treeId = tree.id;

      var stageIcon = {
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
    var detailEl = document.getElementById("tree-detail");
    if (!detailEl) return;

    detailEl.innerHTML =
      '<div class="track-loading">Loading details...</div>';

    var updates = [];
    try {
      var supabase = await getSupabaseClient();
      var { data, error } = await supabase
        .from("tree_updates")
        .select("*")
        .eq("tree_id", tree.id)
        .order("update_date", { ascending: false });
      if (!error) updates = data || [];
    } catch (err) {
      console.error("Failed to load updates:", err);
    }

    var daysPlanted = Math.floor(
      (Date.now() - new Date(tree.planting_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    var stageIcon = {
      seedling: "🌱",
      sapling: "🌿",
      young: "🌳",
      mature: "🌲",
    }[tree.growth_stage] || "🌱";

    // Build growth timeline (planting + updates in chronological order)
    var timelineEntries = [];

    timelineEntries.push({
      type: "planting",
      date: tree.planting_date,
      label: "Tree Planted",
      stats: "Planted by " + escapeHtml(tree.planter_name),
      notes: null,
    });

    // Updates are fetched newest-first; add them in reverse for chronological display
    var chronoUpdates = updates.slice().reverse();
    chronoUpdates.forEach(function (u) {
      var stats = [];
      if (u.height_cm) stats.push(u.height_cm + " cm");
      stats.push("Health: " + escapeHtml(u.health_status));
      timelineEntries.push({
        type: "update",
        date: u.update_date,
        label: "Growth Update",
        stats: stats.join(" · "),
        notes: u.notes,
      });
    });

    var timelineHtml = "";
    if (timelineEntries.length === 0) {
      timelineHtml = '<p style="color:var(--text-light);font-size:15px;">No growth history yet.</p>';
    } else {
      timelineHtml = '<div class="growth-timeline">';
      timelineEntries.forEach(function (entry) {
        timelineHtml +=
          '<div class="timeline-entry ' + entry.type + '">' +
          '<div class="timeline-date">' + formatDate(entry.date) + '</div>' +
          '<div class="timeline-label">' + escapeHtml(entry.label) + '</div>' +
          '<div class="timeline-stats">' + entry.stats + '</div>' +
          (entry.notes ? '<p>' + escapeHtml(entry.notes) + '</p>' : '') +
          '</div>';
      });
      timelineHtml += '</div>';
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
      "<h4>🌿 Growth Timeline</h4>" +
      timelineHtml +
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
    }
    var mapEl = document.getElementById("track-map");
    if (!mapEl) return;

    trackMap = L.map("track-map").setView([tree.latitude, tree.longitude], 14);
    var tileUrl =
      "https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=6b4b353b3eb74bd191c7ae4751a7a86a";
    L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    }).addTo(trackMap);

    L.marker([tree.latitude, tree.longitude])
      .addTo(trackMap)
      .bindPopup(
        "<strong>" + escapeHtml(tree.tree_type) + "</strong><br>" +
        escapeHtml(tree.planter_name) + "<br>" +
        escapeHtml(tree.location_name || "")
      )
      .openPopup();

    setTimeout(function () {
      trackMap.invalidateSize();
    }, 100);
  }
}

/* ==============================
   COMMUNITY PAGE
============================== */

async function initCommunityPage() {
  var activityFeed = document.getElementById("activity-feed");
  var speciesChart = document.getElementById("species-chart");
  var contributorsGrid = document.getElementById("contributors-grid");
  var stageBreakdown = document.getElementById("stage-breakdown");

  if (!activityFeed && !speciesChart && !contributorsGrid) return;

  var trees = [];
  try {
    var supabase = await getSupabaseClient();
    var { data, error } = await supabase
      .from("trees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    trees = data || [];
  } catch (err) {
    console.error("Failed to load community data:", err);
    if (activityFeed)
      activityFeed.innerHTML =
        '<div class="error-state">' +
        '<div class="error-state-icon">⚠️</div>' +
        '<h4>Unable to load activity</h4>' +
        '<p>Please try again later.</p>' +
        '</div>';
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
  if (stageBreakdown) renderStageBreakdown(trees);
}

function renderStageBreakdown(trees) {
  var el = document.getElementById("stage-breakdown");
  if (!el) return;

  if (trees.length === 0) {
    el.style.display = "none";
    return;
  }

  var stages = {
    seedling: { icon: "🌱", label: "Seedlings" },
    sapling: { icon: "🌿", label: "Saplings" },
    young: { icon: "🌳", label: "Young Trees" },
    mature: { icon: "🌲", label: "Mature Trees" },
  };

  var counts = { seedling: 0, sapling: 0, young: 0, mature: 0 };
  trees.forEach(function (t) {
    if (counts[t.growth_stage] !== undefined) counts[t.growth_stage]++;
  });

  var hasAny = false;
  for (var k in counts) { if (counts[k] > 0) hasAny = true; }
  if (!hasAny) { el.style.display = "none"; return; }

  el.style.display = "flex";
  el.innerHTML = "";
  ["seedling", "sapling", "young", "mature"].forEach(function (stage) {
    if (counts[stage] === 0) return;
    var card = document.createElement("div");
    card.className = "stage-card";
    card.innerHTML =
      '<div class="stage-card-icon">' + stages[stage].icon + '</div>' +
      '<strong>' + counts[stage] + '</strong>' +
      '<span>' + stages[stage].label + '</span>';
    el.appendChild(card);
  });
}

function renderActivityFeed(trees) {
  var feed = document.getElementById("activity-feed");
  if (!feed) return;

  if (trees.length === 0) {
    feed.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-state-icon">🌱</div>' +
      '<h4>No activity yet</h4>' +
      '<p>Once trees are registered, their activity will appear here.</p>' +
      '<a href="register.html">Register the first tree →</a>' +
      '</div>';
    return;
  }

  var recent = trees.slice(0, 8);
  feed.innerHTML = recent
    .map(function (t) {
      var stageIcon = {
        seedling: "🌱",
        sapling: "🌿",
        young: "🌳",
        mature: "🌲",
      }[t.growth_stage] || "🌱";
      var timeAgo = formatTimeAgo(t.created_at);

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
  var chart = document.getElementById("species-chart");
  if (!chart) return;

  if (trees.length === 0) {
    chart.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-state-icon">🌳</div>' +
      '<h4>No species data yet</h4>' +
      '<p>Species distribution will appear once trees are registered.</p>' +
      '</div>';
    return;
  }

  var counts = {};
  trees.forEach(function (t) {
    var type = t.tree_type || "Unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  var sorted = Object.entries(counts).sort(function (a, b) {
    return b[1] - a[1];
  });
  var maxCount = sorted[0][1];

  chart.innerHTML = sorted
    .map(function (entry) {
      var pct = (entry[1] / maxCount) * 100;
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
  var grid = document.getElementById("contributors-grid");
  if (!grid) return;

  if (trees.length === 0) {
    grid.innerHTML =
      '<div class="empty-state">' +
      '<div class="empty-state-icon">🤝</div>' +
      '<h4>No contributors yet</h4>' +
      '<p>Top contributors will appear here once trees are registered.</p>' +
      '</div>';
    return;
  }

  var counts = {};
  trees.forEach(function (t) {
    counts[t.planter_name] = (counts[t.planter_name] || 0) + 1;
  });

  var sorted = Object.entries(counts)
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, 6);

  var icons = ["🌱", "🌳", "🌿", "🌲", "🪴", "🍃"];

  grid.innerHTML = sorted
    .map(function (entry, i) {
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
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  var diff = Date.now() - new Date(timestamp).getTime();
  var days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  if (days < 30) return Math.floor(days / 7) + " week" + (Math.floor(days / 7) > 1 ? "s" : "") + " ago";
  if (days < 365) return Math.floor(days / 30) + " month" + (Math.floor(days / 30) > 1 ? "s" : "") + " ago";
  return Math.floor(days / 365) + " year" + (Math.floor(days / 365) > 1 ? "s" : "") + " ago";
}
