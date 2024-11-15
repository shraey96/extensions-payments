// constants

const isLocalEnv =
  window.location.origin.includes("localhost") ||
  window.location.origin.includes("127.0.0.1");

const FUNCTIONS_BASE_URL = isLocalEnv ? "http://127.0.0.1:54321" : "";

const PAYPAL_CLIENT_ID =
  "AZot3DPGFuNM4c6GJPMjaS07BEPvt_ikO3uT_5gesGg4TWKbH2fF2wShY1-rPG_G5PJuQKTcEV5jY0jX";
const PAYPAL_SCRIPT_URL = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons&disable-funding=venmo,paylater`;

const modal = document.getElementById("buyNowModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const emailSection = document.getElementById("emailSection");
const paymentSection = document.getElementById("paymentSection");
const continueBtn = document.getElementById("continueBtn");
const emailInput = document.getElementById("email");

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

const renderPaypalButton = (email = "") => {
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
        const userObject = {
          email,
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
});

const openModal = () => {
  modal.style.display = "flex"; // Show the modal
  modal.setAttribute("aria-hidden", "false"); // Set aria-hidden to false for accessibility
  document.body.style.overflow = "hidden"; // Prevent background scroll
  emailSection.style.display = "block"; // Hide the email input section
};

// Close modal when the close button is clicked
closeModalBtn.addEventListener("click", () => {
  modal.setAttribute("aria-hidden", "true"); // Set aria-hidden to true for accessibility
  document.body.style.overflow = "auto"; // Re-enable background scroll
  modal.style.display = "none"; // Hide the modal
  emailSection.style.display = "none"; // Hide the email input section
  paymentSection.style.display = "none"; // Show the payment section
});

document
  .querySelector("#activatePaidVersionButton")
  .addEventListener("click", () => {
    openModal();
  });

// Handle the "Continue" button click
continueBtn.addEventListener("click", () => {
  // Validate the email
  const emailValue = emailInput.value.trim();
  if (emailValue) {
    // Show the payment page
    emailSection.style.display = "none"; // Hide the email input section
    paymentSection.style.display = "block"; // Show the payment section
  } else {
    alert("Please enter a valid email address.");
  }
});
