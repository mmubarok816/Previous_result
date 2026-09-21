// ============================================================
// MAHIRA FAST FOOD POS
// Firebase + POS + Products + Staff + Orders + Reports
// ============================================================


// ================= FIREBASE IMPORTS =================

import {
    initializeApp
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";


import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


import {
    getDatabase,
    ref,
    onValue,
    set,
    update,
    remove,
    push,
    runTransaction,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

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


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getDatabase(app);


const storage =
    getStorage(app);


// ============================================================
// AUTO LOGIN
// ============================================================

setPersistence(
    auth,
    browserLocalPersistence
)
.catch(error => {

    console.error(
        "Persistence error:",
        error
    );

});


// ============================================================
// SECONDARY APP FOR STAFF
// ============================================================

const staffApp =
    initializeApp(
        firebaseConfig,
        "StaffCreator"
    );


const staffAuth =
    getAuth(staffApp);


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUser = null;

let currentUserData = null;

let products = {};

let staff = {};

let orders = {};

let notifications = {};

let cart = [];

let selectedPayment = "Cash";

let listenersStarted = false;


// ============================================================
// LOGIN
// ============================================================

window.login = async function () {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    const message =
        document
            .getElementById("loginMessage");


    if (!email || !password) {

        message.innerText =
            "Enter email and password.";

        return;
    }


    message.innerText =
        "Logging in...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        message.innerText = "";

    } catch (error) {

        console.error(error);

        message.innerText =
            getFirebaseError(error);
    }
};


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        if (user) {

            currentUser =
                user;


            document
                .getElementById(
                    "loginPage"
                )
                .style.display =
                "none";


            document
                .getElementById(
                    "app"
                )
                .style.display =
                "block";


            await loadUser(user);


            if (!listenersStarted) {

                startFirebaseListeners();

                listenersStarted = true;
            }

        } else {

            currentUser =
                null;

            currentUserData =
                null;

            listenersStarted =
                false;


            document
                .getElementById(
                    "loginPage"
                )
                .style.display =
                "flex";


            document
                .getElementById(
                    "app"
                )
                .style.display =
                "none";
        }
    }
);


// ============================================================
// LOAD USER
// ============================================================

async function loadUser(user) {

    const userRef =
        ref(
            db,
            "users/" + user.uid
        );


    onValue(

        userRef,

        snapshot => {

            if (snapshot.exists()) {

                currentUserData =
                    snapshot.val();

            } else {

                currentUserData = {

                    name:
                        user.email,

                    email:
                        user.email,

                    role:
                        "staff",

                    active:
                        true
                };
            }


            updateUserUI();

        },

        error => {

            console.error(
                "User error:",
                error
            );
        }
    );
}


// ============================================================
// USER UI
// ============================================================

function updateUserUI() {

    if (!currentUser)
        return;


    const name =
        currentUserData?.name ||
        currentUser.email;


    const role =
        currentUserData?.role ||
        "staff";


    const roleText =
        role.charAt(0).toUpperCase() +
        role.slice(1);


    const roleElement =
        document.getElementById(
            "userRole"
        );


    const welcomeElement =
        document.getElementById(
            "welcomeUser"
        );


    if (roleElement) {

        roleElement.innerText =
            roleText;
    }


    if (welcomeElement) {

        welcomeElement.innerText =
            "Welcome, " + name;
    }


    applyPermissions();
}


// ============================================================
// PERMISSIONS
// ============================================================

function applyPermissions() {

    if (!currentUserData)
        return;


    const role =
        currentUserData.role;


    const staffButton =
        document.querySelector(
            '[onclick="openStaff()"]'
        );


    const reportsButton =
        document.querySelector(
            '[onclick="openReports()"]'
        );


    const productButton =
        document.querySelector(
            '[onclick="openProducts()"]'
        );


    if (staffButton) {

        staffButton.style.display =
            role === "owner"
                ? "block"
                : "none";
    }


    if (reportsButton) {

        reportsButton.style.display =
            role === "cashier" ||
            role === "kitchen"
                ? "none"
                : "block";
    }


    if (productButton) {

        productButton.style.display =
            role === "owner" ||
            role === "manager"
                ? "block"
                : "none";
    }
}


// ============================================================
// FIREBASE LISTENERS
// ============================================================

function startFirebaseListeners() {

    listenProducts();

    listenStaff();

    listenOrders();

    listenNotifications();
}


// ============================================================
// PRODUCTS LISTENER
// ============================================================

function listenProducts() {

    const productsRef =
        ref(db, "products");


    onValue(

        productsRef,

        snapshot => {

            products =
                snapshot.val() || {};


            updateProductCount();

            renderPOSProducts();

            renderProductManagement();

        },

        error => {

            console.error(
                "Products error:",
                error
            );
        }
    );
}


// ============================================================
// STAFF LISTENER
// ============================================================

function listenStaff() {

    const staffRef =
        ref(db, "staff");


    onValue(

        staffRef,

        snapshot => {

            staff =
                snapshot.val() || {};


            updateStaffCount();

            renderStaffManagement();

        },

        error => {

            console.error(
                "Staff error:",
                error
            );
        }
    );
}


// ============================================================
// ORDERS LISTENER
// ============================================================

