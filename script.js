// ---------- Elements ----------
var loginPage = document.getElementById("loginPage");
var app = document.getElementById("app");

var loginForm = document.getElementById("loginForm");
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginError = document.getElementById("loginError");
var loginTitle = document.getElementById("loginTitle");
var loginBtn = document.getElementById("loginBtn");
var switchText = document.getElementById("switchText");
var switchLink = document.getElementById("switchLink");

var form = document.getElementById("transactionForm");
var descriptionInput = document.getElementById("description");
var amountInput = document.getElementById("amount");
var typeInput = document.getElementById("type");
var categoryInput = document.getElementById("category");
var dateInput = document.getElementById("date");
var transactionList = document.getElementById("transactionList");
var searchInput = document.getElementById("search");

var udhaarForm = document.getElementById("udhaarForm");
var uType = document.getElementById("uType");
var uName = document.getElementById("uName");
var uAmount = document.getElementById("uAmount");
var uDate = document.getElementById("uDate");
var uDue = document.getElementById("uDue");
var uRemind = document.getElementById("uRemind");
var uNote = document.getElementById("uNote");

// ---------- Variables ----------
var currentUser = null;
var transactions = [];
var editingId = null;
var isRegisterMode = false;

var udhaarItems = [];
var editingUdhaarId = null;
var udhaarFilter = "pending";

var profile = { photo: "", theme: "mint" };
var themeNames = ["mint", "sunset", "ocean", "aurora", "night", "photo"];
var currentCurrency = localStorage.getItem("fintrackCurrency") || "INR";

var currentView = "main";
var toastTimer = null;

// ---------- Helper functions for storage ----------
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem("fintrackUsers")) || {};
    } catch (error) {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem("fintrackUsers", JSON.stringify(users));
}

function getDataKey() {
    return "fintrackTransactions_" + currentUser;
}

function loadData() {
    try {
        transactions = JSON.parse(localStorage.getItem(getDataKey())) || [];
    } catch (error) {
        transactions = [];
    }
}

function saveData() {
    localStorage.setItem(getDataKey(), JSON.stringify(transactions));
}

// ---------- Small helpers ----------
function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

function round2(number) {
    return Math.round(number * 100) / 100;
}

function todayString() {
    var d = new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + day;
    }
    return d.getFullYear() + "-" + month + "-" + day;
}

function parseDay(text) {
    return new Date(text + "T00:00:00");
}

function daysBetween(fromText, toText) {
    return Math.round((parseDay(toText) - parseDay(fromText)) / 86400000);
}

function shortDate(text) {
    return parseDay(text).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// ---------- Profile (photo + background theme) ----------
function profileKey() {
    return "fintrackProfile_" + currentUser;
}

function loadProfile() {
    profile = { photo: "", theme: "mint" };
    try {
        var saved = JSON.parse(localStorage.getItem(profileKey()));
        if (saved) {
            profile.photo = saved.photo || "";
            if (themeNames.indexOf(saved.theme) !== -1) {
                profile.theme = saved.theme;
            }
        }
    } catch (error) {}
}

function saveProfile() {
    try {
        localStorage.setItem(profileKey(), JSON.stringify(profile));
    } catch (error) {
        alert("Could not save the photo (storage is full). Try a smaller photo.");
    }
}

function applyProfile() {
    var letter = currentUser ? currentUser.charAt(0).toUpperCase() : "?";
    var avatars = document.querySelectorAll(".avatar");

    avatars.forEach(function (avatar) {
        if (profile.photo) {
            avatar.style.backgroundImage = 'url("' + profile.photo + '")';
            avatar.textContent = "";
        } else {
            avatar.style.backgroundImage = "";
            avatar.textContent = letter;
        }
    });

    var theme = profile.theme;
    if (theme === "photo" && !profile.photo) {
        theme = "mint";
    }

    document.body.setAttribute("data-theme", theme);
    document.getElementById("bgLayer").style.backgroundImage =
        theme === "photo" ? 'url("' + profile.photo + '")' : "";

    var photoSwatch = document.getElementById("photoSwatch");
    if (profile.photo) {
        photoSwatch.style.backgroundImage = 'url("' + profile.photo + '")';
        photoSwatch.textContent = "";
    } else {
        photoSwatch.style.backgroundImage = "";
        photoSwatch.textContent = "📷";
    }

    document.querySelectorAll(".theme-swatch").forEach(function (swatch) {
        swatch.classList.toggle("active", swatch.getAttribute("data-theme") === theme);
    });
}

function openProfile() {
    document.getElementById("profileName").textContent = currentUser;
    document.getElementById("profileModal").classList.remove("hidden");
}

function closeProfile() {
    document.getElementById("profileModal").classList.add("hidden");
}

document.querySelectorAll(".avatar-open").forEach(function (avatar) {
    avatar.addEventListener("click", openProfile);
    avatar.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProfile();
        }
    });
});

