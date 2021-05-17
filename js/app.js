"use strict";

const rootEl = document.getElementById("root");
const loaderEl = rootEl.querySelector('[data-id="leader"]');
const wishesEl = rootEl.querySelector('[data-id="wish-list"]');
const errorEl = rootEl.querySelector('[data-id="message"]');
const apiUrl = "http://127.0.0.1:9999/api/wishes";
const state = {
  wishes: [],
};

function ajax(method, url, headers, callbacks, body) {
  if (typeof callbacks.onStart === 'function') {
    callbacks.onStart();
  }

  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.onload = () => {
    if (xhr.status < 200 || xhr.status > 299) {
      const error = JSON.parse(xhr.responseText);
      if (typeof callbacks.onError === 'function') {
        callbacks.onError(error);
      }
      return;
    }

    if (typeof callbacks.onSuccess === 'function') {
      if (method !== 'DELETE') {
        const data = JSON.parse(xhr.responseText);
        callbacks.onSuccess(data);
      } else {
        callbacks.onSuccess();
      }
    }
  };
  xhr.onerror = () => {
    if (typeof callbacks.onError === 'function') {
      callbacks.onError({error: 'Network error'});
    }
  };
  xhr.onloadend = () => {
    if (typeof callbacks.onFinish === 'function') {
      callbacks.onFinish();
    }
  };
  xhr.setRequestHeader('Content-Type', headers['Content-Type']);
  xhr.send(body);
}

function loadData() {
  ajax('GET', apiUrl, {}, {
    onStart: () => loaderEl.style.display = 'block',
    onFinish: () => loaderEl.style.display = 'none',
    onSuccess: data => {
        console.log(JSON.parse(data));
    },
    onError: error => console.log(error),
  });
}

function renderWishes(wishesEl, wishes) {
  wishesEl.innerHTML = wishes
    .map(
      (o) => `
        <li class="wish-item">
          <div>
            <img src="https://source.unsplash.com/collection/${Math.round(Math.random() * 10)}/1816x1346/?products" alt="" data-block="wish-photo" class="wish-photo">
          </div>
          <div class="wish-info">
            <div><strong>Название:</strong> ${o.name}</div>
            <div data-block="description"><i>${o.description}</i></div>
          </div>
          <div data-block="price"><strong>Цена:</strong> ${o.price} с.</div>
          <div>
            <button data-itemId="${o.id}" data-action="remove">Удалить</button>
          </div>
        </li>
        <hr>
    `
    )
    .join("");
}

function totalCost(wishes) {
  const sum = wishes.reduce((prev, cur) => prev + cur.price, 0);
  rootEl.querySelector('[data-id="total"]').textContent = sum;
}

loadData();

const formEl = rootEl.querySelector('[data-id="wish-form"]');
const fieldsetEl = rootEl.querySelector('[data-id="wish-fieldset"]');
const nameEl = rootEl.querySelector('[data-input="name"]');
const priceEl = rootEl.querySelector('[data-input="price"]');
const descriptionEl = rootEl.querySelector('[data-input="description"]');

function saveData(item) {
  ajax('POST', apiUrl, {"Content-Type": "application/json"}, {
    onStart: () => {
      loaderEl.style.display = "block";
      fieldsetEl.disabled = true;
    },
    onFinish: () => {
      loaderEl.style.display = "none";
      fieldsetEl.disabled = false;
    },
    onSuccess: data => {
      state.wishes.unshift(data);
      totalCost(state.wishes);
      renderWishes(wishesEl, state.wishes);
      formEl.reset();
    },
    onError: error => console.log(error),
  }, JSON.stringify(item));
}

formEl.onsubmit = (evt) => {
  evt.preventDefault();

  const id = 0;
  const name = nameEl.value.trim();
  const price = Number(priceEl.value);
  const description = descriptionEl.value.trim();
  console.log(price);
  if (name === '') {
    const error = 'Заполните поле название!';
    errorEl.textContent = error;
    nameEl.focus();
    return;
  } else if (price === 0) {
    const error = 'Заполните поле цена!';
    errorEl.textContent = error;
    priceEl.focus();
    return;
  } else if (description === '') {
    const error = 'Заполните поле описание!';
    errorEl.textContent = error;
    descriptionEl.focus();
    return;
  }

  const wish = {
    id,
    name,
    price,
    description,
  };

  saveData(wish);
};

function removeDataById(id) {
  ajax('DELETE', `${apiUrl}/${id}`, {}, {
    onStart: () => loaderEl.style.display = 'block',
    onFinish: () => loaderEl.style.display = 'none',
    onSuccess: data => {
        console.log(JSON.parse(data));
    },
    onError: error => console.log(error),
  });
}

wishesEl.addEventListener('click', (evt) => {
    if(evt.target.dataset.action !== "remove") {
        return;
    }

    const id = Number(evt.target.dataset.itemid);

    removeDataById(id);
});
