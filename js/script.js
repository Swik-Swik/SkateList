// Global variables
let allVideos = [];
let todoTricks = [];
let carouselVideos = []; // Store carousel videos for title reference
let currentOverlayVideo = null; // Track currently overlayed video

// Fetch the JSON data
Promise.all([
  fetch("json/videos.json").then((response) => response.json()),
  fetch("json/todo.json").then((response) => response.json()),
])
  .then(([videos, todos]) => {
    allVideos = videos;
    todoTricks = todos;

    // Initialize the page
    initializePage();
  })
  .catch((error) => {
    console.error("Error loading data:", error);
  });

function initializePage() {
  // Populate carousel with featured videos (videos with paths)
  populateCarousel();

  // Populate tabs with categorized videos
  populateTabs();

  // Update navigation dropdowns
  updateNavigationDropdowns();

  // Setup search functionality
  setupSearch();

  // Setup carousel video controls
  setupCarouselVideoControls();

  // Setup video overlay functionality
  setupVideoOverlay();
}

function populateCarousel() {
  const carouselContent = document.getElementById("carousel-content");

  // Get videos that have paths (featured videos)
  const featuredVideos = allVideos.filter(
    (video) => video.path && video.path !== ""
  );

  // Take first 5 featured videos for carousel
  carouselVideos = featuredVideos.slice(0, 5); // Store for title reference

  if (carouselVideos.length === 0) {
    carouselContent.innerHTML =
      '<div class="carousel-item active"><div class="d-flex align-items-center justify-content-center h-100"><h3 class="text-light">No featured videos available</h3></div></div>';
    return;
  }

  carouselVideos.forEach((video, index) => {
    const carouselItem = document.createElement("div");
    carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`;
    carouselItem.setAttribute("data-video-title", video.title); // Store title in data attribute

    const videoElement = createVideoElement(video);
    carouselItem.appendChild(videoElement);

    carouselContent.appendChild(carouselItem);
  });

  // Set initial title
  updateCarouselTitle(0);
}

function populateTabs() {
  // Categorize videos
  const flatTricks = allVideos.filter(
    (video) =>
      video.types.includes("FLIPTRICK") ||
      video.types.includes("ROTATION") ||
      video.types.includes("PIVOT") ||
      (video.types.length === 1 &&
        ["NORMAL", "NOLLIE", "FAKIE", "SWITCH"].includes(video.types[0]))
  );

  // For now, grinds will be empty since no grind tricks exist in the data
  const grinds = allVideos.filter((video) =>
    video.types.some((type) => type.toLowerCase().includes("grind"))
  );

  // Other tricks (remaining tricks not in flat tricks or grinds)
  const otherTricks = allVideos.filter(
    (video) => !flatTricks.includes(video) && !grinds.includes(video)
  );

  // Populate each tab
  populateGrid("flatTricksGrid", flatTricks);
  populateGrid("grindsGrid", grinds);
  populateGrid("otherGrid", otherTricks);
}

function populateGrid(gridId, videos) {
  const grid = document.getElementById(gridId);

  if (videos.length === 0) {
    grid.innerHTML =
      '<div class="col-12"><div class="text-center py-5"><h4 class="text-light">No tricks in this category yet</h4></div></div>';
    return;
  }

  grid.innerHTML = "";

  // Sort videos: ones with a path (video preview) come first
  videos.sort((a, b) => {
    if (a.path && !b.path) return -1;
    if (!a.path && b.path) return 1;
    return 0;
  });

  videos.forEach((video) => {
    const colDiv = document.createElement("div");
    colDiv.className = "col";
    colDiv.id = video.title;

    const cardDiv = document.createElement("div");
    // Add video-card class for enhanced styling and mark as clickable
    cardDiv.className = video.path ? "card h-100 video-card" : "card h-100";
    cardDiv.setAttribute("data-video-title", video.title);
    cardDiv.setAttribute("data-video-path", video.path || "");
    cardDiv.setAttribute("data-video-types", video.types.join(", "));

    // Make entire card clickable for video overlay (both video and non-video cards)
    cardDiv.addEventListener("click", (e) => {
      // Prevent event from triggering multiple times
      e.stopPropagation();
      openVideoOverlay(video);
    });

    // Add hover event listeners for video preview ONLY for cards with videos
    if (video.path) {
      setupVideoPreview(cardDiv, video);
    }

    // Create video or image element
    const mediaElement = createVideoElement(video);
    cardDiv.appendChild(mediaElement);

    // Create card body
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = video.title;

    const types = document.createElement("p");
    types.className = "card-text";
    types.textContent = video.types.join(", ");

    cardBody.appendChild(title);
    cardBody.appendChild(types);
    cardDiv.appendChild(cardBody);
    colDiv.appendChild(cardDiv);
    grid.appendChild(colDiv);
  });
}

function createVideoElement(video) {
  if (video.path && video.path !== "") {
    const videoElem = document.createElement("iframe");
    // Start with NO autoplay for cards - only static preview
    videoElem.src = `https://www.youtube.com/embed/${video.path}?mute=1&controls=0&loop=0&vd=hd1080&enablejsapi=1&rel=0&modestbranding=1`;
    videoElem.setAttribute("allowfullscreen", "");
    videoElem.setAttribute("frameborder", "0");
    videoElem.setAttribute("id", `youtube-${video.path}`);
    return videoElem;
  } else {
    // Create a wrapper to contain the rotated image and prevent overflow
    const wrapper = document.createElement("div");
    wrapper.className = "card-img-wrapper";

    const trickImage = document.createElement("img");
    trickImage.className = "card-img-top";

    // Set image based on trick type
    switch (video.types[0]) {
      case "NORMAL":
        trickImage.src = "./images/normal.jpg";
        break;
      case "NOLLIE":
        trickImage.src = "./images/nollie.jpg";
        break;
      case "FAKIE":
        trickImage.src = "./images/fakie.jpg";
        break;
      case "SWITCH":
        trickImage.src = "./images/switch.jpg";
        break;
      default:
        trickImage.src = "./images/unknown.jpg";
    }

    trickImage.alt = video.title;

    wrapper.appendChild(trickImage);
    return wrapper;
  }
}

function updateNavigationDropdowns() {
  // Update tricks done dropdown
  const dropdownDone = document.getElementById("dropdown-done");
  const trickDoneTitle = document.getElementById("trickDoneTitle");

  dropdownDone.innerHTML = "";

  allVideos.forEach((video) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "dropdown-item";
    a.href = `#${video.title}`;
    a.textContent = video.title;
    li.appendChild(a);
    dropdownDone.appendChild(li);
  });

  if (trickDoneTitle) {
    trickDoneTitle.textContent = `Tricks Done (${allVideos.length})`;
  }

  // Update tricks todo dropdown
  const dropdownTodo = document.getElementById("dropdown-todo");
  const trickTodoTitle = document.getElementById("trickTodoTitle");

  dropdownTodo.innerHTML = "";

  todoTricks.forEach((trick) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "dropdown-item";
    a.href = "#";
    a.textContent = trick.name;
    li.appendChild(a);
    dropdownTodo.appendChild(li);
  });

  if (trickTodoTitle) {
    trickTodoTitle.textContent = `Tricks Todo (${todoTricks.length})`;
  }
}

