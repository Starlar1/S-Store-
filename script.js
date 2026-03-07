(function () {
  // ---------- Supabase Setup ----------
  const supabaseClients = [
    supabase.createClient(
      'https://eghyyqgfunoxulthbeid.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaHl5cWdmdW5veHVsdGhiZWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDAyMDMsImV4cCI6MjA4ODA3NjIwM30.wieVSRijeQVMBeppp_Mnnh4LkOtd83b6FL2HjUw4VMY'
    ), // Server 1
    supabase.createClient(
      'https://hqgojxvavirzlgwsybvm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZ29qeHZhdmlyemxnd3N5YnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDA1NzYsImV4cCI6MjA4ODA3NjU3Nn0.dWBXpPCzw_f6YRMxyEg_SuSPbFBYBvFXYcZRiLnTpbo'
    ) // Server 2
  ];

  const MAX_USERS_PER_SERVER = 100;

  // ---------- Helpers ----------
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  function setModalOpen(isOpen) {
    document.body.classList.toggle("modal-open", isOpen);
  }

  function getAppsFromHome() {
    const cards = qsa(".hero-card");
    return cards.map((card, idx) => ({
      id: idx + 1,
      name: card.dataset.appName || card.querySelector(".hero-app-name")?.textContent?.trim() || `App ${idx + 1}`,
      icon: card.dataset.appIcon || card.querySelector(".hero-app-icon")?.getAttribute("src") || "",
      bg: card.dataset.appBg || "",
      download: card.dataset.appDownload || "#",
      likes: "0",
      downloads: "0",
    }));
  }

  // Helper: Random 10 digit number
  function generateNumberId() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  // Helper: Random 10 digit with letters and numbers
  function generateMixedId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ---------- Elements ----------
  const homeBtn = qs("#homeBtn");
  const topBtn = qs("#topBtn");
  const myAppBtn = qs("#myAppBtn");
  const accBtn = qs("#accBtn");

  // Search
  const openSearch = qs("#openSearch");
  const headerSearchInput = qs("#headerSearchInput");
  const searchScreen = qs("#searchScreen");
  const searchInput = qs("#searchInput");
  const searchClear = qs("#searchClear");
  const searchResults = qs("#searchResults");

  // Detail
  const detailScreen = qs("#detailScreen");
  const detailCover = qs("#detailCover");
  const detailIcon = qs("#detailIcon");
  const detailTitle = qs("#detailTitle");
  const detailDownload = qs("#detailDownload");
  const detailLikes = qs("#detailLikes");
  const detailDownloads = qs("#detailDownloads");
  const otherList = qs("#otherList");

  // TOP
  const topScreen = qs("#topScreen");

  // Account
  const accScreen = qs("#accScreen");
  const accOpenBtn = qs("#accOpenBtn");
  const nameIdModal = qs("#nameIdModal");
  const modalConfirmBtn = qs("#modalConfirmBtn");
  const modalCancelBtn = qs("#modalCancelBtn");
  const modalName = qs("#modalName");
  const accNotLogged = qs("#accNotLogged");
  const accLogged = qs("#accLogged");
  const accDisplayName = qs("#accDisplayName");
  const accUserId = qs("#accUserId");
  const accInviteId = qs("#accInviteId");
  const accServerNumber = qs("#accServerNumber");
  const accSPoint = qs("#accSPoint");
  const accEditBtn = qs("#accEditBtn");
  const accEditForm = qs("#accEditForm");
  const accEditName = qs("#accEditName");
  const accSaveBtn = qs("#accSaveBtn");
  const accCancelBtn = qs("#accCancelBtn");
  const accProfileImage = qs("#accProfileImage");
  const accImageUpload = qs("#accImageUpload");
  const changeAvatarBtn = qs("#changeAvatarBtn");
  const editImageUpload = qs("#editImageUpload");
  const editAvatarPreview = qs("#editAvatarPreview");
  const modalProfileImage = qs("#modalProfileImage");
  const modalImageUpload = qs("#modalImageUpload");
  const modalProfileCircle = qs("#modalProfileCircle");
  const modalLoading = qs("#modalLoading");

  let currentUser = null;
  let selectedImageFile = null;
  let currentServer = 0;
  let editSelectedImage = null;

  // ---------- Header Profile Image Update ----------
  function updateHeaderProfileImage() {
    const headerProfileImg = document.getElementById('headerProfileImage');
    const headerProfileIcon = document.getElementById('headerProfileIcon');
    
    if (!headerProfileImg || !headerProfileIcon) return;
    
    if (currentUser && currentUser.profile_image) {
      headerProfileImg.src = currentUser.profile_image;
      headerProfileImg.style.display = 'inline-block';
      headerProfileIcon.style.display = 'none';
    } else {
      headerProfileImg.style.display = 'none';
      headerProfileIcon.style.display = 'inline-block';
    }
  }

  // ---------- S Point Functions ----------
  async function fetchUserFromSupabase(serverNum, userId) {
    try {
      const { data, error } = await supabaseClients[serverNum]
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async function updateSPointFromServer() {
    if (!currentUser) return;
    
    const serverData = await fetchUserFromSupabase(currentServer, currentUser.user_id);
    if (serverData && serverData.s_point !== undefined) {
      currentUser.s_point = serverData.s_point;
      
      if (accSPoint) {
        accSPoint.textContent = serverData.s_point;
      }
      
      localStorage.setItem('starStoreUser', JSON.stringify(currentUser));
    }
  }

  async function addSPoint(userId, points) {
    if (!currentUser) return false;
    
    const newPoint = (currentUser.s_point || 0) + points;
    
    const { error } = await supabaseClients[currentServer]
      .from('users')
      .update({ s_point: newPoint })
      .eq('user_id', userId);
      
    if (!error) {
      currentUser.s_point = newPoint;
      if (accSPoint) accSPoint.textContent = newPoint;
      localStorage.setItem('starStoreUser', JSON.stringify(currentUser));
      return true;
    }
    return false;
  }

  async function deductSPoint(userId, points) {
    if (!currentUser) return false;
    if ((currentUser.s_point || 0) < points) {
      alert('S Point မလုံလောက်ပါ');
      return false;
    }
    
    const newPoint = (currentUser.s_point || 0) - points;
    
    const { error } = await supabaseClients[currentServer]
      .from('users')
      .update({ s_point: newPoint })
      .eq('user_id', userId);
      
    if (!error) {
      currentUser.s_point = newPoint;
      if (accSPoint) accSPoint.textContent = newPoint;
      localStorage.setItem('starStoreUser', JSON.stringify(currentUser));
      return true;
    }
    return false;
  }

  // ---------- Navigation Functions (Bottom Nav Only) ----------
  function hideAllScreens() {
    detailScreen?.classList.remove('show');
    topScreen?.classList.remove('show');
    searchScreen?.classList.remove('show');
    accScreen?.classList.remove('show');
    setModalOpen(false);
  }

  function goToHome() {
    hideAllScreens();
    setActiveNav('homeBtn');
  }

  function goToTop() {
    hideAllScreens();
    topScreen?.classList.add('show');
    setModalOpen(true);
    setActiveNav('topBtn');
  }

  function goToAcc() {
    hideAllScreens();
    accScreen?.classList.add('show');
    setModalOpen(true);
    setActiveNav('accBtn');
    
    if (currentUser) {
      updateSPointFromServer();
    }
  }

  function openSearchScreen() {
    hideAllScreens();
    searchScreen?.classList.add("show");
    setModalOpen(true);
    if (searchInput) {
      searchInput.value = "";
      renderSearch("");
      setTimeout(() => searchInput.focus(), 0);
    }
  }

  // Bottom nav active state
  function setActiveNav(activeId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(activeId)?.classList.add('active');
  }

  // ---------- Event Listeners (Bottom Navigation) ----------
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      goToHome();
      qs(".content-area")?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (topBtn) {
    topBtn.addEventListener("click", goToTop);
  }

  if (myAppBtn) {
    myAppBtn.addEventListener("click", () => {
      setActiveNav('myAppBtn');
      alert("My App စာမျက်နှာသို့ သွားမည်။");
    });
  }

  if (accBtn) {
    accBtn.addEventListener("click", goToAcc);
  }

  // ---------- Account Functions ----------
  async function findBestServer() {
    let serverCounts = [];
    
    for (let i = 0; i < supabaseClients.length; i++) {
      if (!supabaseClients[i]) {
        serverCounts.push({ server: i, count: MAX_USERS_PER_SERVER });
        continue;
      }
      
      try {
        const { count, error } = await supabaseClients[i]
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          serverCounts.push({ server: i, count: count || 0 });
        } else {
          serverCounts.push({ server: i, count: MAX_USERS_PER_SERVER });
        }
      } catch (e) {
        serverCounts.push({ server: i, count: MAX_USERS_PER_SERVER });
      }
    }
    
    let bestServer = null;
    let minCount = MAX_USERS_PER_SERVER;
    
    for (let s of serverCounts) {
      if (s.count < MAX_USERS_PER_SERVER && s.count < minCount) {
        minCount = s.count;
        bestServer = s.server;
      }
    }
    
    return bestServer;
  }

  function showLoggedInState() {
    if (currentUser) {
      accNotLogged.style.display = 'none';
      accLogged.style.display = 'block';
      accDisplayName.textContent = currentUser.name;
      accUserId.textContent = currentUser.user_id;
      accInviteId.textContent = currentUser.invite_id;
      accServerNumber.textContent = currentUser.server_number || '1';
      
      if (accSPoint) {
        accSPoint.textContent = currentUser.s_point || 0;
      }
      
      if (currentUser.profile_image) {
        accProfileImage.src = currentUser.profile_image;
      }
      
      updateHeaderProfileImage();
      
      setTimeout(() => {
        updateSPointFromServer();
      }, 500);
    }
  }

  function saveToServer(serverNum, name, userId, inviteId, sPoint, profileImage) {
    const userData = {
      name: name,
      user_id: userId,
      invite_id: inviteId,
      profile_image: profileImage,
      server_number: serverNum + 1,
      s_point: sPoint,
      created_at: new Date().toISOString()
    };

    supabaseClients[serverNum]
      .from('users')
      .insert([userData])
      .then(({ error }) => {
        modalLoading.style.display = 'none';
        modalConfirmBtn.disabled = false;
        
        if (error) {
          alert('အကောင့်ဖွင့်ရာတွင် အမှားရှိနေပါသည်');
          return;
        }
        
        currentUser = userData;
        currentServer = serverNum;
        showLoggedInState();
        nameIdModal.style.display = 'none';
        localStorage.setItem('starStoreUser', JSON.stringify(userData));
        
        updateHeaderProfileImage();
        
        modalName.value = '';
        if (modalProfileImage) modalProfileImage.src = '';
        selectedImageFile = null;
      });
  }

  // Open account creation modal
  if (accOpenBtn) {
    accOpenBtn.addEventListener("click", () => {
      nameIdModal.style.display = 'flex';
    });
  }

  // Close modal
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener("click", () => {
      nameIdModal.style.display = 'none';
      modalName.value = '';
      selectedImageFile = null;
      if (modalProfileImage) modalProfileImage.src = '';
    });
  }

  // Image upload for modal
  if (modalProfileCircle && modalImageUpload) {
    modalProfileCircle.addEventListener("click", () => {
      modalImageUpload.click();
    });

    modalImageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          if (modalProfileImage) modalProfileImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Image upload for profile
  if (accProfileCircle && accImageUpload) {
    accProfileCircle.addEventListener("click", () => {
      accImageUpload.click();
    });

    accImageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && currentUser) {
        const reader = new FileReader();
        reader.onload = (e) => {
          accProfileImage.src = e.target.result;
          
          supabaseClients[currentServer]
            .from('users')
            .update({ profile_image: e.target.result })
            .eq('user_id', currentUser.user_id)
            .then(() => {
              currentUser.profile_image = e.target.result;
              localStorage.setItem('starStoreUser', JSON.stringify(currentUser));
              updateHeaderProfileImage();
            });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Edit profile
  if (accEditBtn) {
    accEditBtn.addEventListener("click", () => {
      accEditForm.style.display = 'flex';
      accEditName.value = currentUser.name;
      if (editAvatarPreview) {
        editAvatarPreview.src = currentUser.profile_image || '';
      }
    });
  }

  if (changeAvatarBtn && editImageUpload) {
    changeAvatarBtn.addEventListener("click", () => {
      editImageUpload.click();
    });

    editImageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        editSelectedImage = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          if (editAvatarPreview) editAvatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (accCancelBtn) {
    accCancelBtn.addEventListener("click", () => {
      accEditForm.style.display = 'none';
      editSelectedImage = null;
    });
  }

  if (accSaveBtn) {
    accSaveBtn.addEventListener("click", () => {
      const newName = accEditName.value.trim();
      if (!newName || !currentUser) return;
      
      const updates = { name: newName };
      
      if (editSelectedImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updates.profile_image = e.target.result;
          performUpdate(updates);
        };
        reader.readAsDataURL(editSelectedImage);
      } else {
        performUpdate(updates);
      }
      
      function performUpdate(updates) {
        supabaseClients[currentServer]
          .from('users')
          .update(updates)
          .eq('user_id', currentUser.user_id)
          .then(() => {
            currentUser = { ...currentUser, ...updates };
            accDisplayName.textContent = currentUser.name;
            if (updates.profile_image) {
              accProfileImage.src = updates.profile_image;
            }
            updateHeaderProfileImage();
            accEditForm.style.display = 'none';
            localStorage.setItem('starStoreUser', JSON.stringify(currentUser));
            editSelectedImage = null;
          });
      }
    });
  }

  // Confirm account creation
  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener("click", async () => {
      const name = modalName.value.trim();
      if (!name) {
        alert('နာမည် ထည့်ပါ');
        return;
      }

      modalLoading.style.display = 'block';
      modalConfirmBtn.disabled = true;

      const serverNum = await findBestServer();
      
      if (serverNum === null) {
        alert('Server အားလုံး ပြည့်နေပါသည် (max 100)');
        modalLoading.style.display = 'none';
        modalConfirmBtn.disabled = false;
        return;
      }
      
      const userId = generateNumberId();
      const inviteId = generateMixedId();
      const sPoint = 0;
      
      if (selectedImageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          saveToServer(serverNum, name, userId, inviteId, sPoint, e.target.result);
        };
        reader.readAsDataURL(selectedImageFile);
      } else {
        saveToServer(serverNum, name, userId, inviteId, sPoint, null);
      }
    });
  }

  // ---------- Load saved user ----------
  const savedUser = localStorage.getItem('starStoreUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      currentServer = (currentUser.server_number || 1) - 1;
      showLoggedInState();
      
      updateHeaderProfileImage();
      
      setTimeout(() => {
        updateSPointFromServer();
      }, 1000);
    } catch (e) {
      localStorage.removeItem('starStoreUser');
    }
  } else {
    // Auto show ACC screen on first visit
    setTimeout(() => {
      if (accScreen && !currentUser) {
        accScreen.classList.add('show');
        setModalOpen(true);
        setActiveNav('accBtn');
      }
    }, 500);
  }

// ---------- App Data Functions (အပြည့်အစုံ) ----------
// Helper function to get app data from card
function getAppDataFromCard(card) {
  return {
    name: card.dataset.appName || card.querySelector(".hero-app-name")?.textContent?.trim() || "App",
    icon: card.dataset.appIcon || card.querySelector(".hero-app-icon")?.getAttribute("src") || "",
    bg1: card.dataset.appBg1 || "",
    bg2: card.dataset.appBg2 || "",
    bg3: card.dataset.appBg3 || "",
    download: card.dataset.appDownload || "#",
    likes: card.dataset.appLikes || "0",
    downloads: card.dataset.appDownloads || "0",
    size: card.dataset.appSize || "N/A",
    developer: card.dataset.appDeveloper || "Unknown",
    updated: card.dataset.appUpdated || "N/A",
    version: card.dataset.appVersion || "1.0.0",
    description: card.dataset.appDescription || "No description available",
    group: card.dataset.appGroup || "@StarStoreChannel",
    groupUrl: card.dataset.appGroupUrl || "https://t.me/StarStoreChannel"
  };
}

// Get all apps from home with full data
function getAppsFromHome() {
  const cards = qsa(".hero-card");
  return cards.map((card, idx) => getAppDataFromCard(card));
}

  // ---------- Detail Screen Background Slideshow ----------
  let backgroundImages = [];
  let currentBgIndex = 0;
  let bgInterval = null;
  let touchStartX = 0;
  let touchEndX = 0;

  function startBackgroundSlideshow(images) {
    if (bgInterval) {
      clearInterval(bgInterval);
      bgInterval = null;
    }
    
    backgroundImages = images.filter(img => img && img.trim() !== "").slice(0, 3);
    
    if (backgroundImages.length === 0) return;
    
    currentBgIndex = 0;
    changeBackgroundImage(backgroundImages[0]);
    
    if (backgroundImages.length > 1) {
      startAutoSlideshow();
    }
  }

  function startAutoSlideshow() {
    if (bgInterval) {
      clearInterval(bgInterval);
    }
    bgInterval = setInterval(() => {
      nextBackground();
    }, 3000);
  }

  function nextBackground() {
    if (backgroundImages.length === 0) return;
    currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
    changeBackgroundImage(backgroundImages[currentBgIndex]);
  }

  function prevBackground() {
    if (backgroundImages.length === 0) return;
    currentBgIndex = (currentBgIndex - 1 + backgroundImages.length) % backgroundImages.length;
    changeBackgroundImage(backgroundImages[currentBgIndex]);
  }

  function changeBackgroundImage(imageUrl) {
    detailCover.style.backgroundImage = `url('${imageUrl}')`;
  }

  function stopBackgroundSlideshow() {
    if (bgInterval) {
      clearInterval(bgInterval);
      bgInterval = null;
    }
  }

  function setupTouchEvents() {
    const cover = document.querySelector('.detail-cover');
    if (!cover) return;
    
    cover.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopBackgroundSlideshow();
    }, { passive: true });
    
    cover.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    cover.addEventListener('touchcancel', (e) => {
      if (backgroundImages.length > 1) {
        startAutoSlideshow();
      }
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    
    if (touchEndX < touchStartX - swipeThreshold) {
      nextBackground();
    } else if (touchEndX > touchStartX + swipeThreshold) {
      prevBackground();
    }
    
    if (backgroundImages.length > 1) {
      startAutoSlideshow();
    }
  }

  // ---------- Detail ----------
  function openDetail(app) {
    hideAllScreens();
    
    const bgImages = [
      app.bg1,
      app.bg2,
      app.bg3
    ];
    
    startBackgroundSlideshow(bgImages);
    setupTouchEvents();
    
    detailIcon.src = app.icon || "";
    detailTitle.textContent = app.name || "App";
    detailDownload.href = app.download || "#";

    document.getElementById('appDescription').textContent = app.description || 'No description available';
    document.getElementById('appSize').textContent = app.size || 'N/A';
    document.getElementById('appDeveloper').textContent = app.developer || 'Unknown';
    document.getElementById('appUpdated').textContent = app.updated || 'N/A';
    document.getElementById('appVersion').textContent = app.version || '1.0.0';
    
    const groupLink = document.getElementById('appGroupLink');
    if (groupLink) {
      groupLink.textContent = app.group || '@StarStoreChannel';
      groupLink.href = app.groupUrl || 'https://t.me/StarStoreChannel';
    }

    detailLikes.textContent = app.likes || "0";
    detailDownloads.textContent = app.downloads || "0";

    const others = getAppsFromHome().filter(a => a.name !== app.name);
    otherList.innerHTML = "";

    others.forEach(a => {
      const item = document.createElement("div");
      item.className = "other-item";

      const icon = document.createElement("img");
      icon.className = "other-icon";
      icon.src = a.icon;
      icon.alt = a.name;

      const name = document.createElement("div");
      name.className = "other-name";
      name.textContent = a.name;

      const openBtn = document.createElement("button");
      openBtn.className = "other-open";
      openBtn.type = "button";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => openDetail(a));

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(openBtn);

      otherList.appendChild(item);
    });

    detailScreen.classList.add("show");
    setModalOpen(true);
  }

  // Home download click
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hero-download");
    if (!btn) return;

    const card = btn.closest(".hero-card");
    if (!card) return;

    e.preventDefault();

    const app = {
      name: card.dataset.appName || "App",
      icon: card.dataset.appIcon || "",
      bg1: card.dataset.appBg1 || "",
      bg2: card.dataset.appBg2 || "",
      bg3: card.dataset.appBg3 || "",
      download: card.dataset.appDownload || "#",
      likes: card.dataset.appLikes || "0",
      downloads: card.dataset.appDownloads || "0",
      size: card.dataset.appSize || "N/A",
      developer: card.dataset.appDeveloper || "Unknown",
      updated: card.dataset.appUpdated || "N/A",
      version: card.dataset.appVersion || "1.0.0",
      description: card.dataset.appDescription || "No description available",
      group: card.dataset.appGroup || "@StarStoreChannel",
      groupUrl: card.dataset.appGroupUrl || "https://t.me/StarStoreChannel"
    };

    openDetail(app);
  });

  // Top download click
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".top-download-modern, .top-download");
    if (!btn) return;

    const card = btn.closest(".top-card.modern, .top-card");
    if (!card) return;

    e.preventDefault();

    const app = {
      name: card.dataset.appName || "App",
      icon: card.dataset.appIcon || "",
      bg: card.dataset.appBg || "",
      download: card.dataset.appDownload || "#",
      likes: card.dataset.appLikes || "0",
      downloads: card.dataset.appDownloads || "0",
      size: card.dataset.appSize || "N/A",
      developer: card.dataset.appDeveloper || "Unknown",
      updated: card.dataset.appUpdated || "N/A",
      version: card.dataset.appVersion || "1.0.0",
      description: card.dataset.appDescription || "No description available",
      group: card.dataset.appGroup || "@StarStoreChannel",
      groupUrl: card.dataset.appGroupUrl || "https://t.me/StarStoreChannel"
    };

    openDetail(app);
  });

  // S Point auto update
  setInterval(() => {
    if (currentUser && accScreen.classList.contains('show')) {
      updateSPointFromServer();
    }
  }, 5000);

})();

