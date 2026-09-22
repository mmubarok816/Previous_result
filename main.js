/* =========================================================
   FAST FOOD MANAGEMENT SYSTEM
   Version 1
   HTML + CSS + JavaScript + Firebase Realtime Database

   NO LOGIN / NO AUTHENTICATION
   ========================================================= */


/* =========================================================
   1. FIREBASE CONFIGURATION
   =========================================================

   Replace these values with your Firebase Web App config.
*/
const firebaseConfig = {

    apiKey:
        "AIzaSyBm31uBHEea0TnvrI_OkG7GRkFWRZTboFQ",

    authDomain:
        "mahira-fast-food.firebaseapp.com",

    databaseURL:
        "https://mahira-fast-food-default-rtdb.firebaseio.com",

    projectId:
        "mahira-fast-food",

    storageBucket:
        "mahira-fast-food.firebasestorage.app",

    messagingSenderId:
        "233550566877",

    appId:
        "1:233550566877:web:fff6bd2984be8926ef1234",

    measurementId:
        "G-4376MP90MZ"
};

/* =========================================================
   2. GLOBAL VARIABLES
   ========================================================= */

let db = null;
let firebaseReady = false;

let cart = [];

let currentReport = "day";

let data = {
    products: [
        {
            id: "p1",
            name: "Momo",
            price: 80
        },
        {
            id: "p2",
            name: "Chowmein",
            price: 80
        },
        {
            id: "p3",
            name: "Biryani",
            price: 120
        },
        {
            id: "p4",
            name: "Fried Rice",
            price: 100
        },
        {
            id: "p5",
            name: "Tea",
            price: 20
        },
        {
            id: "p6",
            name: "Pori",
            price: 20
        },
        {
            id: "p7",
            name: "Sweet",
            price: 30
        }
    ],

    orders: [],

    customers: [],

    staff: [
        {
            id: "staff1",
            name: "Staff 1"
        },
        {
            id: "staff2",
            name: "Staff 2"
        }
    ],

    expenses: []
};


/* =========================================================
   3. START APPLICATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadLocalData();

    initializeFirebase();

    bindNavigation();

    bindActions();

    renderAll();

    updateDate();

});


/* =========================================================
   4. FIREBASE INITIALIZATION
   ========================================================= */

function initializeFirebase() {

    try {

        /*
         * Firebase config has not been entered.
         * Run the application in local mode.
         */

        if (
            firebaseConfig.apiKey === "YOUR_API_KEY" ||
            firebaseConfig.projectId === "YOUR_PROJECT_ID"
        ) {

            console.log("Firebase configuration not added.");

            firebaseReady = false;

            return;
        }


        firebase.initializeApp(firebaseConfig);

        db = firebase.database();

        firebaseReady = true;


        console.log("Firebase connected successfully");


        /* PRODUCTS */

        db.ref("products").on("value", function (snapshot) {

            const value = snapshot.val();

            if (value) {

                data.products = Object.values(value);

            }

            renderProducts();

            renderProductSelect();

        });


        /* ORDERS */

        db.ref("orders").on("value", function (snapshot) {

            const value = snapshot.val();

            if (value) {

                data.orders = Object.values(value);

            } else {

                data.orders = [];

            }

            renderAll();

        });


        /* CUSTOMERS */

        db.ref("customers").on("value", function (snapshot) {

            const value = snapshot.val();

            if (value) {

                data.customers = Object.values(value);

            } else {

                data.customers = [];

            }

            renderCustomers();

            updateDashboard();

        });


        /* STAFF */

        db.ref("staff").on("value", function (snapshot) {

            const value = snapshot.val();

            if (value) {

                data.staff = Object.values(value);

            }

            renderStaff();

        });


        /* EXPENSES */

        db.ref("expenses").on("value", function (snapshot) {

            const value = snapshot.val();

            if (value) {

                data.expenses = Object.values(value);

            } else {

                data.expenses = [];

            }

            renderExpenses();

        });


        toast("Firebase connected");

    } catch (error) {

        console.error(error);

        firebaseReady = false;

        toast("Firebase error");

    }

}


/* =========================================================
   5. LOCAL STORAGE
   ========================================================= */

function loadLocalData() {

    try {

        const saved = localStorage.getItem(
            "fastFoodDataV1"
        );

        if (saved) {

            const parsed = JSON.parse(saved);

            data = {
                ...data,
                ...parsed
            };

        }

    } catch (error) {

        console.error(
            "Local data loading error:",
            error
        );

    }

}


