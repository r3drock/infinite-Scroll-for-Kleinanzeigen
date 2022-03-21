let paginationHref = document
  .querySelector(".pagination-next")
  .getAttribute("href");
var ul = document.querySelector(".itemlist.ad-list.lazyload");

const urlContentToDataUri = async (url) => {
  return fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = function () {
            resolve(this.result);
          };
          reader.onerror = function () {
            reject(this.error);
          };
          reader.readAsDataURL(blob);
        })
    );
};

const fetchImage = async (url) => {
  if (url && !url.endsWith("null")) {
    const prom = urlContentToDataUri(url);
    const img = document.createElement("img");
    prom.then((srcString) => img.setAttribute("src", srcString));
    return img;
  }
  return null;
};

const getUrl = async (imgBox) => {
  return imgBox.getAttribute("data-imgsrc");
};

const refreshImages = async () => {
  Array.from(document.querySelectorAll("img")).forEach((x) => x.remove());

  const imgBxs = Array.from(document.querySelectorAll(".imagebox.srpimagebox"));
  for (let step = 0; step < imgBxs.length; step++) {
    let imgBox = imgBxs[step];
    getUrl(imgBox).then((url) => {
      fetchImage(url).then((image) => {
        if (image) {
          imgBox.appendChild(image);
        }
      });
    });
  }
};

const loadImage = async (imgBox) => {
  getUrl(imgBox).then((url) => {
    fetchImage(url).then((image) => {
      if (image) {
        imgBox.appendChild(image);
      }
    });
  });
};
let lastElement = [...ul.children][ul.childElementCount-10];
let lastText = null;
const getNextPage = async () => {
  await fetch("https://www.ebay-kleinanzeigen.de" + paginationHref).then((response) => {
    response.text().then((text) => {
      lastText = text;
      appendNextPage(text);
    });
  });
};

const appendNextPage = async (text) => {
  const begin = text.indexOf('<ul id="srchrslt-adtable"');
  const end = text.indexOf("</ul>", begin) + "</ul>".length;
  const nextList = text.slice(begin, end);
  const doc = new DOMParser().parseFromString(nextList, "text/html");
  const ul2 = doc.querySelector("ul");
  Array.from(ul2.children).forEach((li) => {
    let imgBox = li.querySelector(".imagebox.srpimagebox");
    if (imgBox) {
      loadImage(imgBox);
    }
    ul.appendChild(li);
  });
  lastElement = [...ul.children][ul.childElementCount-10];
  document.addEventListener("scroll", inView);

  const paginationBegin = text.indexOf('<a class="pagination-next');
  const hrefBegin = text.indexOf('href="', paginationBegin) + 'href="'.length;
  const hrefEnd = text.indexOf('"', hrefBegin);
  paginationHref = text.slice(hrefBegin, hrefEnd);
};

/**
 * Removes duplicates of items based on the Title. The items with higher prices are discarded.
 */
const removeDuplicates = async () => {
  let lis = [...ul.children];
  const titlePriceMap = new Map();
  for (let current of lis) {
    let currentText = current.querySelector(".ellipsis").textContent;
    let currentPriceText = current.querySelector(".aditem-main--middle--price");
    let titlePrice = currentText + currentPriceText;
    if (titlePriceMap.has(titlePrice)) {
      const prev = titlePriceMap.get(titlePrice);
      let prevPrice = parseNumber(
        prev.querySelector(".aditem-main--middle--price")
      );
      let currentPrice = parseNumber(currentPriceText);
      if (prevPrice <= currentPrice) {
        current.remove();
      } else {
        prev.remove();
        titlePriceMap.set(titlePrice, current);
      }
    } else {
      titlePriceMap.set(titlePrice, current);
    }
  }
};

const parseNumber = (str) => {
      let int = parseInt(str);
      if (isNaN(int)) {
        return 0;
      }
      return int;
} 

document.addEventListener("scroll", inView);

function inView() {
    if (lastElement.getBoundingClientRect().bottom <= window.innerHeight) {
        document.removeEventListener("scroll", inView);
        getNextPage();
    }
}