// ---------- Random App List Shuffle ----------
function shuffleAppList() {
  const homeList = document.getElementById('homeAppList');
  if (!homeList) return;
  
  const cards = Array.from(homeList.children);
  
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  homeList.innerHTML = '';
  cards.forEach(card => homeList.appendChild(card));
}

document.addEventListener('DOMContentLoaded', function() {
  shuffleAppList();
});

// Function to open ACC screen from header button
function openAccountScreenFromHeader() {
  const accScreen = document.getElementById('accScreen');
  if (accScreen) {
    // Hide other screens
    document.querySelectorAll('.detail-screen, .top-screen, .search-screen').forEach(screen => {
      screen.classList.remove('show');
    });
    
    accScreen.classList.add('show');
    accScreen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    if (typeof updateSPointFromServer === 'function') {
      updateSPointFromServer();
    }
  }
}

// Make sure back button works when page loads
document.addEventListener('DOMContentLoaded', function() {
  const accBack = document.getElementById('accBack');
  if (accBack) {
    accBack.addEventListener('click', function() {
      const accScreen = document.getElementById('accScreen');
      if (accScreen) {
        accScreen.classList.remove('show');
        accScreen.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
      }
    });
  }
});

// File Screen Functions
function openFileScreen() {
  // Hide all other screens
  document.querySelectorAll('.detail-screen, .top-screen, .search-screen, .acc-screen').forEach(screen => {
    screen.classList.remove('show');
  });
  
  const fileScreen = document.getElementById('fileScreen');
  if (fileScreen) {
    fileScreen.classList.add('show');
    document.body.classList.add('modal-open');
  }
}