function listenOrders() {

    const ordersRef =
        ref(db, "orders");


    onValue(

        ordersRef,

        snapshot => {

            orders =
                snapshot.val() || {};


            updateSalesDashboard();

            renderReports();

            renderOrders();

        },

        error => {

            console.error(
                "Orders error:",
                error
            );
        }
    );
}


// ============================================================
// NOTIFICATIONS LISTENER
// ============================================================

function listenNotifications() {

    const notificationsRef =
        ref(
            db,
            "notifications"
        );


    onValue(

        notificationsRef,

        snapshot => {

            notifications =
                snapshot.val() || {};


            updateNotificationCount();

            renderNotifications();

        },

        error => {

            console.error(
                "Notification error:",
                error
            );
        }
    );
}


// ============================================================
// PRODUCT COUNT
// ============================================================

function updateProductCount() {

    const element =
        document.getElementById(
            "productCount"
        );


    if (element) {

        element.innerText =
            Object.keys(
                products
            ).length;
    }
}


// ============================================================
// STAFF COUNT
// ============================================================

function updateStaffCount() {

    const element =
        document.getElementById(
            "staffCount"
        );


    if (element) {

        element.innerText =
            Object.keys(
                staff
            ).length;
    }
}


// ============================================================
// INDIA DATE
// ============================================================

function indiaDateKey() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {

            timeZone:
                "Asia/Kolkata",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(
        new Date()
    );
}


// ============================================================
// DASHBOARD SALES
// ============================================================

function updateSalesDashboard() {

    let todaySales = 0;

    let todayOrders = 0;


    const today =
        indiaDateKey();


    Object.values(orders)
        .forEach(order => {

            if (!order)
                return;


            if (
                order.dateKey ===
                today
            ) {

                todaySales +=
                    Number(
                        order.total || 0
                    );


                todayOrders++;
            }
        });


    const salesElement =
        document.getElementById(
            "todaySales"
        );


    const ordersElement =
        document.getElementById(
            "todayOrders"
        );


    if (salesElement) {

        salesElement.innerText =
            "₹" +
            todaySales.toFixed(2);
    }


    if (ordersElement) {

        ordersElement.innerText =
            todayOrders;
    }
}


// ============================================================
// NOTIFICATION COUNT
// ============================================================

function updateNotificationCount() {

    let count = 0;


    Object.values(notifications)
        .forEach(notification => {

            if (
                notification &&
                notification.read === false
            ) {

                count++;
            }
        });


    const element =
        document.getElementById(
            "notificationCount"
        );


    if (element) {

        element.innerText =
            count > 99
                ? "99+"
                : count;
    }
}


// ============================================================
// NAVIGATION
// ============================================================

function hideAllPages() {

    document
        .querySelectorAll(
            ".app-page"
        )
        .forEach(page => {

            page.style.display =
                "none";
        });


    const modal =
        document.getElementById(
            "saleCheckout"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


function showDashboard() {

    hideAllPages();


    const main =
        document.querySelector(
            "#app main"
        );


    const header =
        document.querySelector(
            "#app .header"
        );


    if (main) {

        main.style.display =
            "block";
    }


    if (header) {

        header.style.display =
            "flex";
    }
}


function showPage(id) {

    const main =
        document.querySelector(
            "#app main"
        );


    const header =
        document.querySelector(
            "#app .header"
        );


    if (main) {

        main.style.display =
            "none";
    }


    if (header) {

        header.style.display =
            "flex";
    }


    hideAllPages();


    const page =
        document.getElementById(id);


    if (page) {

        page.style.display =
            "block";
    }
}


// ============================================================
// OPEN POS
// ============================================================

window.openPOS =
function () {

    if (
        currentUserData?.role ===
        "kitchen"
    ) {

        alert(
            "Kitchen staff cannot create sales."
        );

        return;
    }


    showPage("posPage");

    renderPOSProducts();

    renderCart();
};


// ============================================================
// CLOSE POS
// ============================================================

window.closePOS =
function () {

    showDashboard();
};


// ============================================================
// OPEN PRODUCTS
// ============================================================

window.openProducts =
function () {

    if (
        currentUserData?.role !==
            "owner" &&
        currentUserData?.role !==
            "manager"
    ) {

        alert(
            "You do not have permission."
        );

        return;
    }


    showPage(
        "productsPage"
    );

    renderProductManagement();
};


// ============================================================
// OPEN STAFF
// ============================================================

window.openStaff =
function () {

    if (
        currentUserData?.role !==
        "owner"
    ) {

        alert(
            "Only the owner can manage staff."
        );

        return;
    }


    showPage(
        "staffPage"
    );

    renderStaffManagement();
};


// ============================================================
// OPEN REPORTS
// ============================================================

window.openReports =
function () {

    if (
        currentUserData?.role ===
            "cashier" ||
        currentUserData?.role ===
            "kitchen"
    ) {

        alert(
            "You do not have permission."
        );

        return;
    }


    showPage(
        "reportsPage"
    );

    renderReports();
};


// ============================================================
// CLOSE PAGE
// ============================================================

window.closeAppPage =
function () {

    showDashboard();
};


// ============================================================
// PRODUCT IMAGE UPLOAD
// ============================================================

async function uploadProductImage(file) {

    if (!file)
        return "";


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "Please select an image."
        );
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        throw new Error(
            "Image must be smaller than 5MB."
        );
    }


    const fileName =
        Date.now() +
        "_" +
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );


    const imageRef =
        storageRef(
            storage,
            "products/" +
            fileName
        );


    await uploadBytes(
        imageRef,
        file
    );


    return await getDownloadURL(
        imageRef
    );
}


