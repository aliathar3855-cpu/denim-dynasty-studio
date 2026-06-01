import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { orderId, action } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (orderId, action)" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "orders", orderId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = snapshot.data();
    const c = order.customer || {};
    const toEmail = c.email;

    if (!toEmail) {
      // If customer email doesn't exist, we skip sending without error
      return NextResponse.json({ success: true, message: "No email address found to notify." });
    }

    const orderNumber = order.orderNumber || orderId;
    let subject = "";
    let html = "";

    const trackingUrl = `${req.headers.get("origin") || "http://localhost:3000"}/order-tracking?orderNumber=${orderNumber}`;

    if (action === "placed") {
      subject = `Denim Dynasty Studio: Order Received! (${orderNumber})`;
      
      const itemsHtml = (order.products || [])
        .map(
          (item: any) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><img src="${item.imageUrl}" width="60" style="border-radius: 8px; vertical-align: middle; margin-right: 15px;" /> ${item.name}</td>
          <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 0; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>`
        )
        .join("");

      html = `
        <div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #000; margin-bottom: 30px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 15px;">DENIM DYNASTY STUDIO</h2>
            <p>Hi <strong>${c.name}</strong>,</p>
            <p>Thank you for shopping with us! We have received your order and are currently processing it.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 11px; text-transform: uppercase; color: #666; display: block;">Tracking Reference Code</span>
              <strong style="font-size: 18px; font-family: monospace; color: #000;">${orderNumber}</strong>
            </div>

            <h3 style="margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #eee; color: #666;">
                  <th style="text-align: left; padding-bottom: 10px;">Item</th>
                  <th style="text-align: center; padding-bottom: 10px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 10px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold;">
              Grand Total: ₹${order.total || 0}
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px; font-size: 13px; line-height: 1.5;">
              <strong>Shipping Address:</strong><br/>
              ${c.address}, ${c.city} - ${c.pincode}<br/>
              Phone: ${c.phone}
            </div>

            <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
              <a href="${trackingUrl}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 14px;">Track Order Status</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">© 2026 Denim Dynasty Studio. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (action === "shipped") {
      subject = `Denim Dynasty Studio: Order Shipped! (${orderNumber})`;
      html = `
        <div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #000; margin-bottom: 30px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 15px;">DENIM DYNASTY STUDIO</h2>
            <p>Hi <strong>${c.name}</strong>,</p>
            <p>Exciting news! Your Denim Dynasty Studio order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>
            
            <p>You can follow the progress of your shipment in real-time by clicking the link below:</p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${trackingUrl}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 14px;">Track Package Location</a>
            </div>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
              <strong>Delivery Location:</strong><br/>
              ${c.address}, ${c.city} - ${c.pincode}
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">© 2026 Denim Dynasty Studio. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (action === "delivered") {
      subject = `Denim Dynasty Studio: Order Delivered! (${orderNumber})`;
      html = `
        <div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="text-align: center; color: #000; margin-bottom: 30px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 15px;">DENIM DYNASTY STUDIO</h2>
            <p>Hi <strong>${c.name}</strong>,</p>
            <p>Your order <strong>${orderNumber}</strong> has been successfully delivered! We hope you love your new streetwear items.</p>
            
            <p>Thank you for choosing Denim Dynasty Studio. We would love to hear your feedback on your purchase!</p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${trackingUrl}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 14px;">View Receipt details</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">© 2026 Denim Dynasty Studio. All rights reserved.</p>
          </div>
        </div>
      `;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action type" },
        { status: 400 }
      );
    }

    const emailResult = await sendEmail({
      to: toEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true, mock: emailResult.mock });
  } catch (error: any) {
    console.error("Email API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process email" },
      { status: 500 }
    );
  }
}
