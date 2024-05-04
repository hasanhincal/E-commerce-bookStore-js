let bookList = [],
  basketList = [];

//*ALERT objesi;
toastr.options = {
  closeButton: false,
  debug: false,
  newestOnTop: false,
  progressBar: false,
  positionClass: "toast-bottom-right",
  preventDuplicates: false,
  onclick: null,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "5000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
};

//* HTML'den çekilen elementler;
const basketModal = document.querySelector(".basket_model");
const booksListEl = document.querySelector(".book_list");
const basketListEl = document.querySelector(".basket_list");
const basketCountEl = document.querySelector(".basket_count");
const totalPriceEl = document.querySelector(".total_price");

//* olay izleyicileri;
//*sepet open-close;
const toggleModal = () => {
  basketModal.classList.toggle("active");
};

// Verileri çekme;
const getBooks = async () => {
  try {
    const response = await fetch("./products.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const books = await response.json();
    bookList = books;
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
};

getBooks();

//* yıldız verme olayını dinamikleştirme;
const createBookStars = (starRate) => {
  let starRateHtml = "";
  for (let i = 1; i <= 5; i++) {
    if (Math.round(starRate) >= i)
      starRateHtml += `<i class="bi bi-star-fill active"></i>`;
    else starRateHtml += `<i class="bi bi-star-fill"></i>`;
  }
  return starRateHtml;
};

//*veriyi ekrana renderlama;
const createBookItemsHtml = () => {
  let bookListHtml = "";
  bookList.forEach((book, index) => {
    bookListHtml += `
        <div class="col-5 ${index % 2 == 0 && "offset-2"} my-4">
          <div class="row book_card">
            <div class="col-6">
              <img
                width="2588"
                height="400"
                class="img-fluid shadow"
                src="${book.imgSource}"
                alt=""
              />
            </div>
            <div class="col-6 d-flex justify-content-between flex-column">
              <div class="book_detail">
                <span class="fos fs-5 gray">${book.author}</span><br />
                <span class="fs-4 black fw-bold"
                  >${book.name}</span
                ><br />
                <span class="book_star-rate">
                ${createBookStars(book.starRate)}
                </span
                ><br />
                <span class="gray">${book.reviewCount}</span>
              </div>
              <p class="book_description fos gray">
               ${book.description}
              </p>
              <div>
                <span class="black fw-bold fs-4 me-2">${book.price}₺</span>
                ${
                  book.oldPrice
                    ? `<span class="old_price fw-bold fs-4">${book.oldPrice}₺</span>`
                    : ""
                }
              </div>
              <button class="btn btn-md w-100 btn_purple" onclick="addToBasket(${
                book.id
              })">ADD BASKET</button>
            </div>
          </div>
        </div>
        `;
  });
  booksListEl.innerHTML = bookListHtml;
};

//* Kitap filtreleme kısmı;
const BOOK_TYPES = {
  ALL: "Tümü",
  NOVEL: "Roman",
  CHILDREN: "Çocuk",
  HISTORY: "Tarih",
  FINANCE: "Ekonomi",
  SELFIMPROVEMENT: "Kişisel Gelişim",
  SCIENCE: "Bilim",
};

const createBookTypesHtml = () => {
  const filterEl = document.querySelector(".filter");
  let filterHtml = "";
  let filterTypes = ["ALL"];
  bookList.forEach((book) => {
    if (filterTypes.findIndex((filter) => filter == book.type) == -1)
      filterTypes.push(book.type);
  });
  filterTypes.forEach((type, index) => {
    filterHtml += ` <li class="${
      index == 0 ? "active" : null
    }" onclick ="filterBooks(this)" data-type ="${type}">${
      BOOK_TYPES[type] || type
    }</li>`;
  });
  filterEl.innerHTML = filterHtml;
};

const filterBooks = (filterEl) => {
  document.querySelector(".filter .active").classList.remove("active");
  filterEl.classList.add("active");
  let bookType = filterEl.dataset.type;
  getBooks();
  if (bookType != "ALL")
    bookList = bookList.filter((book) => book.type == bookType);
  createBookItemsHtml();
};
//* Listeye ürün ekleme;
const listBasketItems = () => {
  localStorage.setItem("basketList", JSON.stringify(basketList));
  basketCountEl.innerHTML = basketList.length > 0 ? basketList.length : null;
  let basketListHtml = "";
  let totalPrice = 0;
  basketList.forEach((item) => {
    totalPrice += item.product.price * item.quantity;
    basketListHtml += ` <li class="basket_item">
    
      <img
        src="${item.product.imgSource}"
        width="100"
        height="110"
        alt=""
      />
      <div class="basket_item-info">
        <h6 class="book_name">${item.product.name}</h6>
        <h5 class="book_price">${item.product.price}₺</h5>
        <button class="book_remove" onclick="removeItemToBasket(${item.product.id})">Remove</button>
      </div>
      <div class="book_count">
        <span class="decrease" onclick="decreaseItemToBasket(${item.product.id})">-</span>
        <span class="fs-4 m-2">${item.quantity}</span>
        <span class="increase" onclick="increaseItemToBasket(${item.product.id})">+</span>
      </div>
    
  </li>`;
  });
  basketListEl.innerHTML = basketListHtml
    ? basketListHtml
    : `<li class="d-block text-center">No items to Buy again.</li>`;
  totalPriceEl.innerHTML =
    totalPrice > 0 ? "Total: " + totalPrice.toFixed(2) + "₺" : null;
};

//*sepete ekleme;
const addToBasket = (bookId) => {
  const findedBook = bookList.find((book) => book.id == bookId);
  if (findedBook) {
    const basketAlreadyIndex = basketList.findIndex(
      (basket) => basket.product.id == bookId
    );
    if (basketAlreadyIndex == -1) {
      let addedItem = { quantity: 1, product: findedBook };
      basketList.push(addedItem);
    } else {
      if (
        basketList[basketAlreadyIndex].quantity <
        basketList[basketAlreadyIndex].product.stock
      )
        basketList[basketAlreadyIndex].quantity += 1;
      else {
        toastr.error("Sorry, we don't have enough stock.");
        return;
      }
    }
    listBasketItems();
    toastr.success("Book added to basket successfully.");
  }
};

//* sepetten ürün çıkarma;
const removeItemToBasket = (bookId) => {
  const findedIndex = basketList.findIndex(
    (basket) => basket.product.id == bookId
  );
  if (findedIndex != -1) {
    basketList.splice(findedIndex, 1);
  }
  listBasketItems();
};

//* sepetteki ürünü azaltma;
const decreaseItemToBasket = (bookId) => {
  const findedIndex = basketList.findIndex(
    (basket) => basket.product.id == bookId
  );
  if (findedIndex != -1) {
    if (basketList[findedIndex].quantity != 1)
      basketList[findedIndex].quantity -= 1;
    else removeItemToBasket(bookId);
    listBasketItems();
  }
};

//* sepetteki ürünü arttırma;
const increaseItemToBasket = (bookId) => {
  const findedIndex = basketList.findIndex(
    (basket) => basket.product.id == bookId
  );
  if (findedIndex != -1) {
    if (basketList[findedIndex].quantity < basketList[findedIndex].product.stock)
      basketList[findedIndex].quantity += 1;
    else toastr.error("Sorry, we don't have enough stock.");
    listBasketItems();
  }
};

if (localStorage.getItem("basketList")) {
  basketList = JSON.parse(localStorage.getItem("basketList"));
  listBasketItems();
}

setTimeout(() => {
  createBookItemsHtml();
  createBookTypesHtml();
}, 100);