document.getElementById("profileClose").addEventListener("click", closeProfile);
document.getElementById("profileDone").addEventListener("click", closeProfile);
document.getElementById("profileModal").addEventListener("click", function (event) {
    if (event.target === this) {
        closeProfile();
    }
});

document.getElementById("photoUpload").addEventListener("click", function () {
    document.getElementById("photoInput").click();
});
document.getElementById("bigAvatar").addEventListener("click", function () {
    document.getElementById("photoInput").click();
});

document.getElementById("photoInput").addEventListener("change", function () {
    var input = this;
    var file = input.files[0];
    if (!file) return;

    if (file.type.indexOf("image/") !== 0) {
        alert("Please choose an image file.");
        input.value = "";
        return;
    }

    var reader = new FileReader();
    reader.onload = function () {
        var img = new Image();
        img.onload = function () {
            var size = 320;
            var canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            var side = Math.min(img.width, img.height);
            var sx = (img.width - side) / 2;
            var sy = (img.height - side) / 2;
            canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);

            profile.photo = canvas.toDataURL("image/jpeg", 0.85);
            saveProfile();
            applyProfile();
        };
        img.onerror = function () {
            alert("Could not read this image. Try a JPG or PNG photo.");
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
    input.value = "";
});

document.getElementById("photoRemove").addEventListener("click", function () {
    profile.photo = "";
    if (profile.theme === "photo") {
        profile.theme = "mint";
    }
    saveProfile();
    applyProfile();
});

document.getElementById("themeRow").addEventListener("click", function (event) {
    var swatch = event.target.closest(".theme-swatch");
    if (!swatch) return;

    var theme = swatch.getAttribute("data-theme");
    if (theme === "photo" && !profile.photo) {
        alert("Upload a profile photo first, then you can use it as the background.");
        return;
    }

    profile.theme = theme;
    saveProfile();
    applyProfile();
});

// ---------- Views (Dashboard / Udhaar / Calculator / Settings) ----------
var views = { main: "viewMain", udhaar: "viewUdhaar", calc: "viewCalc", settings: "viewSettings" };

function showView(name) {
    Object.keys(views).forEach(function (key) {
        document.getElementById(views[key]).classList.toggle("hidden", key !== name);
    });

    if (name !== currentView) {
        window.scrollTo(0, 0);
    }
    currentView = name;

    var titles = {
        main: "Dashboard",
        udhaar: "Udhaar",
        calc: "Calculator",
        settings: "Settings"
    };
    var texts = {
        main: "Welcome " + currentUser + "! Here's your financial overview.",
        udhaar: "Keep track of money you gave and money you took.",
        calc: "Quick calculations, right here.",
        settings: "Manage your account, currency, and app data."
    };
    document.getElementById("pageTitle").textContent = titles[name];
    document.getElementById("welcome").textContent = texts[name];

    document.querySelectorAll(".nav").forEach(function (link) {
        var isThis = link.getAttribute("data-view") === name && !link.getAttribute("data-target");
        link.classList.toggle("active", isThis);
    });
}

document.querySelectorAll(".nav").forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        showView(link.getAttribute("data-view"));

        document.querySelectorAll(".nav").forEach(function (other) {
            other.classList.remove("active");
        });
        link.classList.add("active");

        var targetId = link.getAttribute("data-target");
        if (targetId) {
            document.getElementById(targetId).scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
});

