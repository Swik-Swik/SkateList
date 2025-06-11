// Global variables
let allVideos = [];
let todoTricks = [];

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
}

function populateCarousel() {
  const carouselContent = document.getElementById("carousel-content");

  // Get videos that have paths (featured videos)
  const featuredVideos = allVideos.filter(
    (video) => video.path && video.path !== ""
  );

  // Take first 5 featured videos for carousel
  const carouselVideos = featuredVideos.slice(0, 5);

  if (carouselVideos.length === 0) {
    carouselContent.innerHTML =
      '<div class="carousel-item active"><div class="d-flex align-items-center justify-content-center h-100"><h3 class="text-light">No featured videos available</h3></div></div>';
    return;
  }

  carouselVideos.forEach((video, index) => {
    const carouselItem = document.createElement("div");
    carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`;

    const videoElement = createVideoElement(video);
    carouselItem.appendChild(videoElement);

    carouselContent.appendChild(carouselItem);
  });
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
    cardDiv.className = "card h-100";

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
    videoElem.src = `https://www.youtube.com/embed/${video.path}?mute=1&controls=1&loop=1&vd=hd1080`;
    videoElem.setAttribute("allowfullscreen", "");
    videoElem.setAttribute("frameborder", "0");
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
