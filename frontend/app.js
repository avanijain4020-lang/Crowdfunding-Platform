const API_URL = 'http://localhost:5000/api/campaigns';

// 1. Backend se campaigns lekar screen par dikhana (With Progress Bar, Filter & Delete Button)
async function fetchCampaigns(selectedCategory = 'all') {
    try {
        let url = API_URL;
        if (selectedCategory !== 'all') {
            url = `${API_URL}/filter?category=${selectedCategory}`;
        }

        const response = await fetch(url);
        const campaigns = await response.json();
        
        const container = document.getElementById('campaignsContainer');
        container.innerHTML = ''; 

        if (campaigns.length === 0) {
            container.innerHTML = `<p style="grid-column: span 2; text-align: center; color: #666;">No campaigns found. Create the first one from the left panel! 🚀</p>`;
            return;
        }

        campaigns.forEach(campaign => {
            let percentage = Math.round((campaign.raised / campaign.goal) * 100);
            if (percentage > 100) percentage = 100;

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${campaign.title}</h3>
                <p><span class="tag">${campaign.category}</span></p>
                <p><strong>Goal:</strong> $${campaign.goal}</p>
                <p><strong>Raised:</strong> $${campaign.raised}</p>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <span class="percentage-text">${percentage}% Funded</span>

                <div style="margin-top: 1rem;">
                    <input type="number" id="amt-${campaign._id}" placeholder="Amount ($)" style="width: 55%; padding: 6px; margin-right: 5px; border: 1px solid #ddd; border-radius:4px;">
                    <button onclick="donate('${campaign._id}')" style="width: 35%; padding: 7px; background: #10b981; color: white; border: none; cursor: pointer; font-weight:bold; border-radius:4px;">Fund</button>
                </div>

                <div style="margin-top: 0.5rem;">
                    <button onclick="deleteCampaign('${campaign._id}')" style="width: 100%; padding: 6px; background: #ef4444; color: white; border: none; cursor: pointer; font-weight:bold; border-radius:4px;">❌ Close Campaign</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching campaigns:", error);
    }
}

// Dropdown filter change hone par data reload karo
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    fetchCampaigns(e.target.value);
});

// 2. Naya campaign form se lekar backend par bhejna (POST)
document.getElementById('campaignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const goal = document.getElementById('goal').value;
    const category = document.getElementById('category').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, goal, category })
        });

        if (response.ok) {
            alert("Campaign Launched and Saved to Database! 💾🚀");
            document.getElementById('campaignForm').reset();
            document.getElementById('categoryFilter').value = 'all';
            fetchCampaigns();
        }
    } catch (error) {
        console.error("Error creating campaign:", error);
    }
});

// 3. Campaign mein paise donate karna (PUT)
async function donate(id) {
    const amountInput = document.getElementById(`amt-${id}`);
    const amount = amountInput.value;

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}/pledge`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        if (response.ok) {
            alert("Thank you for your donation! 🎉");
            const currentFilter = document.getElementById('categoryFilter').value;
            fetchCampaigns(currentFilter);
        } else {
            alert("Donation failed. Check if campaign exists.");
        }
    } catch (error) {
        console.error("Error donating:", error);
    }
}

// 4. Campaign ko delete karne ka function (DELETE)
async function deleteCampaign(id) {
    if (!confirm("Are you sure you want to close this campaign? 😮")) {
        return; 
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Campaign Closed and Removed! 🗑️");
            const currentFilter = document.getElementById('categoryFilter').value;
            fetchCampaigns(currentFilter); 
        } else {
            alert("Failed to delete campaign.");
        }
    } catch (error) {
        console.error("Error deleting campaign:", error);
    }
}

window.onload = () => fetchCampaigns();