// ---------- Toast ----------
function showToast(message, onClick) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");

    toast.onclick = function () {
        toast.classList.add("hidden");
        if (onClick) onClick();
    };

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.classList.add("hidden");
    }, 7000);
}

// ---------- Login / Register ----------
function showLoginPage() {
    loginPage.classList.remove("hidden");
    app.classList.add("hidden");
}

function showApp() {
    loginPage.classList.add("hidden");
    app.classList.remove("hidden");

    document.getElementById("userName").textContent = currentUser;

    loadProfile();
    applyProfile();

    loadData();
    loadUdhaar();

    resetForm();
    resetUdhaarForm();
    searchInput.value = "";
    renderTransactions();
    updateDashboard();

    var reminders = renderUdhaar();
    showView("main");

    if (reminders > 0) {
        var word = reminders === 1 ? "udhaar reminder" : "udhaar reminders";
        showToast("⏰ " + reminders + " " + word + " - tap to view", function () {
            showView("udhaar");
        });
    }
}

switchLink.addEventListener("click", function (event) {
    event.preventDefault();
    isRegisterMode = !isRegisterMode;
    loginError.textContent = "";

    if (isRegisterMode) {
        loginTitle.textContent = "Create a new account";
        loginBtn.textContent = "Register";
        switchText.textContent = "Already have an account?";
        switchLink.textContent = "Login";
    } else {
        loginTitle.textContent = "Login to your account";
        loginBtn.textContent = "Login";
        switchText.textContent = "New here?";
        switchLink.textContent = "Create an account";
    }
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var username = usernameInput.value.trim().toLowerCase();
    var password = passwordInput.value;
    var users = getUsers();

    if (username === "" || password === "") {
        loginError.textContent = "Please fill both fields.";
        return;
    }

    if (isRegisterMode) {
        if (password.length < 4) {
            loginError.textContent = "Password must be at least 4 characters.";
            return;
        }
        if (users[username]) {
            loginError.textContent = "This username is already taken.";
            return;
        }
        users[username] = password;
        saveUsers(users);
    } else {
        if (!users[username] || users[username] !== password) {
            loginError.textContent = "Wrong username or password.";
            return;
        }
    }

    currentUser = username;
    localStorage.setItem("fintrackCurrentUser", username);

    loginForm.reset();
    loginError.textContent = "";
    showApp();
});

function logout() {
    localStorage.removeItem("fintrackCurrentUser");
    currentUser = null;
    transactions = [];
    udhaarItems = [];
    profile = { photo: "", theme: "mint" };

    applyProfile();
    closeProfile();
    document.getElementById("toast").classList.add("hidden");
    showLoginPage();
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutBtn2").addEventListener("click", logout);
document.getElementById("logoutBtn3").addEventListener("click", logout);

// ---------- Today's date ----------
var today = new Date();
var localToday = todayString();
dateInput.value = localToday;

document.getElementById("today").textContent =
    today.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// ---------- Money format ----------
function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currentCurrency
    }).format(amount);
}

// ---------- Transactions Add / Edit / Delete ----------
function resetForm() {
    editingId = null;
    form.reset();
    dateInput.value = todayString();
    document.getElementById("formHeading").textContent = "Add Transaction";
    document.getElementById("submitBtn").textContent = "+ Add Transaction";
    document.getElementById("cancelEdit").classList.add("hidden");
}

document.getElementById("cancelEdit").addEventListener("click", resetForm);

