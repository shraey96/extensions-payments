// constants

const isLocalEnv =
  window.location.origin.includes("localhost") ||
  window.location.origin.includes("127.0.0.1");

const FUNCTIONS_BASE_URL = isLocalEnv ? "http://127.0.0.1:54321" : "";

const PAYPAL_CLIENT_ID =
  "AZot3DPGFuNM4c6GJPMjaS07BEPvt_ikO3uT_5gesGg4TWKbH2fF2wShY1-rPG_G5PJuQKTcEV5jY0jX";
const PAYPAL_SCRIPT_URL = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons&disable-funding=venmo,paylater`;

const cashfree = Cashfree({
  mode: isLocalEnv ? "sandbox" : "production",
});

// DOM Selectors
const modal = document.getElementById("buyNowModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const emailSection = document.getElementById("emailSection");
const paymentSection = document.getElementById("paymentSection");
const continueBtn = document.getElementById("continueBtn");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const buyNowButton = document.getElementById("activatePaidVersionButton");
const cashfreeBtn = document.querySelector(".cashfree-payments-btn-container");
const cashFreeSection = document.getElementById("cashFreePaymentsSection");
const cashFreePayBtn = document.getElementById("cashFreePay");

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

const showErrorMessage = (error) => {
  alert("Something went wrong: " + error.message || error.error);
  console.error(error);
};

const renderPaypalButton = (user_email = "") => {
  document.querySelector(".paypal-payments-btn-container").innerHTML = "";
  window.paypal
    .Buttons({
      style: {
        shape: "rect",
        layout: "vertical",
        color: "gold",
        label: "paypal",
      },

      createOrder: async () => {
        try {
          const resp = await promisifiedFetch(
            `${FUNCTIONS_BASE_URL}/functions/v1/yt-payments-create-order`,

            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ gateway: "paypal", user_email }),
            }
          );

          return resp.id;
        } catch (error) {
          showErrorMessage(error);
        }
      },

      onApprove: async (data) => {
        const userObject = {
          user_email,
        };

        try {
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
                gateway: "paypal",
              }),
            }
          );

          console.log({ resp });
        } catch (error) {
          showErrorMessage(error);
        }
      },
    })
    .render(".paypal-payments-btn-container");
};

const handleCashFreeOrderCreate = async () => {
  const user_phone = phoneInput.value.trim();
  const user_email = emailInput.value.trim();

  try {
    const resp = await promisifiedFetch(
      `${FUNCTIONS_BASE_URL}/functions/v1/yt-payments-create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gateway: "cashfree", user_email, user_phone }),
      }
    );

    console.log({ resp });

    const payment = await cashfree.checkout({
      paymentSessionId: resp.payment_session_id,
      redirectTarget: "_modal",
    });

    console.log({ payment });

    if (payment.error) {
      // This will be true whenever user clicks on close icon inside the modal or any error happens during the payment
      console.log(
        "User has closed the popup or there is some payment error, Check for Payment Status"
      );
      showErrorMessage(payment);
    }

    if (payment.paymentDetails) {
      // This will be called whenever the payment is completed irrespective of transaction status
      console.log("Payment has been completed, Check for Payment Status");
      console.log(payment.paymentDetails.paymentMessage);
    }
  } catch (error) {
    showErrorMessage(error);
  }
};

// UI Controls

const togglePaymentSection = (type = "hide") => {
  paymentSection.style.display = type === "show" ? "block" : "none";
};

const toggleEmailInputSection = (type = "hide") => {
  emailSection.style.display = type === "show" ? "block" : "none";
};

const toggleModalSection = (type = "hide") => {
  modal.style.display = type === "show" ? "flex" : "none";
  document.body.style.overflow = type === "show" ? "hidden" : "auto";
};

const toggleCashFreeSection = (type = "hide") => {
  cashFreeSection.style.display = type === "show" ? "block" : "none";
};

const openModal = () => {
  toggleModalSection("show");
  toggleEmailInputSection("show");
};

// Close modal when the close button is clicked
closeModalBtn.addEventListener("click", () => {
  toggleModalSection("hide");
  toggleEmailInputSection("hide");
  togglePaymentSection("hide");
  toggleCashFreeSection("hide");
});

buyNowButton.addEventListener("click", () => openModal());

// Handle the "Continue" button click
continueBtn.addEventListener("click", () => {
  // Validate the email
  const emailValue = emailInput.value.trim();
  if (emailValue) {
    // Show the payment page
    toggleEmailInputSection("hide");
    togglePaymentSection("show");
    renderPaypalButton(emailValue);
  } else {
    alert("Please enter a valid email address.");
  }
});

cashFreePayBtn.addEventListener("click", () => {
  const phoneValue = phoneInput.value.trim();
  if (phoneValue && phoneValue.length === 10) {
    // Show the payment page
    handleCashFreeOrderCreate();
  } else {
    alert("Please enter a valid phone number.");
  }
});

cashfreeBtn.addEventListener("click", () => {
  togglePaymentSection("hide");
  toggleCashFreeSection("show");
});

loadScript(PAYPAL_SCRIPT_URL, {
  "data-sdk-integration-source": "developer-studio",
});