function saveLocalData() {

    try {

        localStorage.setItem(
            "fastFoodDataV1",
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "Local data saving error:",
            error
        );

    }

}


/* =========================================================
   6. ID GENERATOR
   ========================================================= */

function generateId(prefix) {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


/* =========================================================
   7. MONEY FORMAT
   ========================================================= */

function money(amount) {

    return (
        "₹" +
        Number(amount || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )
    );

}


/* =========================================================
   8. DATE FUNCTIONS
   ========================================================= */

function getDateKey(date = new Date()) {

    return date.toISOString().substring(0, 10);

}


function getMonthKey(date = new Date()) {

    return date.toISOString().substring(0, 7);

}


function getYearKey(date = new Date()) {

    return date.getFullYear().toString();

}


/* =========================================================
   9. DATABASE WRITE
   ========================================================= */

function databaseWrite(path, value) {

    if (firebaseReady && db) {

        return db.ref(path).set(value);

    }

    saveLocalData();

    return Promise.resolve();

}


/* =========================================================
   10. DATABASE PUSH
   ========================================================= */

function databasePush(path, value) {

    if (firebaseReady && db) {

        return db.ref(path).push(value);

    }


    if (path === "orders") {

        data.orders.push(value);

    }


    else if (path === "products") {

        data.products.push(value);

    }


    else if (path === "customers") {

        data.customers.push(value);

    }


    else if (path === "staff") {

        data.staff.push(value);

    }


    else if (path === "expenses") {

        data.expenses.push(value);

    }


    saveLocalData();

    return Promise.resolve();

}


/* =========================================================
   11. NAVIGATION
   ========================================================= */

function bindNavigation() {

    document
        .querySelectorAll("[data-page]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    showPage(
                        button.dataset.page
                    );

                    const menu =
                        document.getElementById(
                            "moreMenu"
                        );

                    if (menu) {

                        menu.classList.add(
                            "hidden"
                        );

                    }

                }
            );

        });


    const moreButton =
        document.getElementById(
            "moreBtn"
        );


    if (moreButton) {

        moreButton.onclick = function () {

            const menu =
                document.getElementById(
                    "moreMenu"
                );

            menu.classList.toggle(
                "hidden"
            );

        };

    }

}


/* =========================================================
   12. SHOW PAGE
   ========================================================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(function (page) {

            page.classList.remove(
                "active"
            );

        });


    const page =
        document.getElementById(pageId);


    if (page) {

        page.classList.add("active");

    }


    document
        .querySelectorAll(".nav-btn")
        .forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );

        });


    if (pageId === "dashboardPage") {

        updateDashboard();

    }


    if (pageId === "salePage") {

        renderProductSelect();

        renderCart();

    }


    if (pageId === "kitchenPage") {

        renderKitchen();

    }


    if (pageId === "ordersPage") {

        renderOrders();

    }


    if (pageId === "customersPage") {

        renderCustomers();

    }


    if (pageId === "staffPage") {

        renderStaff();

    }


    if (pageId === "productsPage") {

        renderProducts();

    }


    if (pageId === "expensesPage") {

        renderExpenses();

    }


    if (pageId === "reportsPage") {

        renderReport();

    }

}


/* =========================================================
   13. BUTTON EVENTS
   ========================================================= */