form.addEventListener("submit", function (event) {
    event.preventDefault();

    var desc = descriptionInput.value.trim();
    var amt = parseFloat(amountInput.value);
    var type = typeInput.value;
    var cat = categoryInput.value;
    var date = dateInput.value;

    if (!desc || isNaN(amt) || amt <= 0 || !date) return;

    if (editingId !== null) {
        for (var i = 0; i < transactions.length; i++) {
            if (transactions[i].id === editingId) {
                transactions[i].description = desc;
                transactions[i].amount = round2(amt);
                transactions[i].type = type;
                transactions[i].category = cat;
                transactions[i].date = date;
                break;
            }
        }
        showToast("Transaction updated!");
    } else {
        transactions.unshift({
            id: Date.now(),
            description: desc,
            amount: round2(amt),
            type: type,
            category: cat,
            date: date
        });
        showToast("Transaction added!");
    }

    saveData();
    resetForm();
    renderTransactions();
    updateDashboard();
});

function renderTransactions() {
    var query = searchInput.value.trim().toLowerCase();
    transactionList.innerHTML = "";

    var filtered = transactions.filter(function (item) {
        return (
            item.description.toLowerCase().indexOf(query) !== -1 ||
            item.category.toLowerCase().indexOf(query) !== -1 ||
            item.date.indexOf(query) !== -1
        );
    });

    document.getElementById("emptyMessage").classList.toggle("hidden", filtered.length > 0);

    filtered.forEach(function (item) {
        var tr = document.createElement("tr");

        var tdDesc = makeEl("td", "", item.description);
        var tdCat = makeEl("td", "", item.category);
        var tdDate = makeEl("td", "", shortDate(item.date));

        var sign = item.type === "income" ? "+ " : "- ";
        var amtClass = item.type === "income" ? "positive" : "negative";
        var tdAmt = makeEl("td", amtClass, sign + formatMoney(item.amount));

        var tdAct = document.createElement("td");

        var editBtn = makeEl("button", "action-btn", "Edit");
        editBtn.type = "button";
        editBtn.onclick = function () {
            editingId = item.id;
            typeInput.value = item.type;
            descriptionInput.value = item.description;
            amountInput.value = item.amount;
            categoryInput.value = item.category;
            dateInput.value = item.date;
            document.getElementById("formHeading").textContent = "Edit Transaction";
            document.getElementById("submitBtn").textContent = "Save Changes";
            document.getElementById("cancelEdit").classList.remove("hidden");
            form.scrollIntoView({ behavior: "smooth" });
        };

        var delBtn = makeEl("button", "action-btn delete-btn", "Delete");
        delBtn.type = "button";
        delBtn.onclick = function () {
            transactions = transactions.filter(function (t) {
                return t.id !== item.id;
            });
            saveData();
            if (editingId === item.id) resetForm();
            renderTransactions();
            updateDashboard();
            showToast("Transaction deleted.");
        };

        tdAct.appendChild(editBtn);
        tdAct.appendChild(delBtn);

        tr.appendChild(tdDesc);
        tr.appendChild(tdCat);
        tr.appendChild(tdDate);
        tr.appendChild(tdAmt);
        tr.appendChild(tdAct);
        transactionList.appendChild(tr);
    });
}

searchInput.addEventListener("input", renderTransactions);

// ---------- Dashboard ----------
function updateDashboard() {
    var totalIncome = 0;
    var totalExpense = 0;

    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].type === "income") {
            totalIncome += transactions[i].amount;
        } else {
            totalExpense += transactions[i].amount;
        }
    }

    var balance = totalIncome - totalExpense;

    document.getElementById("income").textContent = formatMoney(totalIncome);
    document.getElementById("expense").textContent = formatMoney(totalExpense);
    document.getElementById("balance").textContent = formatMoney(balance);

    var maxValue = Math.max(totalIncome, totalExpense, 1);

    document.getElementById("incomeBar").style.height = (totalIncome / maxValue * 140) + "px";
    document.getElementById("expenseBar").style.height = (totalExpense / maxValue * 140) + "px";

    updateComparison();
    updateCircle(totalIncome, totalExpense);
    updateCategoryChart();
}

// ---------- Expenses by category (circle chart) ----------
var categoryColors = {
    Food: "#f2a93b",
    Travel: "#287cc4",
    Shopping: "#e76b72",
    Fashion: "#2ec4d6",
    Education: "#8a6fd1",
    Entertainment: "#e07bb5",
    Salary: "#20b486",
    Other: "#7f8da3"
};