// File Detail Function - data-* attributes ကနေ ပြန်ယူပြသမည်
function openFileDetail(fileCard) {
  // fileCard က element ဖြစ်နိုင်ရင် ဒါမှမဟုတ် fileId ဖြစ်နိုင်ရင်
  let card;
  if (typeof fileCard === 'string') {
    // fileId နဲ့ခေါ်ရင် data-file-id နဲ့ရှာ
    card = document.querySelector(`.file-card[data-file-id="${fileCard}"]`);
  } else {
    card = fileCard.closest('.file-card');
  }
  
  if (!card) return;
  
  // data-* attributes ကနေ အချက်အလက်တွေယူ
  const fileData = {
    id: card.dataset.fileId,
    name: card.dataset.fileName,
    icon: card.dataset.fileIcon,
    cover: card.dataset.fileCover,
    size: card.dataset.fileSize,
    date: card.dataset.fileDate,
    download: card.dataset.fileDownload,
    description: card.dataset.fileDescription,
    fileId: card.dataset.fileIdNumber,
    developer: card.dataset.fileDeveloper,
    group: card.dataset.fileGroup,
    groupUrl: card.dataset.fileGroupUrl
  };
  
  // Detail Screen ကို ဖြည့်မည်
  const detailScreen = document.getElementById('fileDetailScreen');
  const cover = document.getElementById('fileDetailCover');
  const icon = document.getElementById('fileDetailIcon');
  const name = document.getElementById('fileDetailName');
  const title = document.getElementById('fileDetailTitle');
  const size = document.getElementById('fileDetailSize');
  const date = document.getElementById('fileDetailDate');
  const fileId = document.getElementById('fileDetailId');
  const developer = document.getElementById('fileDetailDeveloper');
  const description = document.getElementById('fileDetailDescription');
  const groupLink = document.getElementById('fileDetailGroupLink');
  const downloadBtn = document.getElementById('fileDetailDownloadBtn');
  
  // အချက်အလက်များ ဖြည့်သွင်း
  if (cover) cover.style.backgroundImage = `url('${fileData.cover || ''}')`;
  if (icon) icon.src = fileData.icon || '';
  if (name) name.textContent = fileData.name || 'ဖိုင်အမည်';
  if (title) title.textContent = fileData.name || 'ဖိုင်အသေးစိတ်';
  if (size) size.textContent = fileData.size || '-';
  if (date) date.textContent = fileData.date || '-';
  if (fileId) fileId.textContent = fileData.fileId || '-';
  if (developer) developer.textContent = fileData.developer || '-';
  if (description) description.textContent = fileData.description || 'ဖော်ပြချက် မရှိပါ။';
  
  // Group Link ဖြည့်သွင်း
  if (groupLink) {
    groupLink.textContent = fileData.group || '@StarStoreChannel';
    groupLink.href = fileData.groupUrl || 'https://t.me/StarStoreChannel';
  }
  
  // Download button - နှိပ်ရင် Full Screen ပို့ပေးမည် (လက်ရှိ Screen ထဲမှာပဲ)
  if (downloadBtn) {
    // Remove old event listeners
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    // Add new event listener - ဒီ Screen ထဲမှာပဲ နေမယ်
    newDownloadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // ဘာမှမလုပ်ပါဘူး - ဒီ Screen ထဲမှာပဲ ဆက်နေမယ်
      console.log('Download button clicked - staying in same screen');
    });
  }
  
  // Detail Screen ကိုပြမည်
  detailScreen.style.display = 'flex';
  detailScreen.classList.add('show');
  document.body.classList.add('modal-open');
  
  // Detail Screen ကို အပေါ်ဆုံးကနေ စပြီးပြမည်
  detailScreen.scrollTop = 0;
}

