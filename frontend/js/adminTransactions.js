let allTransactions = [];

export async function fetchAndDisplayTransactions() {
  const loadingEl = document.getElementById("loadingTransactions");
  const listEl = document.getElementById("transactionsList");

  loadingEl.style.display = "block";

  try {
    const response = await fetch("http://localhost:8000/api/transactions");
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }
    const transactions = await response.json();
    allTransactions = transactions; // Store for filtering later

    loadingEl.style.display = "none";

    if (!transactions || transactions.length === 0) {
      listEl.innerHTML = "<p>No transactions found.</p>";
      return;
    }

    displayTransactions(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    loadingEl.style.display = "none";
    listEl.innerHTML = `<p>Error loading transactions: ${error.message}</p>`;
  }
}

export function filterTransactions(landId) {
  if (!allTransactions || allTransactions.length === 0) {
    document.getElementById("transactionsList").innerHTML =
      "<p>No transactions found.</p>";
    return;
  }
  if (!landId) {
    displayTransactions(allTransactions);
    return;
  }

  const filtered = allTransactions.filter(
    (tx) => String(tx.land_id) === landId
  );
  if (filtered.length === 0) {
    document.getElementById("transactionsList").innerHTML =
      "<p>No matching transactions found.</p>";
    return;
  }
  displayTransactions(filtered);
}

function displayTransactions(transactions) {
  const listEl = document.getElementById("transactionsList");
  listEl.innerHTML = "";
  transactions.forEach((tx) => {
    const item = document.createElement("div");
    item.className = "transaction-item";
    item.innerHTML = `
      <div><strong>Type:</strong> ${tx.type}</div>
      <div><strong>Land ID:</strong> ${tx.land_id}</div>
      <div><strong>Date:</strong> ${new Date(
        tx.timestamp
      ).toLocaleString()}</div>
      <div><strong>From:</strong> ${tx.initiator}</div>
      <div><strong>To:</strong> ${tx.recipient || "N/A"}</div>
    `;
    listEl.appendChild(item);
  });
}
