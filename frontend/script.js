const API_URL = "http://localhost:5000/api";

let allCampaignsCache = []; // Global Cache for Filter/Search

// 🔒 ROUTE GUARD: Unauthenticated users ko auth.html par redirect karein
(function protectRoute() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user && !window.location.pathname.includes('auth.html')) {
        window.location.href = 'auth.html';
    }
})();

// 1. READ ALL CAMPAIGNS
async function loadAllCampaigns() {
    try {
        const response = await fetch(`${API_URL}/campaigns`);
        allCampaignsCache = await response.json();
        renderCampaigns(allCampaignsCache);
    } catch (error) {
        console.error("Error loading campaigns:", error);
    }
}

// 2. RENDER CAMPAIGNS IN DOM
function renderCampaigns(campaigns) {
    const container = document.getElementById("campaigns-list");
    if (!container) return;
    container.innerHTML = "";

    if (campaigns.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#777; grid-column: 1/-1;'>No campaigns found matching your search or filter.</p>";
        return;
    }

    campaigns.forEach(campaign => {
        let percentage = campaign.goalAmount > 0 
            ? Math.min(Math.round((campaign.raisedAmount / campaign.goalAmount) * 100), 100) 
            : 0;

        // Note: Title double quotes safety fix applied for onclick handlers
        let safeTitle = campaign.title.replace(/'/g, "\\'");

        let cardHTML = `
            <article class="campaign-card">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="background: #e0f2f1; color: #00796b; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                            🏷️ ${campaign.category || 'General'}
                        </span>
                        
                        <span style="font-size: 13px; color: #555; background: #f0f0f0; padding: 4px 10px; border-radius: 12px; font-weight: 600;">
                            👤 ${campaign.creatorName || 'Anonymous'}
                        </span>
                    </div>

                    <h4 style="margin-top: 10px; margin-bottom: 8px;">${campaign.title}</h4>
                    <p style="color: #555; font-size: 14px; margin-bottom: 15px;">${campaign.description}</p>
                </div>
                
                <div>
                    <div class="progress-container">
                        <div class="stats">
                            <span>Raised: $${campaign.raisedAmount.toLocaleString()}</span>
                            <span>Goal: $${campaign.goalAmount.toLocaleString()} (${percentage}%)</span>
                        </div>
                        <progress value="${percentage}" max="100"></progress>
                    </div>

                    <div style="margin-top: 15px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="pledgeAmount('${campaign.id}', '${safeTitle}')" style="flex: 2;">Back Project 💳</button>
                        <button onclick="editCampaign('${campaign.id}', '${safeTitle}', '${campaign.description.replace(/'/g, "\\'")}', ${campaign.goalAmount}, '${campaign.category}')" style="background-color: #2196F3; flex: 1;">Edit ✏️</button>
                        <button onclick="deleteCampaign('${campaign.id}')" style="background-color: #f44336; flex: 1;">Delete 🗑️</button>
                    </div>
                </div>
            </article>
        `;

        container.innerHTML += cardHTML;
    });
}

// 3. SEARCH & CATEGORY FILTER
function filterCampaigns() {
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-filter");

    if (!searchInput || !categorySelect) return;

    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;

    const filtered = allCampaignsCache.filter(campaign => {
        const matchesSearch = campaign.title.toLowerCase().includes(searchText) || 
                              campaign.description.toLowerCase().includes(searchText) ||
                              (campaign.creatorName && campaign.creatorName.toLowerCase().includes(searchText));
                              
        const matchesCategory = selectedCategory === "All" || campaign.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    renderCampaigns(filtered);
}

// 4. CREATE NEW CAMPAIGN
async function createNewCampaign(event) {
    event.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert("Please Login first to launch a campaign!");
        window.location.href = "auth.html";
        return;
    }

    const title = document.getElementById("new-title").value;
    const category = document.getElementById("new-category").value;
    const description = document.getElementById("new-desc").value;
    const goalAmount = document.getElementById("new-goal").value;

    try {
        const response = await fetch(`${API_URL}/campaign/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title: title, 
                category: category, 
                description: description, 
                goalAmount: parseFloat(goalAmount),
                creatorName: currentUser.name,
                creatorEmail: currentUser.email
            })
        });

        if (response.ok) {
            alert("🎉 New Campaign Launched Successfully!");
            event.target.reset();
            loadAllCampaigns();
        } else {
            alert("Failed to create campaign.");
        }
    } catch (error) {
        alert("Server error while launching campaign.");
    }
}

// 5. EDIT CAMPAIGN
async function editCampaign(id, currentTitle, currentDesc, currentGoal, currentCategory) {
    const newTitle = prompt("Update Title:", currentTitle);
    const newCategory = prompt("Update Category (Tech, Eco, Gaming, General):", currentCategory || "General");
    const newDesc = prompt("Update Description:", currentDesc);
    const newGoal = prompt("Update Goal Amount ($):", currentGoal);

    if (!newTitle || !newGoal) return;

    try {
        const response = await fetch(`${API_URL}/campaign/update/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newTitle,
                category: newCategory,
                description: newDesc,
                goalAmount: parseFloat(newGoal)
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            loadAllCampaigns();
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert("Failed to update campaign.");
    }
}

// 6. DELETE CAMPAIGN
async function deleteCampaign(id) {
    const confirmDelete = confirm("Are you sure you want to delete this campaign?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_URL}/campaign/delete/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            loadAllCampaigns();
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert("Failed to delete campaign.");
    }
}

// 💳 PAYMENT MODAL FUNCTIONS
function pledgeAmount(campaignId, campaignTitle) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert("Please login first to make a payment!");
        window.location.href = "auth.html";
        return;
    }

    document.getElementById('modal-campaign-id').value = campaignId;
    document.getElementById('modal-campaign-title').innerText = `Project: ${campaignTitle}`;
    document.getElementById('payment-modal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

function togglePaymentFields() {
    const method = document.getElementById('payment-method').value;
    document.getElementById('upi-field').style.display = method === 'upi' ? 'block' : 'none';
    document.getElementById('card-field').style.display = method === 'card' ? 'block' : 'none';
    document.getElementById('netbanking-field').style.display = method === 'netbanking' ? 'block' : 'none';
}

async function processPayment(event) {
    event.preventDefault();

    const campaignId = document.getElementById('modal-campaign-id').value;
    const amount = document.getElementById('payment-amount').value;
    const paymentMethod = document.getElementById('payment-method').value.toUpperCase();

    if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/donate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId, amount: parseFloat(amount) })
        });

        if (response.ok) {
            alert(`✅ Payment Successful via ${paymentMethod}! Thank you for your support.`);
            closePaymentModal();
            loadAllCampaigns();
        } else {
            alert("Payment failed. Please try again.");
        }
    } catch (error) {
        alert("Server error during payment processing.");
    }
}

// 8. SESSION CHECK & NAVBAR UPDATE
function checkUserSession() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const dashLink = document.getElementById('dash-link');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');

    if (user && user.name) {
        if (dashLink) dashLink.style.display = 'inline';
        if (userInfo) {
            userInfo.innerText = `👋 Hi, ${user.name}`;
            userInfo.style.display = 'inline';
        }
        if (logoutBtn) logoutBtn.style.display = 'inline';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    alert("Logged out successfully!");
    window.location.href = 'auth.html';
}

// Initial Calls
loadAllCampaigns();
checkUserSession();