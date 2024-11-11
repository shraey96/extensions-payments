// constants
const FUNCTIONS_BASE_URL =
  window.location.origin.includes("localhost") ||
  window.location.origin.includes("127.0.0.1")
    ? "http://127.0.0.1:54321"
    : "";

// utils
const getQueryParams = (url = window.location.href) => {
  // Create a URL object to parse the query string
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  // Convert parameters to a plain object
  const queryParams = {};
  for (const [key, value] of params.entries()) {
    queryParams[key] = value;
  }

  return queryParams;
};

const promisifiedFetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    fetch(url, options)
      .then(async (response) => {
        if (!response.ok) {
          const res = await response.json();
          return reject(res);
        }
        return response.json(); // You can change this to `response.text()` or other formats if needed
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
};

const renderPaypalButton = () => {
  window.paypal
    .Buttons({
      style: {
        shape: "rect",
        layout: "vertical",
        color: "gold",
        label: "paypal",
      },

      createOrder: async () => {
        const resp = await promisifiedFetch(
          `${FUNCTIONS_BASE_URL}/functions/v1/yt-payments-create-order`
        ).catch((err) => {
          console.error(err);
        });

        return resp.id;
      },

      onApprove: async (data) => {
        const { user_email, user_id } = getQueryParams();
        const userObject = {
          ...(user_email && { user_email }),
          ...(user_id && { user_id }),
        };

        const resp = await promisifiedFetch(
          `${FUNCTIONS_BASE_URL}/functions/v1/yt-payments-capture-order`,

          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...data,
              ...userObject,
            }),
          }
        ).catch((err) => {
          console.error(err);
        });

        console.log(111, resp);
      },
    })
    .render(".paypal-payments-btn-container");
};

renderPaypalButton();
