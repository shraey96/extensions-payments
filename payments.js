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

window.paypal
  .Buttons({
    style: {
      shape: "rect",
      layout: "vertical",
      color: "gold",
      label: "paypal",
    },
    message: {
      amount: 2.99,
    },

    createOrder: () => {
      const { user_email, id } = getQueryParams();

      // if (!user_email || !id) {
      //   alert("missing user_email and id");
      //   return;
      // }

      return fetch(
        "http://127.0.0.1:54321/functions/v1/yt-payments-create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            x: 1,
          },
        }
      )
        .then((res) => {
          if (res.ok) return res.json();
          return res.json().then((json) => Promise.reject(json));
        })
        .then(({ id }) => {
          return id;
        })
        .catch((e) => {
          console.error(e.error);
        });
    },

    onApprove: (data, actions) => {
      console.log(22, data, actions);
      return actions.order.capture().then((details) => {
        if (details.status === "COMPLETED") {
          alert("Transaction completed by " + details.payer.name.given_name);
        }
      });
    },
  })
  .render(".paypal-payments-btn-container");