// ============================================================
// ADD PRODUCT
// ============================================================

window.addFirebaseProduct =
async function () {

    if (
        currentUserData?.role !==
            "owner" &&
        currentUserData?.role !==
            "manager"
    ) {

        alert(
            "You do not have permission."
        );

        return;
    }


    const name =
        document
            .getElementById(
                "productName"
            )
            .value
            .trim();


    const price =
        Number(
            document
                .getElementById(
                    "productPrice"
                )
                .value
        );


    const stock =
        Number(
            document
                .getElementById(
                    "productStock"
                )
                .value
        );


    const imageInput =
        document.getElementById(
            "productImage"
        );


    const file =
        imageInput?.files?.[0];


    if (!name) {

        alert(
            "Enter product name."
        );

        return;
    }


    if (
        Number.isNaN(price) ||
        price < 0
    ) {

        alert(
            "Enter a valid price."
        );

        return;
    }


    if (
        Number.isNaN(stock) ||
        stock < 0
    ) {

        alert(
            "Enter valid stock."
        );

        return;
    }


    try {

        const button =
            document.querySelector(
                "#productsPage .primary-btn"
            );


        if (button) {

            button.disabled =
                true;

            button.innerText =
                "Uploading...";
        }


        let imageUrl = "";


        if (file) {

            imageUrl =
                await uploadProductImage(
                    file
                );
        }


        const productRef =
            push(
                ref(
                    db,
                    "products"
                )
            );


        await set(

            productRef,

            {

                name:
                    name,

                price:
                    price,

                stock:
                    stock,

                imageUrl:
                    imageUrl,

                active:
                    true,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    currentUser.uid
            }
        );


        document.getElementById(
            "productName"
        ).value = "";


        document.getElementById(
            "productPrice"
        ).value = "";


        document.getElementById(
            "productStock"
        ).value = "";


        document.getElementById(
            "productImage"
        ).value = "";


        alert(
            "Product added successfully."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Product error:\n" +
            error.message
        );

    } finally {

        const button =
            document.querySelector(
                "#productsPage .primary-btn"
            );


        if (button) {

            button.disabled =
                false;

            button.innerText =
                "+ Add Product";
        }
    }
};


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProductManagement() {

    const container =
        document.getElementById(
            "productManagementList"
        );


    if (!container)
        return;


    const list =
        Object.entries(products);


    if (list.length === 0) {

        container.innerHTML =
            "<p>No products added yet.</p>";

        return;
    }


    container.innerHTML = "";


    list.forEach(
        ([id, product]) => {

            if (!product)
                return;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "management-item";


            const image =
                product.imageUrl

                    ? `
                        <img
                            src="${escapeHtml(
                                product.imageUrl
                            )}"
                            style="
                                width:55px;
                                height:55px;
                                object-fit:cover;
                                border-radius:10px;
                            "
                        >
                      `

                    : "🍽️";


            item.innerHTML = `

                <div
                    style="
                        display:flex;
                        gap:10px;
                        align-items:center;
                    "
                >

                    ${image}

                    <div>

                        <strong>
                            ${escapeHtml(
                                product.name
                            )}
                        </strong>

                        <div>
                            ₹${Number(
                                product.price || 0
                            ).toFixed(2)}
                        </div>

                        <small>
                            Stock:
                            ${Number(
                                product.stock || 0
                            )}
                        </small>

                    </div>

                </div>


                <button
                    onclick="
                        deleteFirebaseProduct(
                            '${id}'
                        )
                    "
                >
                    🗑️
                </button>
            `;


            container.appendChild(
                item
            );
        }
    );
}


// ============================================================
// DELETE PRODUCT
// ============================================================

window.deleteFirebaseProduct =
async function (id) {

    if (
        currentUserData?.role !==
            "owner" &&
        currentUserData?.role !==
            "manager"
    ) {

        alert(
            "You do not have permission."
        );

        return;
    }


    const product =
        products[id];


    if (!product)
        return;


    if (
        !confirm(
            "Delete " +
            product.name +
            "?"
        )
    ) {

        return;
    }


    try {

        await remove(
            ref(
                db,
                "products/" +
                id
            )
        );


        alert(
            "Product deleted."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Delete failed."
        );
    }
};


// ============================================================
// POS PRODUCTS
// ============================================================

