/**
 * SkateList - High-Performance Video Showcase Application
 * Optimized for fast loading and smooth user experience
 */

const SkateApp = (function () {
  "use strict";

  // Configuration
  const CONFIG = {
    API_ENDPOINTS: {
      VIDEOS: "json/videos.json",
      TODO: "json/todo.json",
      GRINDS: "json/grinds.json",
      OTHER: "json/other.json",
    },
    YOUTUBE_BASE_URL: "https://www.youtube.com/embed/",
    CAROUSEL_FEATURED_COUNT: 5,
    OVERLAY_ANIMATION_DURATION: 300,
    DEFAULT_IMAGES: {
      NORMAL: "./images/normal.jpg",
      NOLLIE: "./images/nollie.jpg",
      FAKIE: "./images/fakie.jpg",
      SWITCH: "./images/switch.jpg",
      UNKNOWN: "./images/unknown.jpg",
    },
  };

  // Application state
  let state = {
    allVideos: [],
    todoTricks: [],
    grindsVideos: [],
    otherVideos: [],
    carouselVideos: [],
    currentOverlayVideo: null,
    isLoading: false,
  };

  // Cached DOM elements
  const elements = {};

  // Performance observers
  let intentionallyPlayingVideos = new Set();

  /**
   * Initialize application
   */
  async function init() {
    try {
      state.isLoading = true;
      cacheElements();
      await loadData();
      setupEventListeners();
      renderAll();
      preloadCriticalResources();
    } catch (error) {
      handleError("Failed to initialize application", error);
    } finally {
      state.isLoading = false;
    }
  }

  /**
   * Cache DOM elements for performance
   */
  function cacheElements() {
    const elementIds = [
      "carousel-content",
      "carousel-title",
      "search-bar",
      "flatTricksGrid",
      "grindsGrid",
      "otherGrid",
      "dropdown-done",
      "dropdown-todo",
      "trickDoneTitle",
      "trickTodoTitle",
      "highlightedCarousel",
    ];

    elementIds.forEach((id) => {
      elements[id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] =
        document.getElementById(id);
    });
  }

  /**
   * Load data with enhanced error handling
   */
  async function loadData() {
    try {
      const [videosResponse, todosResponse, grindsResponse, otherResponse] =
        await Promise.all([
          fetch(CONFIG.API_ENDPOINTS.VIDEOS),
          fetch(CONFIG.API_ENDPOINTS.TODO),
          fetch(CONFIG.API_ENDPOINTS.GRINDS),
          fetch(CONFIG.API_ENDPOINTS.OTHER),
        ]);

      if (
        !videosResponse.ok ||
        !todosResponse.ok ||
        !grindsResponse.ok ||
        !otherResponse.ok
      ) {
        throw new Error("Failed to fetch data from server");
      }

      const [videos, todos, grinds, other] = await Promise.all([
        videosResponse.json(),
        todosResponse.json(),
        grindsResponse.json(),
        otherResponse.json(),
      ]);

      if (
        !Array.isArray(videos) ||
        !Array.isArray(todos) ||
        !Array.isArray(grinds) ||
        !Array.isArray(other)
      ) {
        throw new Error("Invalid data format received");
      }

      state.allVideos = videos;
      state.todoTricks = todos;
      state.grindsVideos = grinds;
      state.otherVideos = other;
    } catch (error) {
      throw new Error(`Data loading failed: ${error.message}`);
    }
  }

  /**
   * Setup optimized event listeners
   */
  function setupEventListeners() {
    if (elements.searchBar) {
      elements.searchBar.addEventListener("keyup", debounce(handleSearch, 250));
    }

    setupCarouselControls();
    setupVideoOverlay();

    // Cleanup on page unload
    window.addEventListener("beforeunload", cleanup);

    // Handle visibility changes to pause videos when tab is hidden
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  /**
   * Handle tab visibility changes for performance
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      stopAllVideosExcept();
    }
  }

  /**
   * Render all components with performance optimizations
   */
  function renderAll() {
    renderCarousel();
    renderTabs();
    renderNavigationDropdowns();
  }

  /**
   * Render carousel
   */
  function renderCarousel() {
    if (!elements.carouselContent) return;

    const featuredVideos = state.allVideos
      .filter((video) => video.path && video.path.trim() !== "")
      .slice(0, CONFIG.CAROUSEL_FEATURED_COUNT);

    state.carouselVideos = featuredVideos;

    if (featuredVideos.length === 0) {
      elements.carouselContent.innerHTML = createEmptyStateHTML(
        "No featured videos available"
      );
      return;
    }

    const carouselHTML = featuredVideos
      .map((video, index) => createCarouselItemHTML(video, index === 0))
      .join("");

    elements.carouselContent.innerHTML = carouselHTML;
    updateCarouselTitle(0);
  }

  /**
   * Create carousel item HTML
   */
  function createCarouselItemHTML(video, isActive) {
    const activeClass = isActive ? "active" : "";

    return `
      <div class="carousel-item ${activeClass}" data-video-title="${escapeHtml(
      video.title
    )}" data-video-id="${video.path}">
        ${createCarouselVideoHTML(video)}
      </div>
    `;
  }

  /**
   * Create video element HTML for carousel
   */
  function createCarouselVideoHTML(video) {
    if (!video.path || video.path.trim() === "") {
      return createImageHTML(video);
    }

    return `
      <iframe
        src="${CONFIG.YOUTUBE_BASE_URL}${video.path}?enablejsapi=1&rel=0&modestbranding=1"
        allowfullscreen
        frameborder="0"
        loading="lazy"
        id="youtube-${video.path}"
        style="width: 100%; height: 100%;"
      ></iframe>
    `;
  }

  /**
   * Create static image HTML for videos without paths
   */
  function createImageHTML(video) {
    return `
      <div class="card-img-wrapper">
        <img src="${getImageForTrickType(
          video.types[0]
        )}" class="card-img-top" alt="${escapeHtml(video.title)}">
      </div>
    `;
  }

  /**
   * Render tabs
   */
  function renderTabs() {
    const categorizedVideos = categorizeVideos(state.allVideos);

    renderGridOptimized(elements.flatTricksGrid, categorizedVideos.flatTricks);
    renderGridOptimized(elements.grindsGrid, categorizedVideos.grinds);
    renderGridOptimized(elements.otherGrid, categorizedVideos.other);
  }

  /**
   * Categorize videos
   */
  function categorizeVideos(videos) {
    const categories = { flatTricks: [], grinds: [], other: [] };

    // For flat tricks, filter from the main videos array
    if (videos === state.allVideos) {
      videos.forEach((video) => {
        const hasFlipTrick = video.types.some(
          (type) =>
            ["FLIPTRICK", "ROTATION", "PIVOT"].includes(type) ||
            (video.types.length === 1 &&
              ["NORMAL", "NOLLIE", "FAKIE", "SWITCH"].includes(type))
        );

        if (hasFlipTrick) {
          categories.flatTricks.push(video);
        }
      });

      // Use separate JSON data for grinds and other
      categories.grinds = [...state.grindsVideos];
      categories.other = [...state.otherVideos];
    } else {
      // For search results, categorize as before but include all video types
      videos.forEach((video) => {
        const hasFlipTrick = video.types.some(
          (type) =>
            ["FLIPTRICK", "ROTATION", "PIVOT"].includes(type) ||
            (video.types.length === 1 &&
              ["NORMAL", "NOLLIE", "FAKIE", "SWITCH"].includes(type))
        );

        if (hasFlipTrick) {
          categories.flatTricks.push(video);
        } else if (video.types.includes("GRIND")) {
          categories.grinds.push(video);
        } else {
          categories.other.push(video);
        }
      });
    }

    // Sort each category: videos with paths first, then videos without paths
    const sortVideos = (videoArray) => {
      return videoArray.sort((a, b) => {
        const aHasVideo = a.path && a.path.trim() !== "";
        const bHasVideo = b.path && b.path.trim() !== "";

        if (aHasVideo && !bHasVideo) return -1;
        if (!aHasVideo && bHasVideo) return 1;
        return 0;
      });
    };

    categories.flatTricks = sortVideos(categories.flatTricks);
    categories.grinds = sortVideos(categories.grinds);
    categories.other = sortVideos(categories.other);

    return categories;
  }

  /**
   * Render grid with document fragments
   */
  function renderGridOptimized(gridElement, videos) {
    if (!gridElement) return;

    if (videos.length === 0) {
      gridElement.innerHTML = createEmptyStateHTML(
        "No tricks in this category yet"
      );
      return;
    }

    const fragment = document.createDocumentFragment();

    videos.forEach((video) => {
      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = createVideoCardHTML(video);
      fragment.appendChild(col);
    });

    gridElement.innerHTML = "";
    gridElement.appendChild(fragment);

    const videoCards = gridElement.querySelectorAll(
      ".card[data-has-video='true']"
    );
    videoCards.forEach((card) => {
      const videoId = card.dataset.videoId;
      // Search in all video arrays
      const allCombinedVideos = [
        ...state.allVideos,
        ...state.grindsVideos,
        ...state.otherVideos,
      ];
      const video = allCombinedVideos.find((v) => v.path === videoId);
      if (video) {
        setupVideoPreview(card, video);
      }
    });
  }

  /**
   * Create video card HTML
   */
  function createVideoCardHTML(video) {
    const hasVideo = video.path && video.path.trim() !== "";

    return `
      <div class="card video-card h-100" data-video-id="${video.path}" ${
      hasVideo ? 'data-has-video="true"' : ""
    }>
        ${hasVideo ? createVideoIframeHTML(video) : createImageHTML(video)}
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(video.title)}</h5>
          <p class="card-text">${createVideoDescription(video)}</p>
        </div>
      </div>
    `;
  }

  /**
   * Create video iframe HTML directly
   */
  function createVideoIframeHTML(video) {
    if (!video.path || video.path.trim() === "") {
      return createImageHTML(video);
    }

    return `
      <iframe
        src="${CONFIG.YOUTUBE_BASE_URL}${video.path}?enablejsapi=1&rel=0&modestbranding=1"
        allowfullscreen
        frameborder="0"
        loading="lazy"
        id="youtube-${video.path}"
        style="width: 100%; height: 250px;"
      ></iframe>
    `;
  }

  /**
   * Create video description
   */
  function createVideoDescription(video) {
    const types = video.types.join(", ");
    const dateInfo = video.dateAndPlace?.[0];
    return dateInfo ? `${types} - ${dateInfo.date}` : types;
  }

  /**
   * Get image for trick type
   */
  function getImageForTrickType(type) {
    return CONFIG.DEFAULT_IMAGES[type] || CONFIG.DEFAULT_IMAGES.UNKNOWN;
  }

  /**
   * Setup video preview with enhanced click handling
   */
  function setupVideoPreview(cardElement, video) {
    const iframe = cardElement.querySelector("iframe");
    if (!iframe || !video.path) return;

    let isPlaying = false;

    const handleDoubleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      isPlaying = !isPlaying;

      if (isPlaying) {
        // Stop only the videos that are currently playing
        stopAllVideosExcept(video.path);

        // Short delay to ensure other videos are stopped
        setTimeout(() => {
          intentionallyPlayingVideos.add(video.path);
          iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${video.path}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`;
          cardElement.classList.add("video-playing");
        }, 50);
      } else {
        intentionallyPlayingVideos.delete(video.path);
        iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${video.path}?enablejsapi=1&rel=0&modestbranding=1`;
        cardElement.classList.remove("video-playing");
      }
    };

    const handleClick = (e) => {
      if (e.detail === 1) {
        setTimeout(() => {
          if (e.detail === 1) {
            openVideoOverlay(video);
          }
        }, 200);
      }
    };

    cardElement.addEventListener("dblclick", handleDoubleClick);
    cardElement.addEventListener("click", handleClick);
  }

  /**
   * Render navigation dropdowns
   */
  function renderNavigationDropdowns() {
    const videosWithPath = [];
    const videosWithoutPath = [];

    // Combine all videos from all JSON files
    const allCombinedVideos = [
      ...state.allVideos,
      ...state.grindsVideos,
      ...state.otherVideos,
    ];

    allCombinedVideos.forEach((video) => {
      if (video.path && video.path.trim() !== "") {
        videosWithPath.push(video);
      } else {
        videosWithoutPath.push(video);
      }
    });

    renderDropdown(elements.dropdownDone, videosWithPath);
    renderDropdown(elements.dropdownTodo, videosWithoutPath);

    if (elements.trickDoneTitle) {
      elements.trickDoneTitle.textContent = `Tricks Done (${videosWithPath.length})`;
    }
    if (elements.trickTodoTitle) {
      elements.trickTodoTitle.textContent = `Tricks Todo (${videosWithoutPath.length})`;
    }
  }

  /**
   * Render dropdown with document fragment
   */
  function renderDropdown(dropdownElement, videos) {
    if (!dropdownElement) return;

    const fragment = document.createDocumentFragment();

    videos.forEach((video) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.className = "dropdown-item";
      button.textContent = video.title;
      button.addEventListener("click", () => {
        openVideoOverlay(video);
        scrollToVideoCard(video);
      });
      li.appendChild(button);
      fragment.appendChild(li);
    });

    dropdownElement.innerHTML = "";
    dropdownElement.appendChild(fragment);
  }

  /**
   * Scroll to and highlight video card
   */
  function scrollToVideoCard(video) {
    const videoCard = document.querySelector(`[data-video-id="${video.path}"]`);
    if (!videoCard) return;

    const tabContent = videoCard.closest(".tab-pane");
    if (!tabContent) return;

    const tabId = tabContent.id;
    const tabButton = document.querySelector(`[data-bs-target="#${tabId}"]`);
    if (tabButton && !tabButton.classList.contains("active")) {
      const tab = new bootstrap.Tab(tabButton);
      tab.show();
    }

    setTimeout(() => {
      videoCard.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      videoCard.classList.add("highlighted");
      setTimeout(() => {
        videoCard.classList.remove("highlighted");
      }, 3000);
    }, 150);
  }

  /**
   * Close sidebar menu - Enhanced for mobile reliability
   */
  function closeSidebar() {
    const offcanvasElement = document.getElementById("offcanvasDarkNavbar");
    if (!offcanvasElement) return;

    try {
      // Try to get existing Bootstrap offcanvas instance
      let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);

      // If no instance exists, create one
      if (!offcanvas) {
        offcanvas = new bootstrap.Offcanvas(offcanvasElement);
      }

      // Hide the offcanvas
      if (offcanvas) {
        offcanvas.hide();
      }
    } catch (error) {
      // Fallback: manually remove Bootstrap classes if JavaScript API fails
      console.warn("Bootstrap offcanvas API failed, using fallback:", error);
      offcanvasElement.classList.remove("show");

      // Remove backdrop if it exists
      const backdrop = document.querySelector(".offcanvas-backdrop");
      if (backdrop) {
        backdrop.remove();
      }

      // Re-enable body scrolling
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }

  /**
   * Search handler
   */
  function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();

    if (query === "") {
      renderTabs();
      return;
    }

    // Combine all videos for search
    const allVideosForSearch = [
      ...state.allVideos,
      ...state.grindsVideos,
      ...state.otherVideos,
    ];

    const filteredVideos = allVideosForSearch.filter(
      (video) =>
        video.title.toLowerCase().includes(query) ||
        video.types.some((type) => type.toLowerCase().includes(query))
    );

    const categorizedVideos = categorizeVideos(filteredVideos);
    renderGridOptimized(elements.flatTricksGrid, categorizedVideos.flatTricks);
    renderGridOptimized(elements.grindsGrid, categorizedVideos.grinds);
    renderGridOptimized(elements.otherGrid, categorizedVideos.other);
  }

  /**
   * Setup carousel controls
   */
  function setupCarouselControls() {
    if (!elements.highlightedCarousel) return;

    elements.highlightedCarousel.addEventListener(
      "slide.bs.carousel",
      (event) => {
        // Stop only playing videos when carousel slides change
        stopAllVideosExcept();
        updateCarouselTitle(event.to);
      }
    );

    elements.highlightedCarousel.addEventListener("slid.bs.carousel", () => {
      // Additional cleanup after slide transition
      stopAllVideosExcept();
    });
  }

  /**
   * Update carousel title
   */
  function updateCarouselTitle(activeIndex) {
    if (!elements.carouselTitle || !state.carouselVideos[activeIndex]) return;

    const newTitle = state.carouselVideos[activeIndex].title;

    elements.carouselTitle.style.opacity = "0";
    elements.carouselTitle.style.transform = "translateY(-10px)";

    setTimeout(() => {
      elements.carouselTitle.textContent = newTitle;
      elements.carouselTitle.style.opacity = "1";
      elements.carouselTitle.style.transform = "translateY(0)";
    }, 150);
  }

  /**
   * Setup video overlay
   */
  function setupVideoOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "video-overlay";
    overlay.innerHTML = `
      <div class="video-overlay-content">
        <button class="video-overlay-close" aria-label="Close video">&times;</button>
        <div class="video-overlay-video-container"></div>
        <div class="video-overlay-info">
          <h3></h3>
          <p></p>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeVideoOverlay();
    });

    overlay
      .querySelector(".video-overlay-close")
      .addEventListener("click", closeVideoOverlay);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        closeVideoOverlay();
      }
    });
  }

  /**
   * Open video overlay
   */
  function openVideoOverlay(video) {
    console.log("Opening video overlay for:", video.title, video.path);

    const overlay = document.querySelector(".video-overlay");
    const container = overlay.querySelector(".video-overlay-video-container");
    const info = overlay.querySelector(".video-overlay-info");

    state.currentOverlayVideo = video;

    info.querySelector("h3").textContent = video.title;
    info.querySelector("p").textContent = createVideoDescription(video);

    container.innerHTML = "";

    if (video.path && video.path.trim() !== "") {
      // Stop only the videos that are currently playing
      stopAllVideosExcept(video.path);

      // Short delay to ensure videos are stopped
      setTimeout(() => {
        console.log("Creating overlay iframe for:", video.path);
        const iframe = document.createElement("iframe");
        iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${video.path}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1`;
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "autoplay; encrypted-media");
        iframe.setAttribute("id", `overlay-youtube-${video.path}`);
        iframe.style.width = "100%";
        iframe.style.height = "100%";

        container.appendChild(iframe);
        console.log("Overlay iframe created and added");
      }, 50);
    } else {
      // Even for videos without paths, stop playing videos
      stopAllVideosExcept();
      container.innerHTML = createPlaceholderHTML(video);
    }

    // Always close sidebar when opening video overlay to prevent blocking on mobile
    closeSidebar();

    overlay.classList.add("active");
    document.body.classList.add("video-overlay-active");
  }

  /**
   * Create placeholder HTML for overlay
   */
  function createPlaceholderHTML(video) {
    return `
      <div class="video-placeholder">
        <img src="${getImageForTrickType(video.types[0])}" alt="${escapeHtml(
      video.title
    )}" class="placeholder-image">
        <div class="placeholder-text">
          <h3>${escapeHtml(video.title)}</h3>
          <p>Video coming soon!</p>
        </div>
      </div>
    `;
  }

  /**
   * Close video overlay
   */
  function closeVideoOverlay() {
    const overlay = document.querySelector(".video-overlay");
    if (!overlay) return;

    if (state.currentOverlayVideo?.path) {
      const iframe = document.getElementById(
        `overlay-youtube-${state.currentOverlayVideo.path}`
      );
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"stopVideo","args":""}',
            "*"
          );
        } catch (error) {
          console.warn("Failed to stop overlay video:", error);
        }
      }
    }

    overlay.classList.remove("active");
    document.body.classList.remove("video-overlay-active");
    state.currentOverlayVideo = null;

    setTimeout(() => {
      const container = overlay.querySelector(".video-overlay-video-container");
      if (container) container.innerHTML = "";
    }, CONFIG.OVERLAY_ANIMATION_DURATION);
  }

  /**
   * Stop all videos except the specified one (based on working pauseAllVideos)
   */
  function stopAllVideosExcept(excludeVideoId = null) {
    console.log("Stopping all videos except:", excludeVideoId);

    // Get all video iframes (both regular and overlay)
    const iframes = document.querySelectorAll(
      'iframe[id^="youtube-"], iframe[id^="overlay-youtube-"]'
    );

    iframes.forEach((iframe) => {
      const videoId = iframe.id
        .replace("youtube-", "")
        .replace("overlay-youtube-", "");

      // Skip the video we want to keep playing
      if (excludeVideoId && videoId === excludeVideoId) {
        console.log("Skipping excluded video:", videoId);
        return;
      }

      try {
        // Send both pause and stop commands for better reliability
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*"
        );
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"stopVideo","args":""}',
          "*"
        );

        // Reset iframe src to remove autoplay and reset to beginning
        const baseUrl = `${CONFIG.YOUTUBE_BASE_URL}${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
        if (iframe.src.includes("autoplay=1")) {
          iframe.src = baseUrl;
          console.log("Reset iframe src for:", videoId);
        }
      } catch (error) {
        console.warn("Failed to stop video:", videoId, error);
      }
    });

    // Reset all video cards to non-playing state (except excluded)
    const videoCards = document.querySelectorAll(".video-card");
    videoCards.forEach((card) => {
      if (!excludeVideoId || card.dataset.videoId !== excludeVideoId) {
        card.classList.remove("video-playing");
      }
    });

    // Update intentionally playing videos
    if (excludeVideoId) {
      const wasIntentional = intentionallyPlayingVideos.has(excludeVideoId);
      intentionallyPlayingVideos.clear();
      if (wasIntentional) {
        intentionallyPlayingVideos.add(excludeVideoId);
      }
    } else {
      intentionallyPlayingVideos.clear();
    }

    console.log(
      "Videos stopped. Remaining intentionally playing:",
      Array.from(intentionallyPlayingVideos)
    );
  }

  /**
   * Preload critical resources
   */
  function preloadCriticalResources() {
    Object.values(CONFIG.DEFAULT_IMAGES).forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * Create empty state HTML
   */
  function createEmptyStateHTML(message) {
    return `
      <div class="empty-state">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * XSS protection
   */
  function escapeHtml(text) {
    if (typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Error handling
   */
  function handleError(message, error) {
    console.error(`SkateApp Error: ${message}`, error);

    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = "Something went wrong. Please refresh the page.";
    document.body.insertBefore(errorDiv, document.body.firstChild);

    setTimeout(() => errorDiv.remove(), 5000);
  }

  /**
   * Cleanup for memory management
   */
  function cleanup() {
    intentionallyPlayingVideos.clear();
    stopAllVideosExcept();
  }

  // Public API
  return { init };
})();

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", SkateApp.init);
} else {
  SkateApp.init();
}