function bindActions() {

    const newSaleButton =
        document.getElementById(
            "newSaleTop"
        );


    if (newSaleButton) {

        newSaleButton.onclick =
            function () {

                showPage(
                    "salePage"
                );

            };

    }


    const refreshButton =
        document.getElementById(
            "refreshBtn"
        );


    if (refreshButton) {

        refreshButton.onclick =
            function () {

                location.reload();

            };

    }


    const addItemButton =
        document.getElementById(
            "addItemBtn"
        );


    if (addItemButton) {

        addItemButton.onclick =
            addCartItem;

    }


    const discount =
        document.getElementById(
            "discount"
        );


    if (discount) {

        discount.oninput =
            renderCart;

    }


    const paid =
        document.getElementById(
            "paidAmount"
        );


    if (paid) {

        paid.oninput =
            renderCart;

    }


    const saveSale =
        document.getElementById(
            "saveSaleBtn"
        );


    if (saveSale) {

        saveSale.onclick =
            saveSaleOrder;

    }


    const addStaff =
        document.getElementById(
            "addStaffBtn"
        );


    if (addStaff) {

        addStaff.onclick =
            addStaffMember;

    }


    const addProduct =
        document.getElementById(
            "addProductBtn"
        );


    if (addProduct) {

        addProduct.onclick =
            addProductItem;

    }


    const addExpense =
        document.getElementById(
            "addExpenseBtn"
        );


    if (addExpense) {

        addExpense.onclick =
            addExpenseItem;

    }


    const search =
        document.getElementById(
            "orderSearch"
        );


    if (search) {

        search.oninput =
            renderOrders;

    }


    const status =
        document.getElementById(
            "statusFilter"
        );


    if (status) {

        status.onchange =
            renderOrders;

    }


    document
        .querySelectorAll(".report-tab")
        .forEach(function (button) {

            button.onclick =
                function () {

                    document
                        .querySelectorAll(
                            ".report-tab"
                        )
                        .forEach(function (item) {

                            item.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    currentReport =
                        button.dataset.report;


                    renderReport();

                };

        });

}


/* =========================================================
   14. RENDER EVERYTHING
   ========================================================= */

function renderAll() {

    updateDashboard();

    renderProductSelect();

    renderCart();

    renderKitchen();

    renderOrders();

    renderCustomers();

    renderStaff();

    renderProducts();

    renderExpenses();

    renderReport();

}


/* =========================================================
   15. CURRENT DATE
   ========================================================= */

function updateDate() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );


    if (!dateElement) return;


    dateElement.textContent =
        new Date().toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

}


/* =========================================================
   16. DASHBOARD
   ========================================================= */

function updateDashboard() {

    const todayOrders =
        data.orders.filter(
            function (order) {

                return (
                    getDateKey(
                        new Date(order.createdAt)
                    ) === getDateKey()
                );

            }
        );


    const totalSales =
        todayOrders.reduce(
            function (sum, order) {

                return (
                    sum +
                    Number(order.total || 0)
                );

            },
            0
        );


    const totalDue =
        todayOrders.reduce(
            function (sum, order) {

                return (
                    sum +
                    Number(order.due || 0)
                );

            },
            0
        );


    const kitchenOrders =
        todayOrders.filter(
            function (order) {

                return (
                    order.status !==
                    "Completed"
                );

            }
        ).length;


    const ordersElement =
        document.getElementById(
            "statOrders"
        );


    const salesElement =
        document.getElementById(
            "statSales"
        );


    const kitchenElement =
        document.getElementById(
            "statKitchen"
        );


    const dueElement =
        document.getElementById(
            "statDue"
        );


    if (ordersElement) {

        ordersElement.textContent =
            todayOrders.length;

    }


    if (salesElement) {

        salesElement.textContent =
            money(totalSales);

    }


    if (kitchenElement) {

        kitchenElement.textContent =
            kitchenOrders;

    }


    if (dueElement) {

        dueElement.textContent =
            money(totalDue);

    }


    const recent =
        [...todayOrders]
            .sort(
                function (a, b) {

                    return (
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                    );

                }
            )
            .slice(0, 5);


    const recentElement =
        document.getElementById(
            "recentOrders"
        );


    if (!recentElement) return;


    if (!recent.length) {

        recentElement.innerHTML =
            "<div class='panel muted'>" +
            "No orders today." +
            "</div>";

        return;

    }


    recentElement.innerHTML =
        recent
            .map(createOrderHTML)
            .join("");

}


/* =========================================================
   17. PRODUCT SELECT
   ========================================================= */

function renderProductSelect() {

    const select =
        document.getElementById(
            "productSelect"
        );


    if (!select) return;


    select.innerHTML =
        "<option value=''>" +
        "Select food" +
        "</option>" +


        data.products
            .map(function (product) {

                return (
                    "<option value='" +
                    escapeHtml(product.id) +
                    "'>" +
                    escapeHtml(product.name) +
                    " - " +
                    money(product.price) +
                    "</option>"
                );

            })
            .join("");

}


/* =========================================================
   18. ADD CART ITEM
   ========================================================= */

function addCartItem() {

    const select =
        document.getElementById(
            "productSelect"
        );


    const quantityInput =
        document.getElementById(
            "itemQty"
        );


    const productId =
        select.value;


    const quantity =
        Math.max(
            1,
            Number(
                quantityInput.value || 1
            )
        );


    const product =
        data.products.find(
            function (item) {

                return item.id === productId;

            }
        );


    if (!product) {

        toast(
            "Please select food"
        );

        return;

    }


    const existing =
        cart.find(
            function (item) {

                return (
                    item.productId ===
                    productId
                );

            }
        );


    if (existing) {

        existing.qty += quantity;

    } else {

        cart.push({

            productId:
                product.id,

            name:
                product.name,

            price:
                Number(product.price),

            qty:
                quantity

        });

    }


    renderCart();

}