window.renderPOSProducts =
function () {

    const container =
        document.getElementById(
            "posProducts"
        );


    if (!container)
        return;


    const search =
        (
            document
                .getElementById(
                    "posSearch"
                )
                ?.value ||
            ""
        )
        .toLowerCase()
        .trim();


    container.innerHTML = "";


    Object.entries(products)
        .forEach(
            ([id, product]) => {

                if (!product)
                    return;


                if (
                    product.active ===
                    false
                )
                    return;


                const name =
                    String(
                        product.name ||
                        ""
                    );


                if (
                    search &&
                    !name
                        .toLowerCase()
                        .includes(search)
                ) {

                    return;
                }


                const stock =
                    Number(
                        product.stock || 0
                    );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "pos-product";


                card.onclick =
                    function () {

                        addToCart(id);
                    };


                const image =
                    product.imageUrl

                        ? `
                            <img
                                src="${escapeHtml(
                                    product.imageUrl
                                )}"
                                style="
                                    width:100%;
                                    height:110px;
                                    object-fit:cover;
                                    border-radius:12px;
                                "
                            >
                          `

                        : `
                            <div
                                style="
                                    font-size:45px;
                                    text-align:center;
                                    padding:20px;
                                "
                            >
                                🍽️
                            </div>
                          `;


                card.innerHTML = `

                    ${image}

                    <strong>
                        ${escapeHtml(
                            name
                        )}
                    </strong>

                    <span>
                        ₹${Number(
                            product.price || 0
                        ).toFixed(2)}
                    </span>

                    <small>
                        ${
                            stock > 0

                            ? "Stock: " +
                              stock

                            : "OUT OF STOCK"
                        }
                    </small>

                `;


                if (stock <= 0) {

                    card.style.opacity =
                        "0.5";

                    card.onclick =
                        null;
                }


                container.appendChild(
                    card
                );
            }
        );
};


// ============================================================
// ADD TO CART
// ============================================================

function addToCart(id) {

    const product =
        products[id];


    if (!product)
        return;


    const stock =
        Number(
            product.stock || 0
        );


    if (stock <= 0) {

        alert(
            "This product is out of stock."
        );

        return;
    }


    const existing =
        cart.find(
            item =>
                item.id === id
        );


    if (existing) {

        if (
            existing.qty >=
            stock
        ) {

            alert(
                "No more stock available."
            );

            return;
        }


        existing.qty++;

    } else {

        cart.push({

            id:
                id,

            name:
                product.name,

            price:
                Number(
                    product.price || 0
                ),

            qty:
                1
        });
    }


    renderCart();
}


// ============================================================
// CHANGE CART
// ============================================================

window.changeCartQty =
function (id, amount) {

    const item =
        cart.find(
            x =>
                x.id === id
        );


    if (!item)
        return;


    const product =
        products[id];


    const stock =
        Number(
            product?.stock || 0
        );


    item.qty +=
        amount;


    if (
        item.qty <= 0
    ) {

        cart =
            cart.filter(
                x =>
                    x.id !== id
            );

    } else if (
        item.qty > stock
    ) {

        item.qty =
            stock;


        alert(
            "Maximum stock: " +
            stock
        );
    }


    renderCart();
};


// ============================================================
// CART TOTAL
// ============================================================

function getCartTotal() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            return total +
                (
                    Number(
                        item.price
                    ) *
                    Number(
                        item.qty
                    )
                );

        },
        0
    );
}


// ============================================================
// RENDER CART
// ============================================================

