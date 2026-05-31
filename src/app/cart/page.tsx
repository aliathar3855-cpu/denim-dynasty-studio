"use client";

import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const totalPrice = cart.reduce(
    (total: number, item: any) =>
      total + item.price * item.quantity,
    0
  );

  // CHECKOUT FUNCTION
  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalPrice,
        }),
      });

      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Denim Dynasty Studio",
        description: "Order Payment",
        order_id: order.id,

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },

        handler: async function (response: any) {
          try {
            await fetch("/api/save-order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cart,
                total: totalPrice,
                paymentId: response.razorpay_payment_id,
                status: "paid",
              }),
            });

            // clear cart after success
            localStorage.removeItem("cart");

            alert("Payment Successful!");
          } catch (err) {
            console.log(err);
          }
        },

        theme: {
          color: "#000000",
        },
      };

      const razor = new (window as any).Razorpay(options);
      razor.open();

    } catch (error) {
      console.log(error);
      alert("Payment failed");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">

      <h1 className="text-5xl font-bold mb-10">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (

        <div className="text-center mt-32">
          <h2 className="text-3xl font-bold">
            Your cart is empty
          </h2>
        </div>

      ) : (

        <div className="grid gap-8">

          {cart.map((item: any) => (

            <div
              key={item.id}
              className="bg-zinc-900 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center"
            >

              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full md:w-[200px] h-[200px] object-cover rounded-2xl"
              />

              <div className="flex-1">

                <h2 className="text-3xl font-bold">
                  {item.name}
                </h2>

                <p className="text-gray-400 mt-2 text-xl">
                  ₹{item.price}
                </p>

                <div className="flex items-center gap-4 mt-6">

                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="bg-white text-black w-10 h-10 rounded-full text-xl font-bold"
                  >
                    -
                  </button>

                  <span className="text-2xl">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQuantity(item.id)}
                    className="bg-white text-black w-10 h-10 rounded-full text-xl font-bold"
                  >
                    +
                  </button>

                </div>

              </div>

              <div className="flex flex-col gap-4">

                <p className="text-2xl font-bold">
                  ₹{item.price * item.quantity}
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="bg-red-500 px-5 py-3 rounded-xl font-semibold"
                >
                  Remove
                </button>

              </div>

            </div>

          ))}

          {/* TOTAL + CHECKOUT */}
          <div className="bg-zinc-900 rounded-3xl p-8 mt-10">

            <h2 className="text-4xl font-bold">
              Total: ₹{totalPrice}
            </h2>

            <button
              onClick={handleCheckout}
              className="mt-6 bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Proceed To Checkout
            </button>

          </div>

        </div>

      )}

    </main>
  );
}