/* =========================================================
   19. RENDER CART
   ========================================================= */

function renderCart() {

    const container =
        document.getElementById(
            "saleItems"
        );


    if (!container) return;


    if (!cart.length) {

        container.innerHTML =
            "<div class='muted'>" +
            "No food added." +
            "</div>";

    } else {

        container.innerHTML =
            cart
                .map(function (item, index) {

                    return (

                        "<div class='cart-row'>" +

                        "<div>" +

                        "<div class='item-name'>" +
                        escapeHtml(
                            item.name
                        ) +
                        "</div>" +

                        "<div class='muted'>" +
                        item.qty +
                        " × " +
                        money(item.price) +
                        "</div>" +

                        "</div>" +

                        "<div>" +

                        "<strong>" +
                        money(
                            item.qty *
                            item.price
                        ) +
                        "</strong> " +

                        "<button " +
                        "class='remove-btn' " +
                        "onclick='removeCartItem(" +
                        index +
                        ")'>" +

                        "<i class='fa-solid fa-xmark'></i>" +

                        "</button>" +

                        "</div>" +

                        "</div>"

                    );

                })
                .join("");

    }


    const subtotal =
        cart.reduce(
            function (sum, item) {

                return (
                    sum +
                    item.qty *
                    item.price
                );

            },
            0
        );


    const discount =
        Math.max(
            0,
            Number(
                document.getElementById(
                    "discount"
                ).value || 0
            )
        );


    const total =
        Math.max(
            0,
            subtotal - discount
        );


    const paid =
        Math.max(
            0,
            Number(
                document.getElementById(
                    "paidAmount"
                ).value || 0
            )
        );


    const due =
        Math.max(
            0,
            total - paid
        );


    document.getElementById(
        "subtotal"
    ).textContent =
        money(subtotal);


    document.getElementById(
        "saleTotal"
    ).textContent =
        money(total);


    document.getElementById(
        "saleDue"
    ).textContent =
        money(due);

}


/* =========================================================
   20. REMOVE CART ITEM
   ========================================================= */

function removeCartItem(index) {

    cart.splice(
        index,
        1
    );

    renderCart();

}


/* =========================================================
   21. SAVE NEW SALE
   ========================================================= */

async function saveSaleOrder() {

    if (!cart.length) {

        toast(
            "Add food items first"
        );

        return;

    }


    const customerName =
        document.getElementById(
            "customerName"
        ).value.trim()
        ||
        "Walk-in customer";


    const customerPhone =
        document.getElementById(
            "customerPhone"
        ).value.trim();


    const subtotal =
        cart.reduce(
            function (sum, item) {

                return (
                    sum +
                    item.qty *
                    item.price
                );

            },
            0
        );


    const discount =
        Math.max(
            0,
            Number(
                document.getElementById(
                    "discount"
                ).value || 0
            )
        );


    const total =
        Math.max(
            0,
            subtotal - discount
        );


    const enteredPaid =
        Math.max(
            0,
            Number(
                document.getElementById(
                    "paidAmount"
                ).value || 0
            )
        );


    const paid =
        Math.min(
            total,
            enteredPaid
        );


    const due =
        Math.max(
            0,
            total - paid
        );


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        ).value;


    const orderNumber =
        1001 +
        data.orders.length;


    const order = {

        id:
            generateId("order"),

        orderNumber:
            orderNumber,

        customerName:
            customerName,

        customerPhone:
            customerPhone,

        items:
            JSON.parse(
                JSON.stringify(cart)
            ),

        subtotal:
            subtotal,

        discount:
            discount,

        total:
            total,

        paid:
            paid,

        due:
            due,

        paymentMethod:
            paymentMethod,

        status:
            "New",

        kitchenStatus:
            "New",

        createdAt:
            new Date().toISOString(),

        staffConfirmation:
            null,

        staffConfirmedAt:
            null

    };


    await databasePush(
        "orders",
        order
    );


    await updateCustomer(
        customerName,
        customerPhone,
        total,
        paid,
        due
    );


    if (!firebaseReady) {

        /*
         * databasePush already added
         * order to local data.
         */

        renderAll();

    }


    cart = [];


    document.getElementById(
        "customerName"
    ).value = "";


    document.getElementById(
        "customerPhone"
    ).value = "";


    document.getElementById(
        "discount"
    ).value = 0;


    document.getElementById(
        "paidAmount"
    ).value = 0;


    renderCart();


    toast(
        "Order #" +
        orderNumber +
        " sent to kitchen"
    );


    showPage(
        "kitchenPage"
    );

}


