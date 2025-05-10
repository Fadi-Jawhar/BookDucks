const BASE_URL = "http://localhost:1337";

const renderToReadList = () => {
  const container = document.querySelector("#to-read-list");
  const sortOption = document.querySelector("#sort").value;

  const profile = JSON.parse(localStorage.getItem("userProfileData"));
  if (!profile || !profile.toReadList) {
    container.innerHTML = "<p>Inget sparat ännu.</p>";
    return;
  }

  let books = [...profile.toReadList];

  // Sortering
  books.sort((a, b) => {
    if (sortOption === "title") return a.title.localeCompare(b.title);
    if (sortOption === "author") return a.author.localeCompare(b.author);
    return 0;
  });

  container.innerHTML = "";

  books.forEach(book => {
    const div = document.createElement("div");
    div.classList.add("book-card");

    let imageUrl = "";
    if (book.cover?.formats?.medium?.url) {
      imageUrl = `${BASE_URL}${book.cover.formats.medium.url}`;
    } else if (book.cover?.url) {
      imageUrl = `${BASE_URL}${book.cover.url}`;
    }

    div.innerHTML = `
      <h3>${book.title}</h3>
      <p><strong>Författare:</strong> ${book.author}</p>
      <p><strong>Sidor:</strong> ${book.pages}</p>
      <p><strong>Utgiven:</strong> ${book.published}</p>
      ${imageUrl ? `<img src="${imageUrl}" width="120">` : ""}
      <button class="remove-btn" data-id="${book.id}">❌ Ta bort</button>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const bookId = e.target.dataset.id;
      await removeBookFromList(bookId);
    });
  });
};

const removeBookFromList = async (bookId) => {
  const token = localStorage.getItem("token");
  const profileId = localStorage.getItem("userProfileId");

  try {
    await axios.put(`${BASE_URL}/api/user-profiles/${profileId}`, {
      data: {
        toReadList: {
          disconnect: [bookId]
        }
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const updatedProfile = await axios.get(`${BASE_URL}/api/user-profiles/${profileId}?pLevel`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    localStorage.setItem("userProfileData", JSON.stringify(updatedProfile.data.data));
    renderToReadList();

  } catch (err) {
    console.error("Kunde inte ta bort bok:", err);
  }
};

document.querySelector("#sort").addEventListener("change", renderToReadList);
document.addEventListener("DOMContentLoaded", renderToReadList);