function updateCategoryChart() {
    var circle = document.getElementById("categoryCircle");
    var legend = document.getElementById("categoryLegend");
    legend.innerHTML = "";

    var totals = {};
    var totalExpense = 0;

    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].type === "expense") {
            var name = transactions[i].category;
            totals[name] = (totals[name] || 0) + transactions[i].amount;
            totalExpense += transactions[i].amount;
        }
    }

    document.getElementById("categoryTotal").textContent = formatMoney(totalExpense);

    var names = Object.keys(totals);
    if (names.length === 0) {
        circle.style.background = "#e9edf3";
        legend.appendChild(makeEl("p", "empty", "No expenses yet."));
        return;
    }

    names.sort(function (a, b) {
        return totals[b] - totals[a];
    });

    var parts = [];
    var start = 0;

    names.forEach(function (name, index) {
        var percent = totals[name] / totalExpense * 100;
        var end = index === names.length - 1 ? 100 : start + percent;

        var color = categoryColors[name] || "#7f8da3";
        parts.push(color + " " + start + "% " + end + "%");
        start = end;

        var row = document.createElement("p");
        var dot = makeEl("span", "dot");
        dot.style.background = color;
        var label = makeEl("span", "", name);
        var value = makeEl("strong", "", formatMoney(totals[name]) + " (" + Math.round(percent) + "%)");

        row.appendChild(dot);
        row.appendChild(label);
        row.appendChild(value);
        legend.appendChild(row);
    });

    circle.style.background = "conic-gradient(" + parts.join(", ") + ")";
}

// ---------- Circle / Bar Chart Toggle ----------
function updateCircle(totalIncome, totalExpense) {
    var circle = document.getElementById("circle");
    var total = totalIncome + totalExpense;

    if (total === 0) {
        circle.style.background = "#e9edf3";
        document.getElementById("circleBig").textContent = "0%";
        document.getElementById("legendIncome").textContent = formatMoney(0) + " (0%)";
        document.getElementById("legendExpense").textContent = formatMoney(0) + " (0%)";
        return;
    }

    var incomePercent = Math.round(totalIncome / total * 100);
    var expensePercent = 100 - incomePercent;

    circle.style.background =
        "conic-gradient(#20b486 0% " + incomePercent + "%, #e76b72 " + incomePercent + "% 100%)";

    document.getElementById("circleBig").textContent = expensePercent + "%";
    document.getElementById("legendIncome").textContent = formatMoney(totalIncome) + " (" + incomePercent + "%)";
    document.getElementById("legendExpense").textContent = formatMoney(totalExpense) + " (" + expensePercent + "%)";
}

document.getElementById("barBtn").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("circleBtn").classList.remove("active");
    document.getElementById("barChart").classList.remove("hidden");
    document.getElementById("circleChart").classList.add("hidden");
});

document.getElementById("circleBtn").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("barBtn").classList.remove("active");
    document.getElementById("circleChart").classList.remove("hidden");
    document.getElementById("barChart").classList.add("hidden");
});

// ---------- Monthly comparison ----------
function getMonthKey(date) {
    var month = date.getMonth() + 1;
    if (month < 10) month = "0" + month;
    return date.getFullYear() + "-" + month;
}

function getMonthTotals(monthKey) {
    var income = 0;
    var expense = 0;
    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].date.substring(0, 7) === monthKey) {
            if (transactions[i].type === "income") {
                income += transactions[i].amount;
            } else {
                expense += transactions[i].amount;
            }
        }
    }
    return { income: income, expense: expense, balance: income - expense };
}

function formatDiff(diff) {
    if (diff === 0) return "—";
    var sign = diff > 0 ? "+" : "-";
    return sign + formatMoney(Math.abs(diff));
}