// File Detail ပိတ်ရန်
function closeFileDetail() {
  const detailScreen = document.getElementById('fileDetailScreen');
  if (detailScreen) {
    detailScreen.style.display = 'none';
    detailScreen.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

// File Screen ကိုပိတ်ရန်
function closeFileScreen() {
  const fileScreen = document.getElementById('fileScreen');
  if (fileScreen) {
    fileScreen.classList.remove('show');
  }
}

// setActiveNav function မရှိသေးရင် ထည့်ပေးပါ
if (typeof setActiveNav !== 'function') {
  function setActiveNav(activeId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // File Button ကို နှိပ်ရင် File Screen ဖွင့်မည်
  const fileBtn = document.getElementById('fileBtn');
  if (fileBtn) {
    fileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openFileScreen();
      setActiveNav('fileBtn');
      
      // File Screen ကို အပေါ်ဆုံးကနေ စပြီးပြမည်
      const fileScreen = document.getElementById('fileScreen');
      if (fileScreen) {
        fileScreen.scrollTop = 0;
      }
    });
  }
  
  // File Card တစ်ခုချင်းစီအတွက် Event Listeners
  function setupFileCardListeners() {
    const fileCards = document.querySelectorAll('.file-card');
    fileCards.forEach(card => {
      // Remove old listeners by cloning
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
      
      // Download button (ရယူမည်) ကိုနှိပ်ရင် Full Screen ပို့ပေးမည်
      const downloadBtn = newCard.querySelector('.file-download');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
          e.stopPropagation(); // Card click မဖြစ်အောင်
          openFileDetail(newCard); // Full Screen ပို့မည်
        });
      }
      
      // File card ကိုနှိပ်ရင် detail ဖွင့်မည်
      newCard.addEventListener('click', function(e) {
        // Download button ကိုနှိပ်ရင် detail မဖွင့်ပါဘူး (အပေါ်မှာဖွင့်ပြီးသား)
        if (e.target.closest('.file-download')) {
          return;
        }
        openFileDetail(this);
      });
    });
  }
  
  // Initial setup
  setupFileCardListeners();
  
  // Navigation Buttons
  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', function() {
      closeFileScreen();
      closeFileDetail();
      document.querySelector('.content-area').style.display = 'block';
      setActiveNav('homeBtn');
    });
  }
  
  const topBtn = document.getElementById('topBtn');
  if (topBtn) {
    topBtn.addEventListener('click', function() {
      closeFileScreen();
      closeFileDetail();
    });
  }
  
  const myAppBtn = document.getElementById('myAppBtn');
  if (myAppBtn) {
    myAppBtn.addEventListener('click', function() {
      closeFileScreen();
      closeFileDetail();
    });
  }
  
  const accBtn = document.getElementById('accBtn');
  if (accBtn) {
    accBtn.addEventListener('click', function() {
      closeFileScreen();
      closeFileDetail();
    });
  }
  
  // MutationObserver နဲ့ File Card အသစ်ထပ်ထည့်ရင် Event Listener ပြန်ထည့်ဖို့
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        setupFileCardListeners();
      }
    });
  });
  
  const fileGrid = document.getElementById('fileGrid');
  if (fileGrid) {
    observer.observe(fileGrid, { childList: true, subtree: true });
  }
});

// ---------- Report System ----------
const BOT_TOKEN = '8094270595:AAERziCUrOYf38DMOSReu1oOSEf2LLG_qS0';
const CHAT_USERNAME = '@shei8w7w';

// Elements
const reportModal = document.getElementById('reportModal');
const reportCloseBtn = document.getElementById('reportCloseBtn');
const reportCancelBtn = document.getElementById('reportCancelBtn');
const reportSubmitBtn = document.getElementById('reportSubmitBtn');
const reportType = document.getElementById('reportType');
const reportItemId = document.getElementById('reportItemId');
const reportItemIcon = document.getElementById('reportItemIcon');
const reportItemName = document.getElementById('reportItemName');
const reportMessage = document.getElementById('reportMessage');
const reportLoading = document.getElementById('reportLoading');