function setupSearch() {
  const searchBar = document.getElementById("search-bar");

  searchBar.addEventListener("keyup", (event) => {
    const query = event.target.value.toLowerCase();

    // Search in all tab grids
    const grids = ["flatTricksGrid", "grindsGrid", "otherGrid"];

    grids.forEach((gridId) => {
      const grid = document.getElementById(gridId);
      const videoContainers = Array.from(grid.children);

      videoContainers.forEach((container) => {
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
  });
}

function setupCarouselVideoControls() {
  const carousel = document.getElementById("highlightedCarousel");

  if (!carousel) return;

  // Function to pause all YouTube videos in the carousel
  function pauseAllCarouselVideos() {
    const iframes = carousel.querySelectorAll("iframe[id^='youtube-']");
    iframes.forEach((iframe) => {
      try {
        // Send pause command to YouTube iframe
        iframe.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          "*"
        );
      } catch (error) {
        console.log("Could not pause video:", error);
      }
    });
  }

  // Function to stop all YouTube videos in the carousel (more aggressive than pause)
  function stopAllCarouselVideos() {
    const iframes = carousel.querySelectorAll("iframe[id^='youtube-']");
    iframes.forEach((iframe) => {
      try {
        // Send stop command to YouTube iframe
        iframe.contentWindow.postMessage(
          '{"event":"command","func":"stopVideo","args":""}',
          "*"
        );
      } catch (error) {
        console.log("Could not stop video:", error);
      }
    });
  }

  // Listen for carousel slide events
  carousel.addEventListener("slide.bs.carousel", function (event) {
    // This event fires when the slide transition starts
    // Pause all videos to ensure smooth transition
    pauseAllCarouselVideos();

    // Start title change animation
    const titleElement = document.getElementById("carousel-title");
    if (titleElement) {
      titleElement.classList.add("title-changing");
    }
  });

  carousel.addEventListener("slid.bs.carousel", function (event) {
    // This event fires after the slide transition completes
    // Stop all videos except the active one to free up resources
    stopAllCarouselVideos();

    // Update title with animation
    const activeIndex = Array.from(
      event.target.querySelectorAll(".carousel-item")
    ).indexOf(event.relatedTarget);
    updateCarouselTitle(activeIndex);
  });
}

// Function to update carousel title with animation
function updateCarouselTitle(activeIndex) {
  const titleElement = document.getElementById("carousel-title");
  if (!titleElement || !carouselVideos[activeIndex]) return;

  const newTitle = carouselVideos[activeIndex].title;

  // If title is currently changing, update it
  if (titleElement.classList.contains("title-changing")) {
    // Wait for fade out, then change text and fade in
    setTimeout(() => {
      titleElement.textContent = newTitle;
      titleElement.classList.remove("title-changing");
      titleElement.classList.add("title-changed");

      // Remove the title-changed class after animation
      setTimeout(() => {
        titleElement.classList.remove("title-changed");
      }, 300);
    }, 150); // Half of the transition duration
  } else {
    // Initial title set (no animation needed)
    titleElement.textContent = newTitle;
  }
}

// =============================================================================
// VIDEO PREVIEW ON HOVER
// =============================================================================

function setupVideoPreview(cardElement, video) {
  if (!video.path) return;

  const iframe = cardElement.querySelector("iframe");
  if (!iframe) return;

  let hoverTimeout;
  let leaveTimeout;
  let isHovered = false;
  let isPlaying = false;

  cardElement.addEventListener("mouseenter", () => {
    isHovered = true;
    clearTimeout(leaveTimeout);

    // Delay video start to avoid triggering on quick mouse movements
    hoverTimeout = setTimeout(() => {
      if (isHovered && !isPlaying) {
        startVideoPreview(iframe, video);
        isPlaying = true;
      }
    }, 700); // 700ms delay to avoid accidental triggers
  });

  cardElement.addEventListener("mouseleave", () => {
    isHovered = false;
    clearTimeout(hoverTimeout);

    // Small delay before stopping to avoid flickering on quick mouse movements
    leaveTimeout = setTimeout(() => {
      if (!isHovered && isPlaying) {
        stopVideoPreview(iframe, video);
        isPlaying = false;
      }
    }, 100);
  });
}

function startVideoPreview(iframe, video) {
  try {
    // Update src to enable autoplay with mute for preview
    iframe.src = `https://www.youtube.com/embed/${video.path}?autoplay=1&mute=1&controls=0&loop=1&vd=hd1080&enablejsapi=1&rel=0&modestbranding=1&start=0`;
  } catch (error) {
    console.log("Could not start video preview:", error);
  }
}

function stopVideoPreview(iframe, video) {
  try {
    // Reset to static preview (no autoplay, no loop)
    iframe.src = `https://www.youtube.com/embed/${video.path}?mute=1&controls=0&loop=0&vd=hd1080&enablejsapi=1&rel=0&modestbranding=1`;
  } catch (error) {
    console.log("Could not stop video preview:", error);
  }
}

// =============================================================================
// VIDEO OVERLAY FUNCTIONALITY
// =============================================================================

function setupVideoOverlay() {
  // Create video overlay HTML structure with fixed container
  const overlayHTML = `
    <div class="video-overlay" id="videoOverlay">
      <div class="video-overlay-content">
        <div class="video-overlay-close" id="overlayClose">×</div>
        <div class="video-overlay-video-container" id="overlayVideoContainer"></div>
        <div class="video-overlay-info" id="overlayInfo">
          <h3 id="overlayTitle"></h3>
          <p id="overlayTypes"></p>
        </div>
      </div>
    </div>
  `;

  // Add overlay to body
  document.body.insertAdjacentHTML("beforeend", overlayHTML);

  // Setup event listeners
  const overlay = document.getElementById("videoOverlay");
  const closeBtn = document.getElementById("overlayClose");

  // Close overlay when clicking close button
  closeBtn.addEventListener("click", closeVideoOverlay);

  // Close overlay when clicking outside content
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeVideoOverlay();
    }
  });

  // Close overlay with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      closeVideoOverlay();
    }
  });
}

