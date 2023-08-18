// Fetch the JSON data
fetch("json/videos.json")
  .then((response) => response.json())
  .then((videos) => {
    const content = document.querySelector("#tricksCards");

    // console.log(JSON.stringify(videos));
    // Display each video
    videos.forEach((video) => {
      // Add to drop down toggle
      const trickDoneLi = document.createElement("li");
      const dropItem = document.createElement("a");
      dropItem.textContent = video.title;
      dropItem.href = "#" + video.title;
      trickDoneLi.appendChild(dropItem);
      const dropDown = document.querySelector("#dropdown-done");
      dropDown.appendChild(trickDoneLi);

      // Group video and its information
      // iframe or piture if no video
      let videoOrPicture;
      const trickImage = document.createElement("img");
      trickImage.height = "240";
      trickImage.width = "150";
      if (video.path == "") {
        console.log(video.types[0]);
        switch (video.types[0]) {
          case "NORMAL":
            console.log("velo10");
            trickImage.src = "../images/normal.jpg";
            break;
          case "NOLLIE":
            console.log("veloKKKK");
            trickImage.src = "../images/nollie.jpg";
            break;
          case "FAKIE":
            trickImage.src = "../images/fakie.jpg";
            break;
          case "SWITCH":
            trickImage.src = "../images/switch.jpg";
            break;
          default:
            trickImage.src = "../images/unknown.jpg";
        }
        videoOrPicture = trickImage;
      } else {
        const videoElem = document.createElement("iframe");
        videoElem.height = "240";
        height = videoElem.src =
          "https://www.youtube.com/embed/" +
          video.path +
          "?mute=1&controls=0&playlist=e_8rvaAQJyU&loop=1";
        videoOrPicture = videoElem;
      }
      // Create card div
      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card");
      cardDiv.classList.add("h-100");

      // Create col div
      const colDiv = document.createElement("div");
      colDiv.classList.add("col");

      // Select tricksCards
      const tricksCards = document.querySelector("#tricksCards");

      // Card Body
      // create card body
      const cardBody = document.createElement("div");
      cardBody.classList.add("card-body");

      // mettre le titre dans la card body
      const title = document.createElement("h2");
      title.textContent = video.title;
      title.classList.add("card-title");

      // mettre les type dans le card body
      const types = document.createElement("p");
      types.textContent = video.types.join(", ");
      types.classList.add("card-text");

      // Populate
      cardBody.appendChild(title);
      cardBody.appendChild(types);
      cardDiv.appendChild(videoOrPicture);
      cardDiv.appendChild(cardBody);
      colDiv.appendChild(cardDiv);
      colDiv.id = video.title;
      tricksCards.appendChild(colDiv);
    });

    // Add event listener for search bar
    const searchBar = document.querySelector("#search-bar");
    searchBar.addEventListener("keyup", (event) => {
      const query = event.target.value.toLowerCase();
      const videoContainers = Array.from(content.children);
      videoContainers.forEach((videoContainer) => {
        const title = videoContainer
          .querySelector(".card-title")
          .textContent.toLowerCase();
        const types = videoContainer
          .querySelector(".card-text")
          .textContent.toLowerCase();
        const isMatchingTitle = title.includes(query);
        const isMatchingTypes = types.includes(query);
        videoContainer.style.display =
          isMatchingTitle || isMatchingTypes ? "block" : "none";
      });
    });
  });

fetch("json/todo.json")
  .then((response) => response.json())
  .then((todoTricks) => {
    // Display each todo trick
    todoTricks.forEach((tricks) => {
      // Add to Drop down list
      const trickTodoLi = document.createElement("li");
      const dropTodoItem = document.createElement("p");
      dropTodoItem.textContent = tricks.name;
      trickTodoLi.appendChild(dropTodoItem);
      const dropDown = document.querySelector("#dropdown-todo");
      dropDown.appendChild(trickTodoLi);
    });
  });