// Open Report Modal
function openReportModal(type, itemData) {
  reportType.value = type;
  reportItemId.value = itemData.id || '';
  reportItemIcon.src = itemData.icon || '';
  reportItemName.textContent = itemData.name || 'Unknown';
  reportMessage.value = '';
  
  reportModal.classList.add('show');
  reportModal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

// Close Report Modal
function closeReportModal() {
  reportModal.classList.remove('show');
  reportModal.style.display = 'none';
  document.body.classList.remove('modal-open');
  reportLoading.style.display = 'none';
}

// Send to Telegram
async function sendReportToTelegram(message) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    console.log('Sending to Telegram:', message); // Debug
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_USERNAME,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    console.log('Telegram Response:', data); // Debug
    
    if (data.ok) {
      return true;
    } else {
      console.error('Telegram Error:', data.description);
      return false;
    }
  } catch (error) {
    console.error('Network Error:', error);
    return false;
  }
}

// Submit Report
async function handleReportSubmit() {
  const messageText = reportMessage.value.trim();
  
  if (!messageText) {
    alert('တိုင်ကြားချင်သောအကြောင်းအရာ ရေးသားပါ။');
    return;
  }
  
  // Show loading
  reportLoading.style.display = 'flex';
  reportSubmitBtn.disabled = true;
  reportCancelBtn.disabled = true;
  
  try {
    // Get user info from localStorage
    let userName = 'Guest';
    let userId = 'Not logged in';
    let serverNo = '-';
    
    const savedUser = localStorage.getItem('starStoreUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        userName = user.name || 'Guest';
        userId = user.user_id || 'Not logged in';
        serverNo = user.server_number || '1';
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    // Get item info
    const type = reportType.value === 'app' ? 'App' : 'File';
    const itemName = reportItemName.textContent;
    
    // Format message (Plain text without HTML)
    const reportMessageText = `
📢 အစီရင်ခံစာအသစ်
══════════════════

👤 အသုံးပြုသူ: ${userName}
🆔 User ID: ${userId}
🖥️ Server No: ${serverNo}

📌 ${type} အမည်: ${itemName}
📝 တိုင်ကြားစာ:
──────────────────
${messageText}
──────────────────

⏰ အချိန်: ${new Date().toLocaleString('en-US', { 
  timeZone: 'Asia/Yangon',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true 
})}
    `;
    
    console.log('Sending report...'); // Debug
    
    // Send to Telegram
    const success = await sendReportToTelegram(reportMessageText);
    
    if (success) {
      alert('✅ ပေးပို့မှု အောင်မြင်ပါသည်။ ကျေးဇူးတင်ပါသည်။');
      closeReportModal();
    } else {
      alert('❌ ပေးပို့ရာတွင် အမှားရှိနေပါသည်။\n\nBot အား Channel ထဲသို့ Admin အဖြစ်ထည့်ထားကြောင်း စစ်ဆေးပါ။');
    }
  } catch (error) {
    console.error('Report Error:', error);
    alert('❌ အမှားရှိနေပါသည်။ နောက်မှ ထပ်ကြိုးစားပါ။');
  } finally {
    // Hide loading
    reportLoading.style.display = 'none';
    reportSubmitBtn.disabled = false;
    reportCancelBtn.disabled = false;
  }
}

// ---------- Event Listeners ----------
// Report buttons in App Detail
document.addEventListener('click', function(e) {
  const reportBtn = e.target.closest('#reportBtn');
  if (!reportBtn) return;
  
  e.preventDefault();
  
  // Get app data from detail screen
  const appName = document.getElementById('detailTitle')?.textContent || 'Unknown';
  const appIcon = document.getElementById('detailIcon')?.src || '';
  
  openReportModal('app', {
    id: appName,
    name: appName,
    icon: appIcon
  });
});

// Report buttons in File Detail
document.addEventListener('click', function(e) {
  const reportBtn = e.target.closest('#fileDetailReportBtn');
  if (!reportBtn) return;
  
  e.preventDefault();
  
  // Get file data from file detail screen
  const fileName = document.getElementById('fileDetailName')?.textContent || 'Unknown';
  const fileIcon = document.getElementById('fileDetailIcon')?.src || '';
  
  openReportModal('file', {
    id: fileName,
    name: fileName,
    icon: fileIcon
  });
});

// Close buttons
if (reportCloseBtn) {
  reportCloseBtn.addEventListener('click', closeReportModal);
}

if (reportCancelBtn) {
  reportCancelBtn.addEventListener('click', closeReportModal);
}

// Submit button
if (reportSubmitBtn) {
  reportSubmitBtn.addEventListener('click', handleReportSubmit);
}

// Click outside to close
window.addEventListener('click', function(e) {
  if (e.target === reportModal) {
    closeReportModal();
  }
});

// Escape key to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && reportModal.classList.contains('show')) {
    closeReportModal();
  }
});

// ---------- Helper Functions ----------
function hideAllScreens() {
  const screens = [
    'detailScreen',
    'topScreen',
    'searchScreen',
    'accScreen',
    'fileScreen',
    'fileDetailScreen'
  ];
  
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  });
  
  document.body.classList.remove('modal-open');
}

// Get app data from hero card
function getAppDataFromCard(card) {
  return {
    type: 'app',
    name: card.dataset.appName || "App",
    icon: card.dataset.appIcon || "",
    bg1: card.dataset.appBg1 || "",
    bg2: card.dataset.appBg2 || "",
    bg3: card.dataset.appBg3 || "",
    download: card.dataset.appDownload || "#",
    size: card.dataset.appSize || "N/A",
    developer: card.dataset.appDeveloper || "Unknown",
    updated: card.dataset.appUpdated || "N/A",
    version: card.dataset.appVersion || "1.0.0",
    description: card.dataset.appDescription || "No description available",
    group: card.dataset.appGroup || "@StarStoreChannel",
    groupUrl: card.dataset.appGroupUrl || "https://t.me/StarStoreChannel"
  };
}

// Get app data from top card
function getAppDataFromTopCard(card) {
  return {
    type: 'app',
    name: card.dataset.appName || "App",
    icon: card.dataset.appIcon || "",
    bg1: card.dataset.appBg || card.dataset.appBg1 || "",
    bg2: card.dataset.appBg2 || card.dataset.appBg || "",
    bg3: card.dataset.appBg3 || card.dataset.appBg || "",
    download: card.dataset.appDownload || "#",
    size: card.dataset.appSize || "N/A",
    developer: card.dataset.appDeveloper || "Unknown",
    updated: card.dataset.appUpdated || "N/A",
    version: card.dataset.appVersion || "1.0.0",
    description: card.dataset.appDescription || "No description available",
    group: card.dataset.appGroup || "@StarStoreChannel",
    groupUrl: card.dataset.appGroupUrl || "https://t.me/StarStoreChannel"
  };
}

// Get file data from file card
function getFileDataFromCard(card) {
  return {
    type: 'file',
    id: card.dataset.fileId || "",
    name: card.dataset.fileName || "File",
    icon: card.dataset.fileIcon || "",
    cover: card.dataset.fileCover || "",
    size: card.dataset.fileSize || "N/A",
    date: card.dataset.fileDate || "N/A",
    download: card.dataset.fileDownload || "#",
    description: card.dataset.fileDescription || "No description available",
    fileId: card.dataset.fileIdNumber || "",
    developer: card.dataset.fileDeveloper || "Unknown",
    group: card.dataset.fileGroup || "@StarStoreChannel",
    groupUrl: card.dataset.fileGroupUrl || "https://t.me/StarStoreChannel"
  };
}