function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    if (!container)
        return;


    container.innerHTML =
        "";


    if (
        cart.length === 0
    ) {

        container.innerHTML =
            "<p>Your cart is empty.</p>";

    } else {

        cart.forEach(
            item => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "cart-row";


                row.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHtml(
                                item.name
                            )}
                        </strong>

                        <br>

                        ₹${Number(
                            item.price
                        ).toFixed(2)}

                    </div>


                    <div
                        class="cart-controls"
                    >

                        <button
                            onclick="
                                changeCartQty(
                                    '${item.id}',
                                    -1
                                )
                            "
                        >
                            −
                        </button>


                        <strong>
                            ${item.qty}
                        </strong>


                        <button
                            onclick="
                                changeCartQty(
                                    '${item.id}',
                                    1
                                )
                            "
                        >
                            +
                        </button>

                    </div>
                `;


                container.appendChild(
                    row
                );
            }
        );
    }


    if (totalElement) {

        totalElement.innerText =
            "₹" +
            getCartTotal()
                .toFixed(2);
    }
}


// ============================================================
// OPEN CHECKOUT
// ============================================================

window.openSaleCheckout =
function () {

    if (
        cart.length === 0
    ) {

        alert(
            "Add products to cart first."
        );

        return;
    }


    document
        .getElementById(
            "checkoutAmount"
        )
        .innerText =
        "₹" +
        getCartTotal()
            .toFixed(2);


    selectedPayment =
        "Cash";


    updatePaymentButtons();

    populateCheckoutStaff();


    document
        .getElementById(
            "saleCheckout"
        )
        .style.display =
        "flex";
};


// ============================================================
// CLOSE CHECKOUT
// ============================================================

window.closeSaleCheckout =
function () {

    const modal =
        document.getElementById(
            "saleCheckout"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
};


// ============================================================
// PAYMENT
// ============================================================

window.setPayment =
function (payment) {

    selectedPayment =
        payment;


    updatePaymentButtons();
};


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
            selectedPayment ===
                "Cash"
        );
    }


    if (upi) {

        upi.classList.toggle(
            "selected",
            selectedPayment ===
                "UPI"
        );
    }
}


// ============================================================
// CHECKOUT STAFF
// ============================================================

function populateCheckoutStaff() {

    const select =
        document.getElementById(
            "checkoutStaff"
        );


    if (!select)
        return;


    select.innerHTML =
        "";


    const role =
        currentUserData?.role;


    if (
        role !== "owner"
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            currentUser.uid;


        option.textContent =
            currentUserData?.name ||
            currentUser.email;


        select.appendChild(
            option
        );


        select.disabled =
            true;


        return;
    }


    select.disabled =
        false;


    const ownerOption =
        document.createElement(
            "option"
        );


    ownerOption.value =
        currentUser.uid;


    ownerOption.textContent =
        (
            currentUserData?.name ||
            currentUser.email
        ) +
        " (Owner)";


    select.appendChild(
        ownerOption
    );


    Object.entries(staff)
        .forEach(
            ([id, person]) => {

                if (!person)
                    return;


                if (
                    person.active ===
                    false
                )
                    return;


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    id;


                option.textContent =
                    person.name ||
                    person.email ||
                    id;


                select.appendChild(
                    option
                );
            }
        );
}


// ============================================================
// COMPLETE SALE
// ============================================================

window.completeFirebaseSale =
async function () {

    if (
        cart.length === 0
    ) {

        alert(
            "Cart is empty."
        );

        return;
    }


    const checkoutButton =
        document.querySelector(
            "#saleCheckout .primary-btn"
        );


    let stockChanged =
        false;


    try {

        if (checkoutButton) {

            checkoutButton.disabled =
                true;

            checkoutButton.innerText =
                "Processing...";
        }


        const staffSelect =
            document.getElementById(
                "checkoutStaff"
            );


        const staffId =
            staffSelect?.value ||
            currentUser.uid;


        let staffName =
            currentUserData?.name ||
            currentUser.email;


        if (
            staffId !==
            currentUser.uid
        ) {

            staffName =
                staff[staffId]?.name ||
                staff[staffId]?.email ||
                staffId;
        }


        const total =
            getCartTotal();


        // ----------------------------------------------------
        // STOCK TRANSACTION
        // ----------------------------------------------------

        let stockError =
            "";


        const transactionResult =
            await runTransaction(

                ref(
                    db,
                    "products"
                ),

                current => {

                    if (!current) {

                        stockError =
                            "Products not found.";

                        return;
                    }


                    const updated = {
                        ...current
                    };


                    // Check stock

                    for (
                        const item
                        of cart
                    ) {

                        const product =
                            updated[
                                item.id
                            ];


                        if (!product) {

                            stockError =
                                item.name +
                                " no longer exists.";

                            return;
                        }


                        const available =
                            Number(
                                product.stock ||
                                0
                            );


                        if (
                            available <
                            item.qty
                        ) {

                            stockError =
                                item.name +
                                " has only " +
                                available +
                                " left.";

                            return;
                        }
                    }


                    // Deduct stock

                    for (
                        const item
                        of cart
                    ) {

                        const product =
                            updated[
                                item.id
                            ];


                        updated[
                            item.id
                        ] = {

                            ...product,

                            stock:
                                Number(
                                    product.stock ||
                                    0
                                ) -
                                Number(
                                    item.qty
                                )
                        };
                    }


                    return updated;
                }
            );


        if (
            !transactionResult.committed
        ) {

            throw new Error(
                stockError ||
                "Stock changed. Try again."
            );
        }


        stockChanged =
            true;


        // ----------------------------------------------------
        // ORDER NUMBER
        // ----------------------------------------------------

        const counterResult =
            await runTransaction(

                ref(
                    db,
                    "settings/orderNumber"
                ),

                current => {

                    return (
                        Number(
                            current || 0
                        ) + 1
                    );
                }
            );


        const orderNumber =
            Number(
                counterResult
                    .snapshot
                    .val()
            );


        // ----------------------------------------------------
        // ORDER ITEMS
        // ----------------------------------------------------

        const orderItems =
            {};


        cart.forEach(
            item => {

                orderItems[
                    item.id
                ] = {

                    name:
                        item.name,

                    price:
                        Number(
                            item.price
                        ),

                    qty:
                        Number(
                            item.qty
                        ),

                    subtotal:
                        Number(
                            item.price
                        ) *
                        Number(
                            item.qty
                        )
                };
            }
        );


        // ----------------------------------------------------
        // ORDER
        // ----------------------------------------------------

        const orderRef =
            push(
                ref(
                    db,
                    "orders"
                )
            );


        const order = {

            orderNumber:
                orderNumber,

            staffId:
                staffId,

            staffName:
                staffName,

            payment:
                selectedPayment,

            total:
                total,

            dateKey:
                indiaDateKey(),

            createdAt:
                serverTimestamp(),

            createdBy:
                currentUser.uid,

            items:
                orderItems
        };


        await set(
            orderRef,
            order
        );


        // ----------------------------------------------------
        // SALE NOTIFICATION
        // ----------------------------------------------------

        await createSaleNotification(
            orderNumber,
            staffName,
            total,
            selectedPayment
        );


        // ----------------------------------------------------
        // LOW STOCK
        // ----------------------------------------------------

        await createLowStockNotifications(
            transactionResult
                .snapshot
                .val()
        );


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        cart = [];


        renderCart();


        closeSaleCheckout();


        alert(
            "Sale completed!\n\n" +
            "Order #" +
            orderNumber +
            "\n" +
            "Total: ₹" +
            total.toFixed(2)
        );

    } catch (error) {

        console.error(
            "SALE ERROR:",
            error
        );


        // Rollback if stock was
        // already deducted

        if (stockChanged) {

            try {

                await rollbackStock();

            } catch (
                rollbackError
            ) {

                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }
        }


        alert(
            "Sale failed:\n" +
            error.message
        );

    } finally {

        if (checkoutButton) {

            checkoutButton.disabled =
                false;

            checkoutButton.innerText =
                "✓ COMPLETE SALE";
        }
    }


    // --------------------------------------------------------
    // ROLLBACK
    // --------------------------------------------------------

    async function rollbackStock() {

        await runTransaction(

            ref(
                db,
                "products"
            ),

            current => {

                if (!current)
                    return;


                const updated = {
                    ...current
                };


                cart.forEach(
                    item => {

                        const product =
                            updated[
                                item.id
                            ];


                        if (product) {

                            updated[
                                item.id
                            ] = {

                                ...product,

                                stock:
                                    Number(
                                        product.stock ||
                                        0
                                    ) +
                                    Number(
                                        item.qty
                                    )
                            };
                        }
                    }
                );


                return updated;
            }
        );
    }
};


// ============================================================
// SALE NOTIFICATION
// ============================================================

async function createSaleNotification(
    orderNumber,
    staffName,
    total,
    payment
) {

    try {

        const notificationRef =
            push(
                ref(
                    db,
                    "notifications"
                )
            );


        await set(

            notificationRef,

            {

                title:
                    "New Sale",

                message:
                    "Order #" +
                    orderNumber +
                    " • " +
                    staffName +
                    " • ₹" +
                    Number(
                        total
                    ).toFixed(2) +
                    " • " +
                    payment,

                type:
                    "sale",

                orderNumber:
                    orderNumber,

                staffName:
                    staffName,

                total:
                    total,

                payment:
                    payment,

                read:
                    false,

                createdAt:
                    Date.now()
            }
        );

    } catch (error) {

        console.error(
            "Sale notification error:",
            error
        );
    }
}


// ============================================================
// LOW STOCK NOTIFICATION
// ============================================================

async function createLowStockNotifications(
    updatedProducts
) {

    if (!updatedProducts)
        return;


    const updates = {};

    const today =
        indiaDateKey();


    Object.entries(
        updatedProducts
    )
    .forEach(
        ([id, product]) => {

            if (!product)
                return;


            const stock =
                Number(
                    product.stock ||
                    0
                );


            if (
                stock <= 5
            ) {

                const notificationId =
                    "lowstock_" +
                    id +
                    "_" +
                    today;


                updates[
                    "notifications/" +
                    notificationId
                ] = {

                    title:
                        "Low Stock",

                    message:
                        product.name +
                        " has only " +
                        stock +
                        " left.",

                    type:
                        "low_stock",

                    productId:
                        id,

                    read:
                        false,

                    createdAt:
                        Date.now()
                };
            }
        }
    );


    if (
        Object.keys(updates)
            .length > 0
    ) {

        await update(
            ref(db),
            updates
        );
    }
}


// ============================================================
// ADD STAFF
// ============================================================

window.addFirebaseStaff =
async function () {

    if (
        currentUserData?.role !==
        "owner"
    ) {

        alert(
            "Only owner can add staff."
        );

        return;
    }


    const name =
        document
            .getElementById(
                "newStaffName"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "newStaffEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "newStaffPassword"
            )
            .value;


    const phone =
        document
            .getElementById(
                "newStaffPhone"
            )
            .value
            .trim();


    const role =
        document
            .getElementById(
                "newStaffRole"
            )
            .value;


    const shift =
        document
            .getElementById(
                "newStaffShift"
            )
            .value;


    if (!name) {

        alert(
            "Enter staff name."
        );

        return;
    }


    if (!email) {

        alert(
            "Enter staff email."
        );

        return;
    }


    if (
        password.length < 6
    ) {

        alert(
            "Password must be at least 6 characters."
        );

        return;
    }


    try {

        const credential =
            await createUserWithEmailAndPassword(
                staffAuth,
                email,
                password
            );


        const uid =
            credential.user.uid;


        await set(

            ref(
                db,
                "users/" +
                uid
            ),

            {

                name:
                    name,

                email:
                    email,

                phone:
                    phone,

                role:
                    role,

                active:
                    true,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    currentUser.uid
            }
        );


        await set(

            ref(
                db,
                "staff/" +
                uid
            ),

            {

                name:
                    name,

                email:
                    email,

                phone:
                    phone,

                role:
                    role,

                shift:
                    shift,

                active:
                    true,

                createdAt:
                    serverTimestamp()
            }
        );


        await signOut(
            staffAuth
        );


        document
            .getElementById(
                "newStaffName"
            ).value = "";


        document
            .getElementById(
                "newStaffEmail"
            ).value = "";


        document
            .getElementById(
                "newStaffPassword"
            ).value = "";


        document
            .getElementById(
                "newStaffPhone"
            ).value = "";


        alert(
            "Staff account created successfully."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Staff creation failed:\n" +
            getFirebaseError(error)
        );
    }
};


// ============================================================
// RENDER STAFF
// ============================================================

function renderStaffManagement() {

    const container =
        document.getElementById(
            "staffManagementList"
        );


    if (!container)
        return;


    const list =
        Object.entries(staff);


    if (
        list.length === 0
    ) {

        container.innerHTML =
            "<p>No staff added yet.</p>";

        return;
    }


    container.innerHTML =
        "";


    list.forEach(
        ([id, person]) => {

            if (!person)
                return;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "staff-item";


            item.innerHTML = `

                <div>

                    <strong>
                        ${escapeHtml(
                            person.name ||
                            "Staff"
                        )}
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(
                            person.email ||
                            ""
                        )}
                    </small>

                    <br>

                    <small>
                        ${escapeHtml(
                            person.role ||
                            ""
                        )}
                        •
                        ${escapeHtml(
                            person.shift ||
                            ""
                        )}
                    </small>

                    <br>

                    <small>

                        ${
                            person.active !== false

                            ? "🟢 Active"

                            : "🔴 Disabled"
                        }

                    </small>

                </div>


                <button
                    onclick="
                        toggleStaff(
                            '${id}'
                        )
                    "
                >

                    ${
                        person.active !== false

                        ? "Disable"

                        : "Enable"
                    }

                </button>
            `;


            container.appendChild(
                item
            );
        }
    );
}


// ============================================================
// TOGGLE STAFF
// ============================================================

window.toggleStaff =
async function (uid) {

    if (
        currentUserData?.role !==
        "owner"
    ) {

        alert(
            "Only owner can manage staff."
        );

        return;
    }


    const person =
        staff[uid];


    if (!person)
        return;


    const newStatus =
        person.active === false;


    try {

        await update(

            ref(
                db,
                "staff/" +
                uid
            ),

            {
                active:
                    newStatus
            }
        );


        await update(

            ref(
                db,
                "users/" +
                uid
            ),

            {
                active:
                    newStatus
            }
        );

    } catch (error) {

        console.error(error);

        alert(
            "Could not update staff."
        );
    }
};


// ============================================================
// REPORTS
// ============================================================

function renderReports() {

    const today =
        indiaDateKey();


    let todaySales =
        0;


    let todayOrders =
        0;


    let cash =
        0;


    let upi =
        0;


    const staffSales =
        {};


    Object.values(orders)
        .forEach(
            order => {

                if (!order)
                    return;


                if (
                    order.dateKey !==
                    today
                )
                    return;


                const total =
                    Number(
                        order.total ||
                        0
                    );


                todaySales +=
                    total;


                todayOrders++;


                if (
                    order.payment ===
                    "UPI"
                ) {

                    upi +=
                        total;

                } else {

                    cash +=
                        total;
                }


                const staffId =
                    order.staffId ||
                    "unknown";


                if (
                    !staffSales[
                        staffId
                    ]
                ) {

                    staffSales[
                        staffId
                    ] = {

                        name:
                            order.staffName ||
                            "Unknown",

                        sales:
                            0,

                        orders:
                            0
                    };
                }


                staffSales[
                    staffId
                ].sales +=
                    total;


                staffSales[
                    staffId
                ].orders++;
            }
        );


    const salesElement =
        document.getElementById(
            "reportTodaySales"
        );


    const ordersElement =
        document.getElementById(
            "reportTodayOrders"
        );


    if (salesElement) {

        salesElement.innerText =
            "₹" +
            todaySales.toFixed(2);
    }


    if (ordersElement) {

        ordersElement.innerText =
            todayOrders;
    }


    const staffContainer =
        document.getElementById(
            "staffSalesReport"
        );


    if (staffContainer) {

        staffContainer.innerHTML =
            "";


        const entries =
            Object.values(
                staffSales
            );


        if (
            entries.length === 0
        ) {

            staffContainer.innerHTML =
                "<p>No sales today.</p>";

        } else {

            entries
                .sort(
                    (a, b) =>
                        b.sales -
                        a.sales
                )
                .forEach(
                    data => {

                        const row =
                            document.createElement(
                                "div"
                            );


                        row.className =
                            "report-row";


                        row.innerHTML = `

                            <span>
                                ${escapeHtml(
                                    data.name
                                )}
                            </span>

                            <strong>
                                ₹${data.sales.toFixed(2)}
                                (${data.orders})
                            </strong>

                        `;


                        staffContainer
                            .appendChild(
                                row
                            );
                    }
                );
        }
    }


    const paymentContainer =
        document.getElementById(
            "paymentReport"
        );


    if (paymentContainer) {

        paymentContainer.innerHTML = `

            <div class="report-row">

                <span>
                    💵 Cash
                </span>

                <strong>
                    ₹${cash.toFixed(2)}
                </strong>

            </div>


            <div class="report-row">

                <span>
                    📱 UPI
                </span>

                <strong>
                    ₹${upi.toFixed(2)}
                </strong>

            </div>


            <div class="report-row">

                <span>
                    Total
                </span>

                <strong>
                    ₹${todaySales.toFixed(2)}
                </strong>

            </div>

        `;
    }
}


// ============================================================
// ORDERS
// ============================================================

function renderOrders() {

    const container =
        document.getElementById(
            "firebaseOrdersList"
        );


    if (!container)
        return;


    const list =
        Object.entries(
            orders
        )
        .filter(
            ([, order]) =>
                order
        )
        .sort(
            ([, a], [, b]) =>
                Number(
                    b.createdAt || 0
                ) -
                Number(
                    a.createdAt || 0
                )
        )
        .slice(
            0,
            50
        );


    if (
        list.length === 0
    ) {

        container.innerHTML =
            "<p>No orders yet.</p>";

        return;
    }


    container.innerHTML =
        "";


    list.forEach(
        ([, order]) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "management-item";


            const itemCount =
                order.items
                    ? Object.keys(
                        order.items
                    ).length
                    : 0;


            item.innerHTML = `

                <div>

                    <strong>
                        Order #${
                            order.orderNumber ||
                            "-"
                        }
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(
                            order.staffName ||
                            "Unknown"
                        )}
                    </small>

                    <br>

                    <small>

                        ${itemCount}
                        item(s)

                        •

                        ${escapeHtml(
                            order.payment ||
                            ""
                        )}

                    </small>

                </div>


                <strong>

                    ₹${Number(
                        order.total ||
                        0
                    ).toFixed(2)}

                </strong>

            `;


            container.appendChild(
                item
            );
        }
    );
}


// ============================================================
// NOTIFICATIONS
// ============================================================

window.openNotifications =
function () {

    const panel =
        document.getElementById(
            "notificationPanel"
        );


    if (!panel)
        return;


    panel.style.display =
        "block";


    renderNotifications();
};


window.closeNotifications =
function () {

    const panel =
        document.getElementById(
            "notificationPanel"
        );


    if (panel) {

        panel.style.display =
            "none";
    }
};


function renderNotifications() {

    const container =
        document.getElementById(
            "notificationList"
        );


    if (!container)
        return;


    const list =
        Object.entries(
            notifications
        )
        .filter(
            ([, notification]) =>
                notification
        )
        .sort(
            ([, a], [, b]) =>
                Number(
                    b.createdAt || 0
                ) -
                Number(
                    a.createdAt || 0
                )
        );


    if (
        list.length === 0
    ) {

        container.innerHTML = `

            <p class="empty-notification">

                🔔 No notifications

            </p>

        `;

        return;
    }


    container.innerHTML =
        "";


    list.forEach(
        ([id, notification]) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item";


            if (
                notification.read ===
                false
            ) {

                item.classList.add(
                    "unread"
                );
            }


            let icon =
                "🔔";


            if (
                notification.type ===
                "sale"
            ) {

                icon =
                    "🛒";

            } else if (
                notification.type ===
                "low_stock"
            ) {

                icon =
                    "⚠️";

            } else if (
                notification.type ===
                "order"
            ) {

                icon =
                    "🧾";

            } else if (
                notification.type ===
                "payment"
            ) {

                icon =
                    "💰";
            }


            item.innerHTML = `

                <strong>

                    ${icon}

                    ${escapeHtml(
                        notification.title ||
                        "Notification"
                    )}

                </strong>


                <p>

                    ${escapeHtml(
                        notification.message ||
                        ""
                    )}

                </p>


                <small>

                    ${formatNotificationTime(
                        notification.createdAt
                    )}

                </small>

            `;


            item.onclick =
                function () {

                    markNotificationRead(
                        id
                    );
                };


            container.appendChild(
                item
            );
        }
    );
}


// ============================================================
// MARK NOTIFICATION READ
// ============================================================

async function markNotificationRead(
    id
) {

    try {

        await update(

            ref(
                db,
                "notifications/" +
                id
            ),

            {
                read:
                    true
            }
        );

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );
    }
}


// ============================================================
// NOTIFICATION TIME
// ============================================================

function formatNotificationTime(
    timestamp
) {

    if (!timestamp)
        return "Just now";


    const date =
        new Date(
            Number(
                timestamp
            )
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Just now";
    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle:
                "short",

            timeStyle:
                "short"
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

window.logout =
async function () {

    try {

        await signOut(
            auth
        );


        cart = [];


        showDashboard();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
    }
};


// ============================================================
// ONLINE / OFFLINE
// ============================================================

window.addEventListener(
    "online",
    () => {

        console.log(
            "Internet connection restored."
        );
    }
);


window.addEventListener(
    "offline",
    () => {

        console.log(
            "Offline mode."
        );
    }
);


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );
}


// ============================================================
// FIREBASE AUTH ERROR
// ============================================================

function getFirebaseError(
    error
) {

    switch (
        error.code
    ) {

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "User not found.";

        case "auth/wrong-password":
            return "Wrong password.";

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/too-many-requests":
            return "Too many attempts. Try again later.";

        case "auth/network-request-failed":
            return "Network error. Check your internet.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        default:
            return (
                error.message ||
                "Something went wrong."
            );
    }
}
