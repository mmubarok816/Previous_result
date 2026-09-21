// ==========================================
// ORDER MANAGEMENT
// NO LOGIN REQUIRED
// ==========================================

let selectedBillOrder = null;
let selectedPayment = "Cash";


// ==========================================
// SEND ORDER TO KITCHEN
// ==========================================

async function sendOrderToKitchen() {

    if (!cart || cart.length === 0) {
        alert("Please add food to the order.");
        return;
    }

    const total = cart.reduce(
        (sum, item) =>
            sum + (Number(item.price) * Number(item.quantity)),
        0
    );

    try {

        // Generate order number
        const orderCounterRef =
            ref(db, "settings/orderNumber");

        const counterResult =
            await runTransaction(
                orderCounterRef,
                currentValue => {

                    if (currentValue === null) {
                        return 1001;
                    }

                    return Number(currentValue) + 1;
                }
            );

        const orderNumber =
            counterResult.snapshot.val();


        // Create order
        const orderRef =
            push(ref(db, "orders"));


        const orderData = {

            orderNumber: orderNumber,

            items: cart.map(item => ({

                productId: item.id,

                name: item.name,

                price: Number(item.price),

                quantity: Number(item.quantity),

                total:
                    Number(item.price) *
                    Number(item.quantity)

            })),

            total: total,

            // Order workflow
            status: "PENDING",

            paymentStatus: "PENDING",

            paymentMethod: null,

            createdAt: Date.now(),

            preparingAt: null,

            readyAt: null,

            billedAt: null

        };


        await set(
            orderRef,
            orderData
        );


        // Notify kitchen
        await createNotification(
            "🍽️ New Order",
            `Order #${orderNumber} received. Please prepare the food.`,
            "order",
            "kitchen"
        );


        // Clear cart
        cart = [];

        renderCart();


        alert(
            `Order #${orderNumber} sent to kitchen.`
        );


        closeAppPage();

    } catch (error) {

        console.error(error);

        alert(
            "Could not create order: " +
            getFirebaseError(error)
        );
    }
}



// ==========================================
// START PREPARING
// ==========================================

async function startPreparing(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    if (order.status !== "PENDING") {

        alert(
            "This order has already been started."
        );

        return;
    }


    try {

        await update(
            ref(db, "orders/" + orderId),
            {

                status: "PREPARING",

                preparingAt: Date.now()

            }
        );


        // Notify billing/owner
        await createNotification(
            "👨‍🍳 Preparing Order",
            `Order #${order.orderNumber} is now being prepared.`,
            "preparing",
            "all"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Could not update order."
        );
    }
}



// ==========================================
// FOOD READY
// ==========================================

async function markOrderReady(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    if (order.status !== "PREPARING") {

        alert(
            "Order must be in PREPARING status."
        );

        return;
    }


    try {

        await update(
            ref(db, "orders/" + orderId),
            {

                status: "READY",

                readyAt: Date.now()

            }
        );


        // Notify billing
        await createNotification(
            "✅ FOOD READY",
            `Order #${order.orderNumber} is ready. Please complete billing.`,
            "ready",
            "all"
        );


        alert(
            `Order #${order.orderNumber} is READY.`
        );


    } catch (error) {

        console.error(error);

        alert(
            "Could not mark order ready."
        );
    }
}



// ==========================================
// OPEN BILL
// ==========================================

function openBillModal(orderId) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;


    if (order.status !== "READY") {

        alert(
            "Order must be READY before billing."
        );

        return;
    }


    selectedBillOrder = order;

    selectedPayment = "Cash";


    document.getElementById(
        "billAmount"
    ).textContent =
        "₹" +
        Number(order.total).toFixed(2);


    document.getElementById(
        "billOrderNumber"
    ).textContent =
        "Order #" +
        order.orderNumber;


    document.getElementById(
        "billModal"
    ).style.display = "flex";


    updatePaymentButtons();
}



// ==========================================
// PAYMENT
// ==========================================