// ---------- openDetail Function ----------
function openDetail(app) {
  console.log("Opening app:", app.name);
  
  // Hide all screens
  hideAllScreens();
  
  // Show detail screen
  const detailScreen = document.getElementById('detailScreen');
  if (!detailScreen) {
    console.error("Detail screen not found!");
    return;
  }
  
  detailScreen.classList.add('show');
  document.body.classList.add('modal-open');
  
  // Set basic info
  setElementSrc('detailIcon', app.icon);
  setElementText('detailTitle', app.name);
  setElementHref('detailDownload', app.download);
  
  // Set description
  setElementText('appDescription', app.description);
  
  // Set info grid
  setElementText('appSize', app.size);
  setElementText('appDeveloper', app.developer);
  setElementText('appUpdated', app.updated);
  setElementText('appVersion', app.version); // Version as ID
  
  // Set Telegram link
  const groupLink = document.getElementById('appGroupLink');
  if (groupLink) {
    groupLink.textContent = app.group;
    groupLink.href = app.groupUrl;
  }
  
  // Create gallery
  createGallery(app);
  
  // Create other apps list
  createOtherAppsList(app.name);
  
  // Scroll to top
  detailScreen.scrollTop = 0;
}

// ---------- openFileDetail Function ----------
function openFileDetail(file) {
  console.log("Opening file:", file.name);
  
  // Hide all screens
  hideAllScreens();
  
  // Show file detail screen
  const fileDetailScreen = document.getElementById('fileDetailScreen');
  if (!fileDetailScreen) {
    console.error("File detail screen not found!");
    return;
  }
  
  fileDetailScreen.style.display = 'flex';
  fileDetailScreen.classList.add('show');
  document.body.classList.add('modal-open');
  
  // Set file details
  setElementText('fileDetailTitle', file.name);
  setElementText('fileDetailName', file.name);
  setElementSrc('fileDetailIcon', file.icon);
  
  const cover = document.getElementById('fileDetailCover');
  if (cover) cover.style.backgroundImage = `url('${file.cover || ''}')`;
  
  setElementText('fileDetailSize', file.size);
  setElementText('fileDetailDate', file.date);
  setElementText('fileDetailId', file.fileId || file.id);
  setElementText('fileDetailDeveloper', file.developer);
  setElementText('fileDetailDescription', file.description);
  
  const groupLink = document.getElementById('fileDetailGroupLink');
  if (groupLink) {
    groupLink.textContent = file.group;
    groupLink.href = file.groupUrl;
  }
  
  const downloadBtn = document.getElementById('fileDetailDownloadBtn');
  if (downloadBtn) {
    downloadBtn.onclick = function(e) {
      e.preventDefault();
      window.open(file.download, '_blank');
    };
  }
  
  // Scroll to top
  fileDetailScreen.scrollTop = 0;
}

// Helper functions
function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '-';
}

function setElementSrc(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src || '';
}

function setElementHref(id, href) {
  const el = document.getElementById(id);
  if (el) el.href = href || '#';
}