/* =========================================================
   22. CUSTOMER UPDATE
   ========================================================= */

async function updateCustomer(
    name,
    phone,
    purchase,
    paid,
    due
) {

    let customer =
        data.customers.find(
            function (item) {

                if (phone) {

                    return (
                        item.phone ===
                        phone
                    );

                }


                return (
                    String(item.name)
                        .toLowerCase() ===
                    String(name)
                        .toLowerCase()
                );

            }
        );


    if (!customer) {

        customer = {

            id:
                generateId("customer"),

            name:
                name,

            phone:
                phone,

            totalPurchase:
                0,

            totalPaid:
                0,

            balance:
                0,

            payments:
                []

        };


        data.customers.push(
            customer
        );

    }


    customer.totalPurchase =
        Number(
            customer.totalPurchase || 0
        ) +
        Number(purchase || 0);


    customer.totalPaid =
        Number(
            customer.totalPaid || 0
        ) +
        Number(paid || 0);


    customer.balance =
        customer.totalPurchase -
        customer.totalPaid;


    if (due > 0) {

        if (!customer.payments) {

            customer.payments = [];

        }


        customer.payments.push({

            amount:
                due,

            type:
                "due",

            date:
                new Date().toISOString()

        });

    }


    if (firebaseReady && db) {

        await db
            .ref(
                "customers/" +
                customer.id
            )
            .set(customer);

    } else {

        saveLocalData();

    }

}


/* =========================================================
   23. ORDER HTML
   ========================================================= */

function createOrderHTML(order) {

    const items =
        (order.items || [])
            .map(function (item) {

                return (
                    escapeHtml(
                        item.name
                    ) +
                    " × " +
                    item.qty
                );

            })
            .join(", ");


    const statusClass =
        String(
            order.status || ""
        ).toLowerCase();


    return (

        "<div class='order-card " +
        statusClass +
        "'>" +


        "<div class='order-top'>" +

        "<div>" +

        "<div class='order-number'>" +
        "Order #" +
        order.orderNumber +
        "</div>" +

        "<div class='muted'>" +
        escapeHtml(
            order.customerName
        ) +
        " · " +
        new Date(
            order.createdAt
        ).toLocaleTimeString(
            "en-IN",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        ) +
        "</div>" +

        "</div>" +


        "<span class='badge " +
        statusClass +
        "'>" +
        escapeHtml(
            order.status
        ) +
        "</span>" +


        "</div>" +


        "<div class='order-items'>" +
        items +
        "</div>" +


        "<div class='order-top'>" +

        "<strong>" +
        money(order.total) +
        "</strong>" +

        "<span class='muted'>" +
        "Paid " +
        money(order.paid) +
        " · Due " +
        money(order.due) +
        "</span>" +

        "</div>" +


        "<div class='order-actions'>" +

        getOrderButtons(order) +

        "</div>" +


        "</div>"

    );

}


/* =========================================================
   24. ORDER ACTION BUTTONS
   ========================================================= */

function getOrderButtons(order) {

    let html = "";


    if (order.status === "New") {

        html +=
            "<button " +
            "class='small-btn' " +
            "onclick=\"changeOrderStatus('" +
            order.id +
            "','Cooking')\">" +

            "Start Cooking" +

            "</button>";

    }


    if (order.status === "Cooking") {

        html +=
            "<button " +
            "class='small-btn green' " +
            "onclick=\"changeOrderStatus('" +
            order.id +
            "','Ready')\">" +

            "Food Ready" +

            "</button>";

    }


    if (order.status === "Ready") {

        html +=
            "<select " +
            "class='small-btn' " +
            "onchange=\"confirmStaff('" +
            order.id +
            "',this.value)\">" +

            "<option value=''>" +
            "Confirm Staff" +
            "</option>" +


            data.staff
                .map(function (staff) {

                    const name =
                        staff.name ||
                        staff;


                    return (
                        "<option>" +
                        escapeHtml(name) +
                        "</option>"
                    );

                })
                .join("") +


            "</select>";


        if (order.staffConfirmation) {

            html +=
                "<button " +
                "class='small-btn blue' " +
                "onclick=\"changeOrderStatus('" +
                order.id +
                "','Completed')\">" +

                "Complete Order" +

                "</button>";

        }

    }


    if (
        order.status ===
        "Completed"
    ) {

        html +=
            "<span class='badge completed'>" +

            "Staff: " +

            escapeHtml(
                order.staffConfirmation ||
                "Confirmed"
            ) +

            "</span>";

    }


    return html;

}


