// Fetch the JSON data
fetch("json/videos.json")
  .then((response) => response.json())
  .then((videos) => {
    const navBar = document.querySelector("#trick-list");
    const content = document.querySelector("#content");

    console.log(JSON.stringify(videos));
    // Display each video
    videos.forEach((video) => {
      const title = document.createElement("h2");
      title.textContent = video.title;
      title.classList.add("video-title");

      const videoElem = document.createElement("video");
      videoElem.src = video.path;
      videoElem.classList.add("video-style");
      videoElem.controls = true;

      const datePlace = document.createElement("p");
      datePlace.textContent = video.dateAndPlace
        .map((dp) => `${dp.date}, ${dp.place}`)
        .join(" | ");
      datePlace.classList.add("video-dateplace-info");

      const types = document.createElement("p");
      types.textContent = video.types.join(", ");
      types.classList.add("video-tricktype-info");

      // Group video and its information
      const videoGroup = document.createElement("div");
      videoGroup.classList.add("video-group");
      videoGroup.appendChild(videoElem);
      videoGroup.appendChild(datePlace);
      videoGroup.appendChild(types);

      // Add to nav bar
      const navItem = document.createElement("a");
      navItem.textContent = video.title;
      navItem.href = "#" + video.title;
      navBar.appendChild(navItem);

      // Add to content
      const videoContainer = document.createElement("div");
      videoContainer.id = video.title;
      videoContainer.appendChild(title);
      videoContainer.appendChild(videoGroup);
      content.appendChild(videoContainer);
    });

    // Add event listener for search bar
    const searchBar = document.querySelector("#search-bar");
    searchBar.addEventListener("keyup", (event) => {
      const query = event.target.value.toLowerCase();
      const videoContainers = Array.from(content.children);

      videoContainers.forEach((videoContainer) => {
        const title = videoContainer
          .querySelector(".video-title")
          .textContent.toLowerCase();
        const types = videoContainer
          .querySelector(".video-tricktype-info")
          .textContent.toLowerCase();
        const isMatchingTitle = title.includes(query);
        const isMatchingTypes = types.includes(query);

        videoContainer.style.display =
          isMatchingTitle || isMatchingTypes ? "block" : "none";
      });
    });
  })
  .then(() => {
    fetch("json/todo.json")
      .then((response) => response.json())
      .then((todoTricks) => {
        const navBar = document.querySelector("#trick-list");
        // Display each video
        todoTricks.forEach((tricks) => {
          // Add to nav bar
          const navItem = document.createElement("p");
          navItem.textContent = tricks.name;
          navBar.appendChild(navItem);
        });
      });
  });