// Gallery function
function createGallery(app) {
  const container = document.getElementById('galleryContainer');
  const dotsContainer = document.getElementById('galleryDots');
  
  if (!container || !dotsContainer) return;
  
  container.innerHTML = '';
  dotsContainer.innerHTML = '';
  
  const images = [app.bg1, app.bg2, app.bg3].filter(img => img && img.trim() !== '');
  
  if (images.length === 0) {
    container.innerHTML = '<div class="gallery-image" style="padding:40px;text-align:center;color:#64748b">ပုံမရှိပါ</div>';
    return;
  }
  
  images.forEach((imgUrl, index) => {
    // Create image
    const div = document.createElement('div');
    div.className = 'gallery-image';
    
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = `Screenshot ${index + 1}`;
    img.loading = 'lazy';
    img.onerror = function() {
      this.src = 'https://via.placeholder.com/400x300?text=Image+Error';
    };
    
    div.appendChild(img);
    container.appendChild(div);
    
    // Create dot
    const dot = document.createElement('div');
    dot.className = `gallery-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      container.scrollTo({
        left: div.offsetLeft - 16,
        behavior: 'smooth'
      });
    });
    dotsContainer.appendChild(dot);
  });
  
  // Update active dot on scroll
  container.addEventListener('scroll', () => {
    const scrollLeft = container.scrollLeft;
    const images = container.querySelectorAll('.gallery-image');
    const dots = dotsContainer.querySelectorAll('.gallery-dot');
    
    images.forEach((img, i) => {
      const imgLeft = img.offsetLeft - 16;
      const imgRight = imgLeft + img.offsetWidth;
      
      if (scrollLeft >= imgLeft - 50 && scrollLeft < imgRight - 50) {
        dots.forEach(d => d.classList.remove('active'));
        if (dots[i]) dots[i].classList.add('active');
      }
    });
  });
}

// Other apps function
function createOtherAppsList(currentAppName) {
  const otherList = document.getElementById('otherList');
  if (!otherList) return;
  
  otherList.innerHTML = '';
  
  // Get apps from home screen
  const cards = document.querySelectorAll('.hero-card');
  const others = Array.from(cards).filter(card => 
    card.dataset.appName !== currentAppName
  );
  
  if (others.length === 0) {
    otherList.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b">အခြားအက်ပ်မရှိပါ</div>';
    return;
  }
  
  others.slice(0, 5).forEach(card => {
    const app = getAppDataFromCard(card);
    
    const item = document.createElement('div');
    item.className = 'other-item';
    
    const icon = document.createElement('img');
    icon.className = 'other-icon';
    icon.src = app.icon;
    icon.alt = app.name;
    
    const name = document.createElement('span');
    name.className = 'other-name';
    name.textContent = app.name;
    
    const openBtn = document.createElement('button');
    openBtn.className = 'other-open';
    openBtn.type = 'button';
    openBtn.textContent = 'ဖွင့်ရန်';
    openBtn.addEventListener('click', () => openDetail(app));
    
    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(openBtn);
    otherList.appendChild(item);
  });
}

// Set active nav function
window.setActiveNav = function(activeId) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(activeId);
  if (activeBtn) activeBtn.classList.add('active');
};

// ---------- Search Functions (App Only - File Search ဖြတ်ပြီး) ----------
function renderSearch(query) {
  const q = (query || "").trim().toLowerCase();
  const searchResults = document.getElementById('searchResults');
  if (!searchResults) return;
  
  searchResults.innerHTML = "";

  if (!q) {
    const hint = document.createElement("div");
    hint.className = "search-hint";
    hint.textContent = "ရှာချင်တဲ့ App နာမည် ရိုက်ပါ…";
    searchResults.appendChild(hint);
    return;
  }

  // Get Apps from Home Screen ONLY (File တွေမပါတော့ဘူး)
  const appCards = document.querySelectorAll('.hero-card');
  const apps = Array.from(appCards).map(card => getAppDataFromCard(card));
  
  // Filter apps only
  const matched = apps.filter(app => app.name.toLowerCase().includes(q));

  if (matched.length === 0) {
    const no = document.createElement("div");
    no.className = "no-results";
    no.textContent = "မတွေ့ပါ…";
    searchResults.appendChild(no);
    return;
  }

  // Show Apps only (List view)
  matched.forEach(app => {
    const row = document.createElement("div");
    row.className = "result-item";

    const img = document.createElement("img");
    img.className = "result-icon";
    img.src = app.icon;
    img.alt = app.name;

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = app.name;

    const btn = document.createElement("button");
    btn.className = "result-download";
    btn.type = "button";
    btn.textContent = "Download";
    
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDetail(app);
    });

    row.appendChild(img);
    row.appendChild(name);
    row.appendChild(btn);
    searchResults.appendChild(row);
  });
}

// ---------- Event Listeners ----------
document.addEventListener("DOMContentLoaded", function() {
  
  // Home Screen Downloads
  document.addEventListener("click", function(e) {
    const downloadBtn = e.target.closest(".hero-download");
    if (!downloadBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const card = downloadBtn.closest(".hero-card");
    if (!card) return;
    
    const app = getAppDataFromCard(card);
    openDetail(app);
  });
  
  // Top Screen Downloads
  document.addEventListener("click", function(e) {
    const downloadBtn = e.target.closest(".top-download-modern, .top-download");
    if (!downloadBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const card = downloadBtn.closest(".top-card.modern, .top-card");
    if (!card) return;
    
    const app = getAppDataFromTopCard(card);
    openDetail(app);
  });
  
  // File Card Clicks
  document.addEventListener("click", function(e) {
    const fileCard = e.target.closest(".file-card");
    if (!fileCard) return;
    
    // Don't open if clicking download button
    if (e.target.closest('.file-download')) return;
    
    e.preventDefault();
    const file = getFileDataFromCard(fileCard);
    openFileDetail(file);
  });
  
  // File Download Buttons
  document.addEventListener("click", function(e) {
    const downloadBtn = e.target.closest(".file-download");
    if (!downloadBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const card = downloadBtn.closest(".file-card");
    if (!card) return;
    
    const file = getFileDataFromCard(card);
    openFileDetail(file);
  });
  
  // Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener("input", (e) => renderSearch(e.target.value));
  }
  
  // Search Clear Button
  const searchClear = document.getElementById('searchClear');
  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        renderSearch("");
        searchInput.focus();
      }
    });
  }
  
  // Open Search Screen
  const openSearch = document.getElementById('openSearch');
  const headerSearchInput = document.getElementById('headerSearchInput');
  
  if (openSearch) {
    openSearch.addEventListener("click", openSearchScreen);
  }
  
  if (headerSearchInput) {
    headerSearchInput.addEventListener("click", openSearchScreen);
  }
  
  // Close File Detail
  const fileDetailBack = document.getElementById('fileDetailBack');
  if (fileDetailBack) {
    fileDetailBack.addEventListener('click', function() {
      const fileDetailScreen = document.getElementById('fileDetailScreen');
      if (fileDetailScreen) {
        fileDetailScreen.style.display = 'none';
        fileDetailScreen.classList.remove('show');
      }
    });
  }
});

// Open Search Screen Function
function openSearchScreen() {
  hideAllScreens();
  const searchScreen = document.getElementById('searchScreen');
  if (searchScreen) {
    searchScreen.classList.add("show");
    document.body.classList.add('modal-open');
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = "";
      renderSearch("");
      setTimeout(() => searchInput.focus(), 100);
    }
  }
}

// File Detail Function - data-* attributes ကနေ ပြန်ယူပြသမည်
function openFileDetail(fileCard) {
  // fileCard က element ဖြစ်နိုင်ရင် ဒါမှမဟုတ် fileId ဖြစ်နိုင်ရင်
  let card;
  if (typeof fileCard === 'string') {
    // fileId နဲ့ခေါ်ရင် data-file-id နဲ့ရှာ
    card = document.querySelector(`.file-card[data-file-id="${fileCard}"]`);
  } else {
    card = fileCard.closest('.file-card');
  }
  
  if (!card) return;
  
  // data-* attributes ကနေ အချက်အလက်တွေယူ
  const fileData = {
    id: card.dataset.fileId,
    name: card.dataset.fileName,
    icon: card.dataset.fileIcon,
    cover: card.dataset.fileCover,
    size: card.dataset.fileSize,
    date: card.dataset.fileDate,
    download: card.dataset.fileDownload,
    description: card.dataset.fileDescription,
    fileId: card.dataset.fileIdNumber,
    developer: card.dataset.fileDeveloper,
    group: card.dataset.fileGroup,
    groupUrl: card.dataset.fileGroupUrl
  };
  
  // Detail Screen ကို ဖြည့်မည်
  const detailScreen = document.getElementById('fileDetailScreen');
  const cover = document.getElementById('fileDetailCover');
  const icon = document.getElementById('fileDetailIcon');
  const name = document.getElementById('fileDetailName');
  const title = document.getElementById('fileDetailTitle');
  const size = document.getElementById('fileDetailSize');
  const date = document.getElementById('fileDetailDate');
  const fileId = document.getElementById('fileDetailId');
  const developer = document.getElementById('fileDetailDeveloper');
  const description = document.getElementById('fileDetailDescription');
  const groupLink = document.getElementById('fileDetailGroupLink');
  const downloadBtn = document.getElementById('fileDetailDownloadBtn');
  
  // အချက်အလက်များ ဖြည့်သွင်း
  if (cover) cover.style.backgroundImage = `url('${fileData.cover || ''}')`;
  if (icon) icon.src = fileData.icon || '';
  if (name) name.textContent = fileData.name || 'ဖိုင်အမည်';
  if (title) title.textContent = fileData.name || 'ဖိုင်အသေးစိတ်';
  if (size) size.textContent = fileData.size || '-';
  if (date) date.textContent = fileData.date || '-';
  if (fileId) fileId.textContent = fileData.fileId || '-';
  if (developer) developer.textContent = fileData.developer || '-';
  if (description) description.textContent = fileData.description || 'ဖော်ပြချက် မရှိပါ။';
  
  // Group Link ဖြည့်သွင်း
  if (groupLink) {
    groupLink.textContent = fileData.group || '@StarStoreChannel';
    groupLink.href = fileData.groupUrl || 'https://t.me/StarStoreChannel';
  }
  
  // Download button - နှိပ်ရင် Full Screen ပို့ပေးမည် (လက်ရှိ Screen ထဲမှာပဲ)
  if (downloadBtn) {
    // Remove old event listeners
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    // Add new event listener - ဒီ Screen ထဲမှာပဲ နေမယ်
    newDownloadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // ဘာမှမလုပ်ပါဘူး - ဒီ Screen ထဲမှာပဲ ဆက်နေမယ်
      console.log('Download button clicked - staying in same screen');
    });
  }
  
  // Detail Screen ကိုပြမည်
  detailScreen.style.display = 'flex';
  detailScreen.classList.add('show');
  document.body.classList.add('modal-open');
  
  // Detail Screen ကို အပေါ်ဆုံးကနေ စပြီးပြမည်
  detailScreen.scrollTop = 0;
}

// ===== FILE SCREEN SEARCH SYSTEM (Duplicate မပေါ်အောင်) =====
(function() {
  const fileSearchInput = document.getElementById('fileSearchInput');
  const fileSearchClear = document.getElementById('fileSearchClear');
  const fileGrid = document.getElementById('fileGrid');
  const fileSearchResult = document.getElementById('fileSearchResult');
  const searchFileGrid = document.getElementById('searchFileGrid');
  const fileNoResult = document.getElementById('fileNoResult');

  if (!fileSearchInput) return;

  // Set to track unique file IDs (duplicate မပေါ်အောင်)
  const processedFileIds = new Set();

  // Get all file cards data (unique only)
  function getAllUniqueFileCards() {
    processedFileIds.clear(); // Clear previous data
    
    return Array.from(document.querySelectorAll('.file-card')).filter(card => {
      const fileId = card.dataset.fileId;
      if (processedFileIds.has(fileId)) {
        return false; // Skip duplicate
      }
      processedFileIds.add(fileId);
      return true;
    }).map(card => ({
      element: card,
      id: card.dataset.fileId,
      name: card.dataset.fileName || '',
      icon: card.dataset.fileIcon || '',
      cover: card.dataset.fileCover || '',
      size: card.dataset.fileSize || '',
      date: card.dataset.fileDate || '',
      download: card.dataset.fileDownload || '#',
      description: card.dataset.fileDescription || '',
      fileId: card.dataset.fileIdNumber || '',
      developer: card.dataset.fileDeveloper || '',
      group: card.dataset.fileGroup || '@StarStoreChannel',
      groupUrl: card.dataset.fileGroupUrl || 'https://t.me/StarStoreChannel'
    }));
  }

  // Render search results
  function renderFileSearch(query) {
    const q = (query || '').trim().toLowerCase();
    
    // Show/hide clear button
    if (fileSearchClear) {
      fileSearchClear.style.display = q ? 'block' : 'none';
    }

    if (!q) {
      // Show original grid, hide search result
      if (fileGrid) fileGrid.style.display = 'grid';
      if (fileSearchResult) fileSearchResult.style.display = 'none';
      return;
    }

    // Hide original grid, show search result
    if (fileGrid) fileGrid.style.display = 'none';
    if (fileSearchResult) fileSearchResult.style.display = 'block';

    // Get unique files
    const allFiles = getAllUniqueFileCards();
    
    // Filter files by name only (နာမည်နဲ့တူတဲ့ဟာတွေပဲ)
    const matched = allFiles.filter(file => 
      file.name.toLowerCase().includes(q)
    );

    // Clear previous results
    if (searchFileGrid) searchFileGrid.innerHTML = '';

    if (matched.length === 0) {
      if (fileNoResult) fileNoResult.style.display = 'block';
      return;
    }

    if (fileNoResult) fileNoResult.style.display = 'none';

    // Render matched files (using original elements, not cloning)
    matched.forEach(file => {
      // Use the original element directly
      const card = file.element;
      
      // Remove any existing event listeners by cloning and replacing
      const newCard = card.cloneNode(true);
      
      // Re-attach click event for download button
      const downloadBtn = newCard.querySelector('.file-download');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (typeof window.openFileDetail === 'function') {
            window.openFileDetail(newCard);
          }
        });
      }

      // Card click event
      newCard.addEventListener('click', function(e) {
        if (e.target.closest('.file-download')) return;
        if (typeof window.openFileDetail === 'function') {
          window.openFileDetail(this);
        }
      });

      searchFileGrid.appendChild(newCard);
    });
  }

  // Input event
  fileSearchInput.addEventListener('input', function(e) {
    renderFileSearch(e.target.value);
  });

  // Clear button
  if (fileSearchClear) {
    fileSearchClear.addEventListener('click', function() {
      fileSearchInput.value = '';
      renderFileSearch('');
      fileSearchInput.focus();
    });
  }

  // Clear search when leaving screen
  function clearSearch() {
    fileSearchInput.value = '';
    renderFileSearch('');
  }

  // Listen for file screen show/hide
  const fileScreen = document.getElementById('fileScreen');
  if (fileScreen) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
          if (!fileScreen.classList.contains('show')) {
            clearSearch();
          }
        }
      });
    });
    observer.observe(fileScreen, { attributes: true });
  }
})();

// ===== COMPLETE NAVIGATION SYSTEM =====
(function() {
  // Get all navigation buttons
  const homeBtn = document.getElementById('homeBtn');
  const fileBtn = document.getElementById('fileBtn');
  const topBtn = document.getElementById('topBtn');
  const faqBtn = document.getElementById('faqBtn');
  
  // Get all screens
  const homeScreen = document.querySelector('.content-area');
  const fileScreen = document.getElementById('fileScreen');
  const topScreen = document.getElementById('topScreen');
  const faqScreen = document.getElementById('faqScreen');
  const accScreen = document.getElementById('accScreen');
  const searchScreen = document.getElementById('searchScreen');
  const detailScreen = document.getElementById('detailScreen');
  const fileDetailScreen = document.getElementById('fileDetailScreen');

  // Function to hide all screens
  function hideAllScreens() {
    // Hide main screens
    if (homeScreen) homeScreen.style.display = 'block';
    if (fileScreen) fileScreen.classList.remove('show');
    if (topScreen) topScreen.classList.remove('show');
    if (faqScreen) faqScreen.classList.remove('show');
    if (accScreen) accScreen.classList.remove('show');
    if (searchScreen) searchScreen.classList.remove('show');
    if (detailScreen) detailScreen.classList.remove('show');
    if (fileDetailScreen) {
      fileDetailScreen.style.display = 'none';
      fileDetailScreen.classList.remove('show');
    }
    
    document.body.classList.remove('modal-open');
  }

  // Function to set active nav button
  function setActiveNav(activeId) {
    const navBtns = [homeBtn, fileBtn, topBtn, faqBtn];
    navBtns.forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
  }

  // Function to go to Home
  function goToHome() {
    hideAllScreens();
    if (homeScreen) homeScreen.style.display = 'block';
    setActiveNav('homeBtn');
    
    // Scroll to top
    if (homeScreen) homeScreen.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Function to go to File
  function goToFile() {
    hideAllScreens();
    if (fileScreen) {
      fileScreen.classList.add('show');
      fileScreen.scrollTop = 0;
    }
    setActiveNav('fileBtn');
    document.body.classList.add('modal-open');
  }

  // Function to go to Top
  function goToTop() {
    hideAllScreens();
    if (topScreen) {
      topScreen.classList.add('show');
      topScreen.scrollTop = 0;
    }
    setActiveNav('topBtn');
    document.body.classList.add('modal-open');
  }

  // Function to go to FAQ
  function goToFaq() {
    hideAllScreens();
    if (faqScreen) {
      faqScreen.classList.add('show');
      faqScreen.scrollTop = 0;
    }
    setActiveNav('faqBtn');
    document.body.classList.add('modal-open');
  }

  // Add click event listeners to nav buttons
  if (homeBtn) homeBtn.addEventListener('click', goToHome);
  if (fileBtn) fileBtn.addEventListener('click', goToFile);
  if (topBtn) topBtn.addEventListener('click', goToTop);
  if (faqBtn) faqBtn.addEventListener('click', goToFaq);

  // FAQ Back button functionality
  const faqBackBtn = document.getElementById('faqBackBtn');
  if (faqBackBtn) {
    faqBackBtn.addEventListener('click', function() {
      // Go back to Home (or last screen)
      goToHome();
    });
  }

  // File back button (if exists)
  const fileBackBtn = document.getElementById('fileBackBtn');
  if (fileBackBtn) {
    fileBackBtn.addEventListener('click', goToHome);
  }

  // Top back button (if exists)
  const topBackBtn = document.getElementById('topBackBtn');
  if (topBackBtn) {
    topBackBtn.addEventListener('click', goToHome);
  }

  // Initialize FAQ toggle functionality
  function initFAQToggle() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (question) {
        // Remove existing listeners
        const newQuestion = question.cloneNode(true);
        question.parentNode.replaceChild(newQuestion, question);
        
        newQuestion.addEventListener('click', () => {
          // Close other items
          faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
              otherItem.classList.remove('active');
            }
          });
          
          // Toggle current item
          item.classList.toggle('active');
        });
      }
    });
  }

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', function() {
    initFAQToggle();
    
    // Set Home as active by default
    setActiveNav('homeBtn');
  });

  // Re-initialize FAQ toggle when FAQ screen is shown
  if (faqScreen) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class' && 
            faqScreen.classList.contains('show')) {
          initFAQToggle();
        }
      });
    });
    observer.observe(faqScreen, { attributes: true });
  }

  // Also re-initialize when clicking FAQ button
  if (faqBtn) {
    faqBtn.addEventListener('click', function() {
      setTimeout(initFAQToggle, 100);
    });
  }

  // Make functions globally available
  window.goToHome = goToHome;
  window.goToFile = goToFile;
  window.goToTop = goToTop;
  window.goToFaq = goToFaq;
})();

// ===== S POINT BUTTONS CLICK HANDLERS =====
document.addEventListener('DOMContentLoaded', function() {
  // Buy S Points Button
  const buyBtn = document.getElementById('buySPointBtn');
  if (buyBtn) {
    buyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      alert('မကြာမီလာမည်');
    });
  }

  // Exchange with S Points Button
  const exchangeBtn = document.getElementById('exchangeSPointBtn');
  if (exchangeBtn) {
    exchangeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      alert('မကြာမီလာမည်');
    });
  }

  // Gift Code Button
  const giftBtn = document.getElementById('giftCodeBtn');
  if (giftBtn) {
    giftBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      alert('မကြာမီလာမည်');
    });
  }

  // Earn S Points Button
  const earnBtn = document.getElementById('earnSPointBtn');
  if (earnBtn) {
    earnBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      alert('မကြာမီလာမည်');
    });
  }
});
// Expose functions globally
window.openFileScreen = openFileScreen;
window.openFileDetail = openFileDetail;
window.closeFileDetail = closeFileDetail;
window.closeFileScreen = closeFileScreen;</script>

</script>