function setPayment(method) {

    selectedPayment = method;

    updatePaymentButtons();
}


function updatePaymentButtons() {

    const cash =
        document.getElementById(
            "cashPayment"
        );

    const upi =
        document.getElementById(
            "upiPayment"
        );


    if (cash) {

        cash.classList.toggle(
            "selected",
            selectedPayment === "Cash"
        );

    }


    if (upi) {

        upi.classList.toggle(
            "selected",
            selectedPayment === "UPI"
        );

    }
}



// ==========================================
// CLOSE BILL
// ==========================================

function closeBillModal() {

    const modal =
        document.getElementById(
            "billModal"
        );

    if (modal) {

        modal.style.display = "none";

    }

    selectedBillOrder = null;
}



// ==========================================
// CONFIRM BILL
// ==========================================

async function confirmBill() {

    if (!selectedBillOrder) {

        alert("No order selected.");

        return;
    }


    const order =
        selectedBillOrder;


    // Double check
    if (order.status !== "READY") {

        alert(
            "Order is not ready."
        );

        return;
    }


    try {

        // IMPORTANT:
        // Only now the order becomes COMPLETED
        // and will appear in sales reports.

        await update(
            ref(db, "orders/" + order.id),
            {

                status: "COMPLETED",

                paymentStatus: "PAID",

                paymentMethod:
                    selectedPayment,

                billedAt: Date.now()

            }
        );


        // Notify kitchen
        await createNotification(
            "💰 BILL COMPLETED",
            `Order #${order.orderNumber} completed. ₹${Number(order.total).toFixed(2)} via ${selectedPayment}.`,
            "billing",
            "all"
        );


        closeBillModal();


        alert(
            `Order #${order.orderNumber} completed successfully.`
        );


        // Refresh everything
        renderOrders();

        renderKitchenOrders();

        updateDashboard();

        renderReports();


    } catch (error) {

        console.error(error);

        alert(
            "Billing failed: " +
            getFirebaseError(error)
        );
    }
}



// ==========================================
// KITCHEN ORDERS
// ==========================================