function updateComparison() {
    var now = new Date();
    var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    var thisKey = getMonthKey(now);
    var lastKey = getMonthKey(prev);

    var thisName = now.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    var lastName = prev.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

    document.getElementById("thisMonthName").textContent = thisName;
    document.getElementById("lastMonthName").textContent = lastName;
    document.getElementById("compareNote").textContent = "Comparing " + lastName + " vs " + thisName;

    var cur = getMonthTotals(thisKey);
    var old = getMonthTotals(lastKey);

    document.getElementById("lastIncome").textContent = formatMoney(old.income);
    document.getElementById("thisIncome").textContent = formatMoney(cur.income);
    var incDiff = cur.income - old.income;
    var incEl = document.getElementById("changeIncome");
    incEl.textContent = formatDiff(incDiff);
    incEl.className = incDiff > 0 ? "positive" : incDiff < 0 ? "negative" : "";

    document.getElementById("lastExpense").textContent = formatMoney(old.expense);
    document.getElementById("thisExpense").textContent = formatMoney(cur.expense);
    var expDiff = cur.expense - old.expense;
    var expEl = document.getElementById("changeExpense");
    expEl.textContent = formatDiff(expDiff);
    expEl.className = expDiff < 0 ? "positive" : expDiff > 0 ? "negative" : "";

    document.getElementById("lastBalance").textContent = formatMoney(old.balance);
    document.getElementById("thisBalance").textContent = formatMoney(cur.balance);
    var balDiff = cur.balance - old.balance;
    var balEl = document.getElementById("changeBalance");
    balEl.textContent = formatDiff(balDiff);
    balEl.className = balDiff > 0 ? "positive" : balDiff < 0 ? "negative" : "";
}

// ---------- Udhaar (Lend / Borrow) ----------
function udhaarKey() {
    return "fintrackUdhaar_" + currentUser;
}

function loadUdhaar() {
    try {
        udhaarItems = JSON.parse(localStorage.getItem(udhaarKey())) || [];
    } catch (e) {
        udhaarItems = [];
    }
}

function saveUdhaar() {
    localStorage.setItem(udhaarKey(), JSON.stringify(udhaarItems));
}

uType.addEventListener("change", function () {
    if (this.value === "lent") {
        document.getElementById("uNameLabel").textContent = "Who did you give it to?";
        document.getElementById("uDueLabel").textContent = "They will return it by";
    } else {
        document.getElementById("uNameLabel").textContent = "Who did you take it from?";
        document.getElementById("uDueLabel").textContent = "You will return it by";
    }
});

function resetUdhaarForm() {
    editingUdhaarId = null;
    udhaarForm.reset();
    uDate.value = todayString();
    uDue.value = todayString();
    document.getElementById("udhaarFormTitle").textContent = "Add Udhaar";
    document.getElementById("uSubmit").textContent = "+ Add Udhaar";
    document.getElementById("uCancel").classList.add("hidden");
    document.getElementById("uNameLabel").textContent = "Who did you give it to?";
    document.getElementById("uDueLabel").textContent = "They will return it by";
}

document.getElementById("uCancel").addEventListener("click", resetUdhaarForm);

udhaarForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var item = {
        id: editingUdhaarId || Date.now(),
        type: uType.value,
        name: uName.value.trim(),
        amount: round2(parseFloat(uAmount.value)),
        date: uDate.value,
        due: uDue.value,
        remind: parseInt(uRemind.value, 10),
        note: uNote.value.trim(),
        settled: false
    };

    if (editingUdhaarId) {
        for (var i = 0; i < udhaarItems.length; i++) {
            if (udhaarItems[i].id === editingUdhaarId) {
                item.settled = udhaarItems[i].settled;
                udhaarItems[i] = item;
                break;
            }
        }
        showToast("Udhaar updated!");
    } else {
        udhaarItems.unshift(item);
        showToast("Udhaar added!");
    }

    saveUdhaar();
    resetUdhaarForm();
    renderUdhaar();
});

document.getElementById("udhaarTabs").addEventListener("click", function (e) {
    var btn = e.target.closest(".switch-btn");
    if (!btn) return;
    document.querySelectorAll("#udhaarTabs .switch-btn").forEach(function (b) {
        b.classList.remove("active");
    });
    btn.classList.add("active");
    udhaarFilter = btn.getAttribute("data-filter");
    renderUdhaar();
});