/* =========================================================
   25. CHANGE ORDER STATUS
   ========================================================= */

async function changeOrderStatus(
    orderId,
    status
) {

    const order =
        data.orders.find(
            function (item) {

                return (
                    item.id ===
                    orderId
                );

            }
        );


    if (!order) return;


    order.status =
        status;


    order.kitchenStatus =
        status;


    await databaseWrite(
        "orders/" +
        order.id,
        order
    );


    if (!firebaseReady) {

        saveLocalData();

    }


    renderAll();


    toast(
        "Order status: " +
        status
    );

}


/* =========================================================
   26. STAFF CONFIRMATION
   ========================================================= */

async function confirmStaff(
    orderId,
    staffName
) {

    if (!staffName) {

        return;

    }


    const order =
        data.orders.find(
            function (item) {

                return (
                    item.id ===
                    orderId
                );

            }
        );


    if (!order) return;


    order.staffConfirmation =
        staffName;


    order.staffConfirmedAt =
        new Date().toISOString();


    await databaseWrite(
        "orders/" +
        order.id,
        order
    );


    if (!firebaseReady) {

        saveLocalData();

    }


    renderAll();


    toast(
        "Staff confirmed: " +
        staffName
    );

}


/* =========================================================
   27. KITCHEN
   ========================================================= */

function renderKitchen() {

    const container =
        document.getElementById(
            "kitchenOrders"
        );


    if (!container) return;


    const activeOrders =
        data.orders
            .filter(
                function (order) {

                    return (
                        order.status !==
                        "Completed"
                    );

                }
            )
            .sort(
                function (a, b) {

                    return (
                        new Date(a.createdAt) -
                        new Date(b.createdAt)
                    );

                }
            );


    if (!activeOrders.length) {

        container.innerHTML =
            "<div class='panel muted'>" +
            "Kitchen is clear." +
            "</div>";

        return;

    }


    container.innerHTML =
        activeOrders
            .map(createOrderHTML)
            .join("");

}


/* =========================================================
   28. ALL ORDERS
   ========================================================= */

function renderOrders() {

    const container =
        document.getElementById(
            "allOrders"
        );


    if (!container) return;


    const searchInput =
        document.getElementById(
            "orderSearch"
        );


    const statusInput =
        document.getElementById(
            "statusFilter"
        );


    const search =
        searchInput ?
        searchInput.value
            .toLowerCase()
        :
        "";


    const status =
        statusInput ?
        statusInput.value
        :
        "";


    const orders =
        [...data.orders]
            .reverse()
            .filter(
                function (order) {

                    const matchesStatus =
                        !status ||
                        order.status ===
                        status;


                    const matchesSearch =
                        String(
                            order.orderNumber
                        ).includes(search)
                        ||
                        String(
                            order.customerName
                        )
                        .toLowerCase()
                        .includes(search);


                    return (
                        matchesStatus &&
                        matchesSearch
                    );

                }
            );


    if (!orders.length) {

        container.innerHTML =
            "<div class='panel muted'>" +
            "No matching orders." +
            "</div>";

        return;

    }


    container.innerHTML =
        orders
            .map(createOrderHTML)
            .join("");

}


/* =========================================================
   29. CUSTOMERS
   ========================================================= */