function renderKitchenOrders() {

    const container =
        document.getElementById(
            "kitchenOrdersList"
        );

    if (!container) return;


    const kitchenOrders =
        orders.filter(order =>
            order.status !== "COMPLETED"
        );


    if (kitchenOrders.length === 0) {

        container.innerHTML = `

            <div class="order-card">

                <h3>
                    🍽️ No pending orders
                </h3>

                <p>
                    Kitchen is clear.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =

        kitchenOrders

        .slice()

        .sort(
            (a, b) =>
                (a.createdAt || 0) -
                (b.createdAt || 0)
        )

        .map(order => {

            const items =
                (order.items || [])

                .map(item => `

                    <div>
                        ${escapeHtml(item.name)}
                        × ${item.quantity}
                    </div>

                `)

                .join("");


            let button = "";


            // PENDING
            if (
                order.status === "PENDING"
            ) {

                button = `

                    <button
                        class="order-action"
                        onclick="startPreparing('${order.id}')">

                        👨‍🍳 START PREPARING

                    </button>

                `;

            }


            // PREPARING
            else if (
                order.status === "PREPARING"
            ) {

                button = `

                    <button
                        class="order-action ready-btn"
                        onclick="markOrderReady('${order.id}')">

                        ✅ FOOD READY

                    </button>

                `;

            }


            // READY
            else if (
                order.status === "READY"
            ) {

                button = `

                    <div class="status status-ready">

                        ✅ READY

                        <br>

                        Waiting for billing

                    </div>

                `;

            }


            return `

                <div class="order-card">

                    <div class="order-header">

                        <span class="order-number">

                            #${order.orderNumber}

                        </span>


                        <span class="status status-${String(
                            order.status
                        ).toLowerCase()}">

                            ${order.status}

                        </span>

                    </div>


                    <div class="order-items">

                        ${items}

                    </div>


                    <strong>

                        Total:
                        ₹${Number(
                            order.total
                        ).toFixed(2)}

                    </strong>


                    <div
                        style="margin-top:12px">

                        ${button}

                    </div>

                </div>

            `;

        })

        .join("");
}



// ==========================================
// ALL ORDERS
// ==========================================

function renderOrders() {

    const container =
        document.getElementById(
            "ordersList"
        );

    if (!container) return;


    if (orders.length === 0) {

        container.innerHTML = `

            <div class="order-card">

                <h3>
                    No orders yet
                </h3>

            </div>

        `;

        return;
    }


    container.innerHTML =

        orders

        .slice()

        .sort(
            (a, b) =>
                (b.createdAt || 0) -
                (a.createdAt || 0)
        )

        .map(order => {

            const items =
                (order.items || [])

                .map(item =>
                    `${escapeHtml(
                        item.name
                    )} × ${item.quantity}`
                )

                .join(", ");


            let action = "";


            // Only READY orders can be billed
            if (
                order.status === "READY"
            ) {

                action = `

                    <button
                        class="order-action bill-btn"
                        onclick="openBillModal('${order.id}')">

                        💰 CONFIRM BILL

                    </button>

                `;

            }


            return `

                <div class="order-card">

                    <div class="order-header">

                        <span class="order-number">

                            #${order.orderNumber}

                        </span>


                        <span class="status status-${String(
                            order.status
                        ).toLowerCase()}">

                            ${order.status}

                        </span>

                    </div>


                    <p>
                        ${items}
                    </p>


                    <strong>

                        ₹${Number(
                            order.total
                        ).toFixed(2)}

                    </strong>


                    <p>

                        Payment:
                        ${order.paymentStatus || "PENDING"}

                    </p>


                    ${action}

                </div>

            `;

        })

        .join("");
}



// ==========================================
// REPORTS
// ONLY COMPLETED ORDERS
// ==========================================

function renderReports() {

    const today =
        getIndiaDateKey();


    const completedOrders =
        orders.filter(order => {

            if (
                order.status !== "COMPLETED"
            ) {

                return false;

            }


            return getIndiaDateKey(
                order.billedAt ||
                order.createdAt
            ) === today;

        });


    // Today's sales
    const totalSales =
        completedOrders.reduce(
            (sum, order) =>
                sum +
                Number(order.total || 0),
            0
        );


    const salesElement =
        document.getElementById(
            "reportTodaySales"
        );


    if (salesElement) {

        salesElement.textContent =
            "₹" +
            totalSales.toFixed(2);

    }


    // Today's completed orders
    const ordersElement =
        document.getElementById(
            "reportTodayOrders"
        );


    if (ordersElement) {

        ordersElement.textContent =
            completedOrders.length;

    }


    // Existing report functions
    if (
        typeof renderStaffSales ===
        "function"
    ) {

        renderStaffSales(
            completedOrders
        );

    }


    if (
        typeof renderPaymentReport ===
        "function"
    ) {

        renderPaymentReport(
            completedOrders
        );

    }
}


function updateDashboard() {

    const today =
        getIndiaDateKey();


    const completedOrders =
        orders.filter(order =>

            order.status === "COMPLETED" &&

            getIndiaDateKey(
                order.billedAt ||
                order.createdAt
            ) === today

        );


    const pendingOrders =
        orders.filter(order =>
            order.status === "PENDING" ||
            order.status === "PREPARING"
        );


    const readyOrders =
        orders.filter(order =>
            order.status === "READY"
        );


    const sales =
        completedOrders.reduce(
            (sum, order) =>
                sum + Number(order.total || 0),
            0
        );


    document.getElementById(
        "todaySales"
    ).textContent =
        "₹" + sales.toFixed(2);


    document.getElementById(
        "todayOrders"
    ).textContent =
        completedOrders.length;


    document.getElementById(
        "pendingOrders"
    ).textContent =
        pendingOrders.length;


    document.getElementById(
        "readyOrders"
    ).textContent =
        readyOrders.length;
}