function renderUdhaar() {
    var list = document.getElementById("udhaarList");
    var empty = document.getElementById("udhaarEmpty");
    list.innerHTML = "";

    var toReceive = 0;
    var toPay = 0;
    var reminderCount = 0;
    var todayStr = todayString();

    udhaarItems.forEach(function (item) {
        if (!item.settled) {
            if (item.type === "lent") toReceive += item.amount;
            else toPay += item.amount;

            var daysLeft = daysBetween(todayStr, item.due);
            if (daysLeft <= item.remind) {
                reminderCount++;
            }
        }
    });

    document.getElementById("toReceive").textContent = formatMoney(toReceive);
    document.getElementById("toPay").textContent = formatMoney(toPay);

    var badge = document.getElementById("udhaarBadge");
    badge.textContent = reminderCount;
    badge.classList.toggle("hidden", reminderCount === 0);

    var filtered = udhaarItems.filter(function (item) {
        if (udhaarFilter === "pending") return !item.settled;
        if (udhaarFilter === "settled") return item.settled;
        return !item.settled && item.type === udhaarFilter;
    });

    if (filtered.length === 0) {
        empty.textContent = "No udhaar entries in this tab.";
        empty.classList.remove("hidden");
        return reminderCount;
    }
    empty.classList.add("hidden");

    filtered.forEach(function (item) {
        var row = makeEl("div", "u-item" + (item.settled ? " done" : ""));
        var avatar = makeEl("div", "u-avatar " + (item.type === "lent" ? "gave" : "took"), item.name.charAt(0).toUpperCase());

        var info = makeEl("div", "u-info");
        info.appendChild(makeEl("strong", "", item.name));
        info.appendChild(makeEl("small", "", (item.type === "lent" ? "Gave on " : "Took on ") + shortDate(item.date)));
        if (item.note) {
            info.appendChild(makeEl("small", "u-note", "“" + item.note + "”"));
        }

        var amtBox = makeEl("div", "u-amount");
        var amtSpan = makeEl("span", item.type === "lent" ? "positive" : "negative", formatMoney(item.amount));
        amtBox.appendChild(amtSpan);
        amtBox.appendChild(makeEl("small", "", "Due: " + shortDate(item.due)));

        var statusBox = makeEl("div", "u-status");
        var daysLeft = daysBetween(todayStr, item.due);
        var chip;
        if (item.settled) {
            chip = makeEl("span", "chip settled", "Settled");
        } else if (daysLeft < 0) {
            chip = makeEl("span", "chip overdue", "Overdue by " + Math.abs(daysLeft) + "d");
        } else if (daysLeft === 0) {
            chip = makeEl("span", "chip due", "Due today");
        } else if (daysLeft <= item.remind) {
            chip = makeEl("span", "chip due", "Due in " + daysLeft + "d");
        } else {
            chip = makeEl("span", "chip later", "Due in " + daysLeft + "d");
        }
        statusBox.appendChild(chip);

        var actions = makeEl("div", "u-actions");
        var settleBtn = makeEl("button", "action-btn done-btn", item.settled ? "Reopen" : "Mark Settled");
        settleBtn.type = "button";
        settleBtn.onclick = function () {
            item.settled = !item.settled;
            saveUdhaar();
            renderUdhaar();
        };

        var editBtn = makeEl("button", "action-btn", "Edit");
        editBtn.type = "button";
        editBtn.onclick = function () {
            editingUdhaarId = item.id;
            uType.value = item.type;
            uType.dispatchEvent(new Event("change"));
            uName.value = item.name;
            uAmount.value = item.amount;
            uDate.value = item.date;
            uDue.value = item.due;
            uRemind.value = item.remind;
            uNote.value = item.note;
            document.getElementById("udhaarFormTitle").textContent = "Edit Udhaar";
            document.getElementById("uSubmit").textContent = "Save Changes";
            document.getElementById("uCancel").classList.remove("hidden");
            udhaarForm.scrollIntoView({ behavior: "smooth" });
        };

        var delBtn = makeEl("button", "action-btn delete-btn", "Delete");
        delBtn.type = "button";
        delBtn.onclick = function () {
            udhaarItems = udhaarItems.filter(function (u) { return u.id !== item.id; });
            saveUdhaar();
            renderUdhaar();
            showToast("Udhaar deleted.");
        };

        actions.appendChild(settleBtn);
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        row.appendChild(avatar);
        row.appendChild(info);
        row.appendChild(amtBox);
        row.appendChild(statusBox);
        row.appendChild(actions);
        list.appendChild(row);
    });

    return reminderCount;
}

