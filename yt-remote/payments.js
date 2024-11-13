// constants

const isLocalEnv =
  window.location.origin.includes("localhost") ||
  window.location.origin.includes("127.0.0.1");

const FUNCTIONS_BASE_URL = isLocalEnv ? "http://127.0.0.1:54321" : "";

const PAYPAL_CLIENT_ID =
  "AZot3DPGFuNM4c6GJPMjaS07BEPvt_ikO3uT_5gesGg4TWKbH2fF2wShY1-rPG_G5PJuQKTcEV5jY0jX";
const PAYPAL_SCRIPT_URL = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons&disable-funding=venmo,paylater`;

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

const loadScript = (src, attributes = {}) => {
  return new Promise((resolve, reject) => {
    // Check if the script is already added
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); // Script already exists, resolve immediately
      return;
    }

    // Create a new script element
    const script = document.createElement("script");
    script.src = src;

    // Set any additional attributes passed in
    for (const [key, value] of Object.entries(attributes)) {
      script.setAttribute(key, value);
    }

    // Handle the script load event
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    // Append the script to the head or body
    document.head.appendChild(script);
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

loadScript(PAYPAL_SCRIPT_URL, {
  "data-sdk-integration-source": "developer-studio",
}).then(renderPaypalButton);