function renderCustomers() {

    const container =
        document.getElementById(
            "customersList"
        );


    if (!container) return;


    if (!data.customers.length) {

        container.innerHTML =
            "<div class='panel muted'>" +
            "No customers yet." +
            "</div>";

        return;

    }


    container.innerHTML =
        data.customers
            .map(function (customer) {

                const balance =
                    Number(
                        customer.balance ||
                        0
                    );


                const balanceClass =
                    balance > 0 ?
                    "due" :
                    "paid";


                const balanceText =
                    balance > 0 ?
                    "Due " :
                    "Paid ";


                return (

                    "<div class='customer-card'>" +

                    "<div>" +

                    "<strong>" +
                    escapeHtml(
                        customer.name
                    ) +
                    "</strong>" +

                    "<div class='muted'>" +
                    escapeHtml(
                        customer.phone ||
                        "No phone"
                    ) +
                    "</div>" +

                    "<div class='muted'>" +

                    "Purchase " +
                    money(
                        customer.totalPurchase
                    ) +

                    " · Paid " +

                    money(
                        customer.totalPaid
                    ) +

                    "</div>" +

                    "</div>" +


                    "<div class='" +
                    balanceClass +
                    "'>" +

                    balanceText +

                    money(
                        Math.abs(balance)
                    ) +

                    "</div>" +


                    "</div>"

                );

            })
            .join("");

}


/* =========================================================
   30. ADD STAFF
   ========================================================= */

async function addStaffMember() {

    const input =
        document.getElementById(
            "staffNameInput"
        );


    const name =
        input.value.trim();


    if (!name) {

        toast(
            "Enter staff name"
        );

        return;

    }


    const staff = {

        id:
            generateId("staff"),

        name:
            name

    };


    data.staff.push(
        staff
    );


    input.value = "";


    await databasePush(
        "staff",
        staff
    );


    renderStaff();


    toast(
        "Staff added"
    );

}


/* =========================================================
   31. STAFF LIST
   ========================================================= */

function renderStaff() {

    const container =
        document.getElementById(
            "staffList"
        );


    if (!container) return;


    container.innerHTML =
        data.staff
            .map(function (staff) {

                return (

                    "<div class='staff-card'>" +

                    "<strong>" +
                    escapeHtml(
                        staff.name ||
                        staff
                    ) +
                    "</strong>" +

                    "<div class='muted'>" +
                    "Manual confirmation staff" +
                    "</div>" +

                    "</div>"

                );

            })
            .join("");

}


/* =========================================================
   32. ADD PRODUCT
   ========================================================= */

async function addProductItem() {

    const nameInput =
        document.getElementById(
            "productNameInput"
        );


    const priceInput =
        document.getElementById(
            "productPriceInput"
        );


    const name =
        nameInput.value.trim();


    const price =
        Number(
            priceInput.value || 0
        );


    if (!name || price <= 0) {

        toast(
            "Enter food name and price"
        );

        return;

    }


    const product = {

        id:
            generateId("product"),

        name:
            name,

        price:
            price

    };


    data.products.push(
        product
    );


    nameInput.value = "";

    priceInput.value = "";


    await databasePush(
        "products",
        product
    );


    renderProducts();

    renderProductSelect();


    toast(
        "Food added"
    );

}


/* =========================================================
   33. PRODUCT LIST
   ========================================================= */

function renderProducts() {

    const container =
        document.getElementById(
            "productsList"
        );


    if (!container) return;


    container.innerHTML =
        data.products
            .map(function (product) {

                return (

                    "<div class='product-card'>" +

                    "<div class='order-top'>" +

                    "<strong>" +
                    escapeHtml(
                        product.name
                    ) +
                    "</strong>" +

                    "<strong>" +
                    money(
                        product.price
                    ) +
                    "</strong>" +

                    "</div>" +

                    "</div>"

                );

            })
            .join("");

}


/* =========================================================
   34. ADD EXPENSE
   ========================================================= */

async function addExpenseItem() {

    const nameInput =
        document.getElementById(
            "expenseName"
        );


    const amountInput =
        document.getElementById(
            "expenseAmount"
        );


    const name =
        nameInput.value.trim();


    const amount =
        Number(
            amountInput.value || 0
        );


    if (!name || amount <= 0) {

        toast(
            "Enter expense and amount"
        );

        return;

    }


    const expense = {

        id:
            generateId("expense"),

        name:
            name,

        amount:
            amount,

        date:
            new Date().toISOString()

    };


    data.expenses.push(
        expense
    );


    nameInput.value = "";

    amountInput.value = "";


    await databasePush(
        "expenses",
        expense
    );


    renderExpenses();


    toast(
        "Expense added"
    );

}


/* =========================================================
   35. EXPENSE LIST
   ========================================================= */