// ---------- Calculator ----------
var calcExprStr = "";
var calcResEl = document.getElementById("calcResult");
var calcExprEl = document.getElementById("calcExpr");

document.getElementById("calcKeys").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    var key = btn.getAttribute("data-key");

    calcResEl.classList.remove("calc-error");

    if (key === "C") {
        calcExprStr = "";
        calcExprEl.textContent = "";
        calcResEl.textContent = "0";
    } else if (key === "⌫") {
        calcExprStr = calcExprStr.slice(0, -1);
        calcResEl.textContent = calcExprStr || "0";
    } else if (key === "=") {
        if (!calcExprStr) return;
        try {
            var clean = calcExprStr
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-")
                .replace(/%/g, "/100");
            var val = Function('"use strict";return (' + clean + ')')();
            if (!isFinite(val)) throw new Error();
            calcExprEl.textContent = calcExprStr + " =";
            calcExprStr = String(round2(val));
            calcResEl.textContent = calcExprStr;
        } catch (err) {
            calcResEl.textContent = "Invalid Expression";
            calcResEl.classList.add("calc-error");
            calcExprStr = "";
        }
    } else {
        calcExprStr += key;
        calcResEl.textContent = calcExprStr;
    }
});

document.getElementById("calcUse").addEventListener("click", function () {
    var num = parseFloat(calcResEl.textContent);
    if (!isNaN(num) && num > 0) {
        showView("main");
        amountInput.value = round2(num);
        amountInput.focus();
        showToast("Amount copied to form!");
    } else {
        showToast("Calculate a valid positive number first.");
    }
});

// ---------- Settings Logic ----------
var currencySelect = document.getElementById("currencySelect");
currencySelect.value = currentCurrency;

currencySelect.addEventListener("change", function () {
    currentCurrency = this.value;
    localStorage.setItem("fintrackCurrency", currentCurrency);
    updateDashboard();
    renderTransactions();
    renderUdhaar();
    showToast("Currency changed to " + currentCurrency);
});

document.getElementById("openProfileFromSettings").addEventListener("click", openProfile);

document.getElementById("changePasswordForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var newPass = document.getElementById("newPassword").value;
    if (newPass.length < 4) {
        alert("Password must be at least 4 characters.");
        return;
    }
    var users = getUsers();
    users[currentUser] = newPass;
    saveUsers(users);
    this.reset();
    showToast("✅ Password updated!");
});

document.getElementById("exportDataBtn").addEventListener("click", function () {
    var backup = {
        user: currentUser,
        exportedAt: new Date().toISOString(),
        transactions: transactions,
        udhaar: udhaarItems
    };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "FinTrack_" + currentUser + "_Backup.json";
    a.click();
    showToast("Backup downloaded!");
});

document.getElementById("resetDataBtn").addEventListener("click", function () {
    if (confirm("Are you sure? This will delete all your transactions and udhaar records permanently.")) {
        transactions = [];
        udhaarItems = [];
        saveData();
        saveUdhaar();
        renderTransactions();
        updateDashboard();
        renderUdhaar();
        showToast("All data reset.");
    }
});

// ---------- Auto Login Check on Page Load ----------
var savedUser = localStorage.getItem("fintrackCurrentUser");
if (savedUser && getUsers()[savedUser]) {
    currentUser = savedUser;
    showApp();
} else {
    showLoginPage();
}