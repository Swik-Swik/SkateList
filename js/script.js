/**
 * SkateList - Video Showcase Application
 * A modern, maintainable JavaScript application for displaying skateboard trick videos
 */

// Application namespace to avoid global pollution
const SkateApp = (function () {
  "use strict";

  // Configuration constants
  const CONFIG = {
    API_ENDPOINTS: {
      VIDEOS: "json/videos.json",
      TODO: "json/todo.json",
    },
    YOUTUBE_BASE_URL: "https://www.youtube.com/embed/",
    CAROUSEL_FEATURED_COUNT: 5,
    VIDEO_PREVIEW_DELAY: 700,
    VIDEO_PREVIEW_STOP_DELAY: 100,
    OVERLAY_ANIMATION_DURATION: 400,
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
    carouselVideos: [],
    currentOverlayVideo: null,
    isLoading: false,
  };

  // Cache DOM elements
  const elements = {};

  /**
   * Initialize the application
   */
  async function init() {
    try {
      state.isLoading = true;
      cacheElements();
      await loadData();
      setupEventListeners();
      renderAll();
    } catch (error) {
      handleError("Failed to initialize application", error);
    } finally {
      state.isLoading = false;
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  function cacheElements() {
    elements.carouselContent = document.getElementById("carousel-content");
    elements.carouselTitle = document.getElementById("carousel-title");
    elements.searchBar = document.getElementById("search-bar");
    elements.flatTricksGrid = document.getElementById("flatTricksGrid");
    elements.grindsGrid = document.getElementById("grindsGrid");
    elements.otherGrid = document.getElementById("otherGrid");
    elements.dropdownDone = document.getElementById("dropdown-done");
    elements.dropdownTodo = document.getElementById("dropdown-todo");
    elements.trickDoneTitle = document.getElementById("trickDoneTitle");
    elements.trickTodoTitle = document.getElementById("trickTodoTitle");
    elements.carousel = document.getElementById("highlightedCarousel");
  }

  /**
   * Load data from JSON files with proper error handling
   */
  async function loadData() {
    try {
      const [videosResponse, todosResponse] = await Promise.all([
        fetch(CONFIG.API_ENDPOINTS.VIDEOS),
        fetch(CONFIG.API_ENDPOINTS.TODO),
      ]);

      if (!videosResponse.ok || !todosResponse.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const [videos, todos] = await Promise.all([
        videosResponse.json(),
        todosResponse.json(),
      ]);

      // Validate data structure
      if (!Array.isArray(videos) || !Array.isArray(todos)) {
        throw new Error("Invalid data format received");
      }

      state.allVideos = videos;
      state.todoTricks = todos;
    } catch (error) {
      throw new Error(`Data loading failed: ${error.message}`);
    }
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Search functionality
    if (elements.searchBar) {
      elements.searchBar.addEventListener("keyup", debounce(handleSearch, 300));
    }

    // Carousel controls
    setupCarouselControls();

    // Video overlay
    setupVideoOverlay();

    // Cleanup on page unload
    window.addEventListener("beforeunload", cleanup);
  }

  /**
   * Render all components
   */
  function renderAll() {
    renderCarousel();
    renderTabs();
    renderNavigationDropdowns();
  }

  /**
   * Render carousel with featured videos
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
    const videoElement = createVideoElementHTML(video);

    return `
      <div class="carousel-item ${activeClass}" data-video-title="${escapeHtml(
      video.title
    )}">
        ${videoElement}
      </div>
    `;
  }

  /**
   * Render tabs content
   */
  function renderTabs() {
    const categorizedVideos = categorizeVideos(state.allVideos);

    renderGrid(elements.flatTricksGrid, categorizedVideos.flatTricks);
    renderGrid(elements.grindsGrid, categorizedVideos.grinds);
    renderGrid(elements.otherGrid, categorizedVideos.other);
  }

  /**
   * Categorize videos by type
   */
  function categorizeVideos(videos) {
    const flatTricks = videos.filter((video) =>
      video.types.some(
        (type) =>
          ["FLIPTRICK", "ROTATION", "PIVOT"].includes(type) ||
          (video.types.length === 1 &&
            ["NORMAL", "NOLLIE", "FAKIE", "SWITCH"].includes(type))
      )
    );

    const grinds = videos.filter((video) =>
      video.types.some((type) => type.toLowerCase().includes("grind"))
    );

    const other = videos.filter(
      (video) => !flatTricks.includes(video) && !grinds.includes(video)
    );

    return { flatTricks, grinds, other };
  }

  /**
   * Render grid with videos
   */
  function renderGrid(gridElement, videos) {
    if (!gridElement) return;

    if (videos.length === 0) {
      gridElement.innerHTML = createEmptyStateHTML(
        "No tricks in this category yet"
      );
      return;
    }

    // Sort videos: ones with paths first
    const sortedVideos = [...videos].sort((a, b) => {
      if (a.path && !b.path) return -1;
      if (!a.path && b.path) return 1;
      return 0;
    });

    const gridHTML = sortedVideos
      .map((video) => createVideoCardHTML(video))
      .join("");

    gridElement.innerHTML = gridHTML;

    // Setup event listeners for cards
    setupVideoCardListeners(gridElement);
  }

  /**
   * Create video card HTML
   */
  function createVideoCardHTML(video) {
    const hasVideo = video.path && video.path.trim() !== "";
    const cardClass = hasVideo ? "card h-100 video-card" : "card h-100";
    const mediaElement = createVideoElementHTML(video);

    return `
      <div class="col" id="${escapeHtml(video.title)}">
        <div class="${cardClass}" 
             data-video-title="${escapeHtml(video.title)}"
             data-video-path="${escapeHtml(video.path || "")}"
             data-video-types="${escapeHtml(video.types.join(", "))}">
          ${mediaElement}
          <div class="card-body">
            <h5 class="card-title">${escapeHtml(video.title)}</h5>
            <p class="card-text">${escapeHtml(video.types.join(", "))}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create video element HTML (iframe or image)
   */
  function createVideoElementHTML(video) {
    if (video.path && video.path.trim() !== "") {
      const youtubeId = escapeHtml(video.path);
      return `
        <iframe 
          src="${CONFIG.YOUTUBE_BASE_URL}${youtubeId}?mute=1&controls=0&loop=0&vd=hd1080&enablejsapi=1&rel=0&modestbranding=1"
          allowfullscreen
          frameborder="0"
          id="youtube-${youtubeId}"
          loading="lazy">
        </iframe>
      `;
    } else {
      const imageUrl = getImageForTrickType(video.types[0]);
      return `
        <div class="card-img-wrapper">
          <img class="card-img-top" 
               src="${imageUrl}" 
               alt="${escapeHtml(video.title)}"
               loading="lazy">
        </div>
      `;
    }
  }

  /**
   * Get image URL for trick type
   */
  function getImageForTrickType(type) {
    return CONFIG.DEFAULT_IMAGES[type] || CONFIG.DEFAULT_IMAGES.UNKNOWN;
  }

  /**
   * Setup video card event listeners
   */
  function setupVideoCardListeners(gridElement) {
    const cards = gridElement.querySelectorAll(".card");

    cards.forEach((card) => {
      const videoTitle = card.dataset.videoTitle;
      const video = state.allVideos.find((v) => v.title === videoTitle);

      if (video) {
        // Click handler for overlay
        card.addEventListener("click", (e) => {
          e.stopPropagation();
          openVideoOverlay(video);
        });

        // Hover preview for video cards
        if (video.path && video.path.trim() !== "") {
          setupVideoPreview(card, video);
        }
      }
    });
  }

  /**
   * Setup video preview on hover
   */
  function setupVideoPreview(cardElement, video) {
    const iframe = cardElement.querySelector("iframe");
    if (!iframe) return;

    let hoverTimeout, leaveTimeout;
    let isHovered = false,
      isPlaying = false;

    const handleMouseEnter = () => {
      isHovered = true;
      clearTimeout(leaveTimeout);

      hoverTimeout = setTimeout(() => {
        if (isHovered && !isPlaying) {
          startVideoPreview(iframe, video);
          isPlaying = true;
        }
      }, CONFIG.VIDEO_PREVIEW_DELAY);
    };

    const handleMouseLeave = () => {
      isHovered = false;
      clearTimeout(hoverTimeout);

      leaveTimeout = setTimeout(() => {
        if (!isHovered && isPlaying) {
          stopVideoPreview(iframe, video);
          isPlaying = false;
        }
      }, CONFIG.VIDEO_PREVIEW_STOP_DELAY);
    };

    cardElement.addEventListener("mouseenter", handleMouseEnter);
    cardElement.addEventListener("mouseleave", handleMouseLeave);

    // Store cleanup functions for later removal
    cardElement._cleanup = () => {
      cardElement.removeEventListener("mouseenter", handleMouseEnter);
      cardElement.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(hoverTimeout);
      clearTimeout(leaveTimeout);
    };
  }

  /**
   * Start video preview
   */
  function startVideoPreview(iframe, video) {
    if (!iframe || !video.path) return;

    try {
      const params = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        controls: "0",
        loop: "1",
        vd: "hd1080",
        enablejsapi: "1",
        rel: "0",
        modestbranding: "1",
        start: "0",
      });

      iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${
        video.path
      }?${params.toString()}`;
    } catch (error) {
      console.warn("Could not start video preview:", error);
    }
  }

  /**
   * Stop video preview
   */
  function stopVideoPreview(iframe, video) {
    if (!iframe || !video.path) return;

    try {
      const params = new URLSearchParams({
        mute: "1",
        controls: "0",
        loop: "0",
        vd: "hd1080",
        enablejsapi: "1",
        rel: "0",
        modestbranding: "1",
      });

      iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${
        video.path
      }?${params.toString()}`;
    } catch (error) {
      console.warn("Could not stop video preview:", error);
    }
  }

  /**
   * Render navigation dropdowns
   */
  function renderNavigationDropdowns() {
    // Tricks done dropdown
    if (elements.dropdownDone && elements.trickDoneTitle) {
      const doneItemsHTML = state.allVideos
        .map(
          (video) => `
          <li>
            <a class="dropdown-item" href="#${escapeHtml(video.title)}">
              ${escapeHtml(video.title)}
            </a>
          </li>
        `
        )
        .join("");

      elements.dropdownDone.innerHTML = doneItemsHTML;
      elements.trickDoneTitle.textContent = `Tricks Done (${state.allVideos.length})`;
    }

    // Tricks todo dropdown
    if (elements.dropdownTodo && elements.trickTodoTitle) {
      const todoItemsHTML = state.todoTricks
        .map(
          (trick) => `
          <li>
            <a class="dropdown-item" href="#">
              ${escapeHtml(trick.name)}
            </a>
          </li>
        `
        )
        .join("");

      elements.dropdownTodo.innerHTML = todoItemsHTML;
      elements.trickTodoTitle.textContent = `Tricks Todo (${state.todoTricks.length})`;
    }
  }

  /**
   * Handle search functionality
   */
  function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const grids = [
      elements.flatTricksGrid,
      elements.grindsGrid,
      elements.otherGrid,
    ];

    grids.forEach((grid) => {
      if (!grid) return;

      const containers = grid.querySelectorAll(".col");

      containers.forEach((container) => {
        const titleElement = container.querySelector(".card-title");
        const typesElement = container.querySelector(".card-text");

        if (titleElement && typesElement) {
          const title = titleElement.textContent.toLowerCase();
          const types = typesElement.textContent.toLowerCase();
          const isMatch = title.includes(query) || types.includes(query);

          container.style.display = isMatch ? "block" : "none";
        }
      });
    });
  }

  /**
   * Setup carousel controls
   */
  function setupCarouselControls() {
    if (!elements.carousel) return;

    const pauseAllVideos = () => {
      const iframes = elements.carousel.querySelectorAll(
        'iframe[id^="youtube-"]'
      );
      iframes.forEach((iframe) => {
        try {
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"pauseVideo","args":""}',
            "*"
          );
        } catch (error) {
          console.warn("Could not pause video:", error);
        }
      });
    };

    const stopAllVideos = () => {
      const iframes = elements.carousel.querySelectorAll(
        'iframe[id^="youtube-"]'
      );
      iframes.forEach((iframe) => {
        try {
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"stopVideo","args":""}',
            "*"
          );
        } catch (error) {
          console.warn("Could not stop video:", error);
        }
      });
    };

    elements.carousel.addEventListener("slide.bs.carousel", (event) => {
      pauseAllVideos();
      if (elements.carouselTitle) {
        elements.carouselTitle.classList.add("title-changing");
      }
    });

    elements.carousel.addEventListener("slid.bs.carousel", (event) => {
      stopAllVideos();
      const activeIndex = Array.from(
        event.target.querySelectorAll(".carousel-item")
      ).indexOf(event.relatedTarget);
      updateCarouselTitle(activeIndex);
    });
  }

  /**
   * Update carousel title with animation
   */
  function updateCarouselTitle(activeIndex) {
    if (!elements.carouselTitle || !state.carouselVideos[activeIndex]) return;

    const newTitle = state.carouselVideos[activeIndex].title;

    if (elements.carouselTitle.classList.contains("title-changing")) {
      setTimeout(() => {
        elements.carouselTitle.textContent = newTitle;
        elements.carouselTitle.classList.remove("title-changing");
        elements.carouselTitle.classList.add("title-changed");

        setTimeout(() => {
          elements.carouselTitle.classList.remove("title-changed");
        }, 300);
      }, 150);
    } else {
      elements.carouselTitle.textContent = newTitle;
    }
  }

  /**
   * Setup video overlay functionality
   */
  function setupVideoOverlay() {
    const overlayHTML = `
    <div class="video-overlay" id="videoOverlay">
      <div class="video-overlay-content">
          <div class="video-overlay-close" id="overlayClose" aria-label="Close video overlay">&times;</div>
        <div class="video-overlay-video-container" id="overlayVideoContainer"></div>
        <div class="video-overlay-info" id="overlayInfo">
          <h3 id="overlayTitle"></h3>
          <p id="overlayTypes"></p>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML("beforeend", overlayHTML);

    const overlay = document.getElementById("videoOverlay");
    const closeBtn = document.getElementById("overlayClose");

    if (closeBtn) {
      closeBtn.addEventListener("click", closeVideoOverlay);
    }

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closeVideoOverlay();
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        overlay &&
        overlay.classList.contains("active")
      ) {
        closeVideoOverlay();
      }
    });
  }

  /**
   * Open video overlay
   */
  function openVideoOverlay(video) {
    const overlay = document.getElementById("videoOverlay");
    const container = document.getElementById("overlayVideoContainer");
    const title = document.getElementById("overlayTitle");
    const types = document.getElementById("overlayTypes");

    if (!overlay || !container || !title || !types) return;

    // Set video info
    title.textContent = video.title;
    types.textContent = video.types.join(", ");

    // Clear previous content
    container.innerHTML = "";

    // Create video content
    if (video.path && video.path.trim() !== "") {
      const params = new URLSearchParams({
        autoplay: "1",
        mute: "0",
        controls: "1",
        loop: "1",
        vd: "hd1080",
        enablejsapi: "1",
        rel: "0",
        modestbranding: "1",
      });

      const iframe = document.createElement("iframe");
      iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${
        video.path
      }?${params.toString()}`;
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("id", `overlay-youtube-${video.path}`);

      container.appendChild(iframe);
    } else {
      container.innerHTML = createPlaceholderHTML(video);
    }

    state.currentOverlayVideo = video;
    document.body.classList.add("video-overlay-active");
    overlay.classList.add("active");
  }

  /**
   * Create placeholder HTML for videos without path
   */
  function createPlaceholderHTML(video) {
    const imageUrl = getImageForTrickType(video.types[0]);

    return `
      <div class="video-placeholder">
        <img class="placeholder-image" 
             src="${imageUrl}" 
             alt="${escapeHtml(video.title)}"
             loading="lazy">
        <div class="placeholder-text">
          <h3>${escapeHtml(video.title)}</h3>
      <p>Video coming soon...</p>
      <p>This trick is on the todo list!</p>
        </div>
      </div>
    `;
  }

  /**
   * Close video overlay
   */
  function closeVideoOverlay() {
    const overlay = document.getElementById("videoOverlay");
    if (!overlay || !overlay.classList.contains("active")) return;

    overlay.classList.remove("active");
    document.body.classList.remove("video-overlay-active");

    setTimeout(() => {
      if (state.currentOverlayVideo && state.currentOverlayVideo.path) {
        const iframe = document.getElementById(
          `overlay-youtube-${state.currentOverlayVideo.path}`
        );
        if (iframe) {
          const params = new URLSearchParams({
            mute: "1",
            controls: "1",
            loop: "1",
            vd: "hd1080",
            enablejsapi: "1",
            rel: "0",
            modestbranding: "1",
          });
          iframe.src = `${CONFIG.YOUTUBE_BASE_URL}${
            state.currentOverlayVideo.path
          }?${params.toString()}`;
        }
      }

      const container = document.getElementById("overlayVideoContainer");
      if (container) {
        container.innerHTML = "";
      }

      state.currentOverlayVideo = null;
    }, CONFIG.OVERLAY_ANIMATION_DURATION);
  }

  /**
   * Create empty state HTML
   */
  function createEmptyStateHTML(message) {
    return `
      <div class="col-12">
        <div class="text-center py-5">
          <h4 class="text-light">${escapeHtml(message)}</h4>
        </div>
      </div>
    `;
  }

  /**
   * Debounce function for performance optimization
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Escape HTML to prevent XSS attacks
   */
  function escapeHtml(text) {
    if (typeof text !== "string") return "";

    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Handle errors gracefully
   */
  function handleError(message, error) {
    console.error(`${message}:`, error);

    // Show user-friendly error message
    const errorHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Oops! Something went wrong</h4>
        <p>${escapeHtml(message)}</p>
        <hr>
        <p class="mb-0">Please refresh the page and try again.</p>
      </div>
    `;

    document.body.insertAdjacentHTML("afterbegin", errorHTML);
  }

  /**
   * Cleanup function to prevent memory leaks
   */
  function cleanup() {
    // Clean up video preview listeners
    document.querySelectorAll(".video-card").forEach((card) => {
      if (card._cleanup) {
        card._cleanup();
      }
    });

    // Clear timeouts and intervals
    state.currentOverlayVideo = null;
  }

  // Public API
  return {
    init,
    cleanup,
  };
})();

// Initialize the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", SkateApp.init);
} else {
  SkateApp.init();
}