function renderExpenses() {

    const container =
        document.getElementById(
            "expensesList"
        );


    if (!container) return;


    if (!data.expenses.length) {

        container.innerHTML =
            "<div class='panel muted'>" +
            "No expenses." +
            "</div>";

        return;

    }


    container.innerHTML =
        [...data.expenses]
            .reverse()
            .map(function (expense) {

                return (

                    "<div class='expense-card'>" +

                    "<div class='order-top'>" +

                    "<strong>" +
                    escapeHtml(
                        expense.name
                    ) +
                    "</strong>" +

                    "<strong>" +
                    money(
                        expense.amount
                    ) +
                    "</strong>" +

                    "</div>" +

                    "<div class='muted'>" +

                    new Date(
                        expense.date
                    ).toLocaleString(
                        "en-IN"
                    ) +

                    "</div>" +

                    "</div>"

                );

            })
            .join("");

}


/* =========================================================
   36. REPORT ORDERS
   ========================================================= */

function getReportOrders(type) {

    const currentDate =
        new Date();


    return data.orders.filter(
        function (order) {

            const orderDate =
                new Date(
                    order.createdAt
                );


            if (type === "day") {

                return (
                    getDateKey(
                        orderDate
                    ) ===
                    getDateKey(
                        currentDate
                    )
                );

            }


            if (type === "month") {

                return (
                    getMonthKey(
                        orderDate
                    ) ===
                    getMonthKey(
                        currentDate
                    )
                );

            }


            if (type === "year") {

                return (
                    getYearKey(
                        orderDate
                    ) ===
                    getYearKey(
                        currentDate
                    )
                );

            }


            return false;

        }
    );

}


/* =========================================================
   37. REPORT
   ========================================================= */

function renderReport() {

    const orders =
        getReportOrders(
            currentReport
        );


    const sales =
        orders.reduce(
            function (sum, order) {

                return (
                    sum +
                    Number(
                        order.total || 0
                    )
                );

            },
            0
        );


    const paid =
        orders.reduce(
            function (sum, order) {

                return (
                    sum +
                    Number(
                        order.paid || 0
                    )
                );

            },
            0
        );


    const due =
        orders.reduce(
            function (sum, order) {

                return (
                    sum +
                    Number(
                        order.due || 0
                    )
                );

            },
            0
        );


    const ordersElement =
        document.getElementById(
            "reportOrders"
        );


    const salesElement =
        document.getElementById(
            "reportSales"
        );


    const paidElement =
        document.getElementById(
            "reportPaid"
        );


    const dueElement =
        document.getElementById(
            "reportDue"
        );


    if (ordersElement) {

        ordersElement.textContent =
            orders.length;

    }


    if (salesElement) {

        salesElement.textContent =
            money(sales);

    }


    if (paidElement) {

        paidElement.textContent =
            money(paid);

    }


    if (dueElement) {

        dueElement.textContent =
            money(due);

    }


    const paymentTotals = {};


    orders.forEach(
        function (order) {

            const method =
                order.paymentMethod ||
                "Other";


            paymentTotals[method] =
                (
                    paymentTotals[method] ||
                    0
                ) +
                Number(
                    order.paid || 0
                );

        }
    );


    const paymentElement =
        document.getElementById(
            "paymentReport"
        );


    if (!paymentElement) return;


    const methods =
        Object.entries(
            paymentTotals
        );


    if (!methods.length) {

        paymentElement.innerHTML =
            "<div class='muted'>" +
            "No payments." +
            "</div>";

        return;

    }


    paymentElement.innerHTML =
        methods
            .map(function (item) {

                return (

                    "<div class='report-line'>" +

                    "<span>" +
                    escapeHtml(
                        item[0]
                    ) +
                    "</span>" +

                    "<strong>" +
                    money(
                        item[1]
                    ) +
                    "</strong>" +

                    "</div>"

                );

            })
            .join("");

}


/* =========================================================
   38. ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        function (character) {

            const map = {

                "&":
                    "&amp;",

                "<":
                    "&lt;",

                ">":
                    "&gt;",

                '"':
                    "&quot;",

                "'":
                    "&#039;"

            };


            return map[
                character
            ];

        }
    );

}


/* =========================================================
   39. TOAST MESSAGE
   ========================================================= */

function toast(message) {

    const element =
        document.getElementById(
            "toast"
        );


    if (!element) return;


    element.textContent =
        message;


    element.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            function () {

                element.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* =========================================================
   40. MAKE FUNCTIONS AVAILABLE TO HTML
   ========================================================= */

window.removeCartItem =
    removeCartItem;

window.changeOrderStatus =
    changeOrderStatus;

window.confirmStaff =
    confirmStaff;