function openVideoOverlay(video) {
  const overlay = document.getElementById("videoOverlay");
  const container = document.getElementById("overlayVideoContainer");
  const title = document.getElementById("overlayTitle");
  const types = document.getElementById("overlayTypes");

  // Set video info
  title.textContent = video.title;
  types.textContent = video.types.join(", ");

  // Clear previous content
  container.innerHTML = "";

  // Create video content
  if (video.path && video.path !== "") {
    // Create YouTube iframe with larger size and better parameters
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${video.path}?autoplay=1&mute=0&controls=1&loop=1&vd=hd1080&enablejsapi=1&rel=0&modestbranding=1`;
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "autoplay; encrypted-media");
    iframe.setAttribute("id", `overlay-youtube-${video.path}`);
    container.appendChild(iframe);
  } else {
    // Create placeholder for videos without path
    const placeholder = document.createElement("div");
    placeholder.className = "video-placeholder";

    const placeholderImg = document.createElement("img");
    placeholderImg.className = "placeholder-image";

    // Set image based on trick type
    switch (video.types[0]) {
      case "NORMAL":
        placeholderImg.src = "./images/normal.jpg";
        break;
      case "NOLLIE":
        placeholderImg.src = "./images/nollie.jpg";
        break;
      case "FAKIE":
        placeholderImg.src = "./images/fakie.jpg";
        break;
      case "SWITCH":
        placeholderImg.src = "./images/switch.jpg";
        break;
      default:
        placeholderImg.src = "./images/unknown.jpg";
    }
    placeholderImg.alt = video.title;

    const placeholderText = document.createElement("div");
    placeholderText.className = "placeholder-text";
    placeholderText.innerHTML = `
      <h3>${video.title}</h3>
      <p>Video coming soon...</p>
      <p>This trick is on the todo list!</p>
    `;

    placeholder.appendChild(placeholderImg);
    placeholder.appendChild(placeholderText);
    container.appendChild(placeholder);
  }

  // Store current video reference
  currentOverlayVideo = video;

  // Prevent body scrolling
  document.body.classList.add("video-overlay-active");

  // Show overlay with animation
  overlay.classList.add("active");
}

function closeVideoOverlay() {
  const overlay = document.getElementById("videoOverlay");

  if (!overlay || !overlay.classList.contains("active")) {
    return;
  }

  // Hide overlay
  overlay.classList.remove("active");

  // Re-enable body scrolling
  document.body.classList.remove("video-overlay-active");

  // Stop any playing videos after animation completes
  setTimeout(() => {
    if (currentOverlayVideo && currentOverlayVideo.path) {
      const iframe = document.getElementById(
        `overlay-youtube-${currentOverlayVideo.path}`
      );
      if (iframe) {
        // Stop the video by reloading the iframe src without autoplay
        iframe.src = `https://www.youtube.com/embed/${currentOverlayVideo.path}?mute=1&controls=1&loop=1&vd=hd1080&enablejsapi=1&rel=0&modestbranding=1`;
      }
    }

    // Clear the container content
    const container = document.getElementById("overlayVideoContainer");
    if (container) {
      container.innerHTML = "";
    }

    // Clear current video reference
    currentOverlayVideo = null;
  }, 400); // Match the CSS transition duration
}
